import { mainDb, userDb } from '@db/index';
import { courses, chapters, sections, exercises, exerciseOptions, leadingQuestions, aiPersonas } from '@db/main/schema';
import { userSectionUnlocks } from '@db/user/schema';
import { fail, ok } from '@schemas/common';
import { courseChaptersSectionsRequestSchema, createCourseSchema, type ImportCoursePayload, importCourseSchema, updateCourseSchema } from '@schemas/course';
import { apiErrorSchema, jsonBody, jsonResponse } from '@schemas/openapi';
import logger from '@utils/logger';
import AdmZip from 'adm-zip';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { z } from 'zod';
import { createCrudRoutes } from './_crud';

const app = new Hono();

// ── 标准 CRUD ───────────────────────────────────────

app.route(
  '/',
  createCrudRoutes({
    db: () => mainDb,
    table: courses,
    idColumn: courses.course_id,
    idField: 'course_id',
    createSchema: createCourseSchema,
    updateSchema: updateCourseSchema,
    tag: '课程管理',
    entityName: '课程',
    afterDelete: async record => {
      const courseId = (record as { course_id: string }).course_id;

      // 查询该课程下所有章节
      const chapterRows = await mainDb.select({ chapter_id: chapters.chapter_id }).from(chapters).where(eq(chapters.course_id, courseId));
      const chapterIds = chapterRows.map(r => r.chapter_id);

      if (chapterIds.length > 0) {
        // 查询所有小节
        const sectionRows = await mainDb.select({ section_id: sections.section_id }).from(sections).where(inArray(sections.chapter_id, chapterIds));
        const sectionIds = sectionRows.map(r => r.section_id);

        if (sectionIds.length > 0) {
          // 查询所有练习
          const exerciseRows = await mainDb.select({ exercise_id: exercises.exercise_id }).from(exercises).where(inArray(exercises.section_id, sectionIds));
          const exerciseIds = exerciseRows.map(r => r.exercise_id);

          // 删除练习选项
          if (exerciseIds.length > 0) {
            await mainDb.delete(exerciseOptions).where(inArray(exerciseOptions.exercise_id, exerciseIds));
          }
          // 删除练习
          await mainDb.delete(exercises).where(inArray(exercises.section_id, sectionIds));
          // 删除引导问题
          await mainDb.delete(leadingQuestions).where(inArray(leadingQuestions.section_id, sectionIds));
        }
        // 删除小节
        await mainDb.delete(sections).where(inArray(sections.chapter_id, chapterIds));
      }
      // 删除章节
      await mainDb.delete(chapters).where(eq(chapters.course_id, courseId));
    },
  }),
);

// ── POST /getCourseChaptersSections ─────────────────

/** 获取课程完整的章节-小节树形结构，包含用户解锁状态与瀑布式逐级解锁逻辑 */
app.post(
  '/getCourseChaptersSections',
  describeRoute({
    tags: ['课程管理'],
    summary: '获取课程完整的章节-小节树形结构，包含用户解锁状态与瀑布式逐级解锁逻辑',
    requestBody: jsonBody(z.object({ course_id: z.uuid(), user_id: z.uuid() })) as any,
    responses: {
      200: jsonResponse('课程章节树形结构'),
      400: jsonResponse('参数缺失', apiErrorSchema),
      404: jsonResponse('课程不存在', apiErrorSchema),
    },
  }),
  async c => {
    let course_id: string | undefined, user_id: string | undefined;
    try {
      ({ course_id, user_id } = courseChaptersSectionsRequestSchema.parse(await c.req.json()));

      const course = await mainDb.select().from(courses).where(eq(courses.course_id, course_id)).limit(1);
      if (!course[0]) return c.json(fail('课程不存在'), 404);

      // 1. 查章节 + 小节
      const chapterRows = await mainDb.select().from(chapters).where(eq(chapters.course_id, course_id)).orderBy(asc(chapters.chapter_order));
      const chapterIds = chapterRows.map(c => c.chapter_id);

      const sectionRows = chapterIds.length > 0 ? await mainDb.select().from(sections).where(inArray(sections.chapter_id, chapterIds)).orderBy(asc(sections.section_order)) : [];

      // 1.1 查哪些 section 有练习
      const sectionIds = sectionRows.map(s => s.section_id);
      const exerciseList = sectionIds.length > 0 ? await mainDb.select({ section_id: exercises.section_id }).from(exercises).where(inArray(exercises.section_id, sectionIds)) : [];
      const exerciseSet = new Set(exerciseList.map(e => e.section_id));

      // 2. 查用户解锁记录（跨库）
      const userUnlocks =
        chapterIds.length > 0
          ? await userDb
              .select()
              .from(userSectionUnlocks)
              .where(and(eq(userSectionUnlocks.user_id, user_id), inArray(userSectionUnlocks.chapter_id, chapterIds)))
          : [];
      const unlockMap = new Map(userUnlocks.map(u => [u.section_id, u.unlocked]));

      // 3. 组装数据
      const chapterList = chapterRows.map(ch => {
        const chSections = sectionRows
          .filter(s => s.chapter_id === ch.chapter_id)
          .map(sec => ({
            ...sec,
            unlocked: process.env.UNLOCK_ALL_SECTION === 'true' ? 2 : unlockMap.get(sec.section_id) || 0,
            has_exercise: exerciseSet.has(sec.section_id),
          }));
        return { ...ch, unlocked: 0, sections: chSections } as any;
      });

      // 4. 瀑布式解锁逻辑
      let lastSectionPassed = false;
      let nextSectionUnlocked = false;

      let firstNonEmptyChapterIndex = -1;
      for (let i = 0; i < chapterList.length; i++) {
        if (chapterList[i].sections.some((s: any) => s.has_exercise)) {
          firstNonEmptyChapterIndex = i;
          break;
        }
      }
      if (firstNonEmptyChapterIndex !== -1) {
        const first = chapterList[firstNonEmptyChapterIndex].sections[0];
        if (first && first.unlocked === 0) first.unlocked = 1;
      }

      for (let i = 0; i < chapterList.length; i++) {
        const chapter = chapterList[i];
        let allPassed = chapter.sections.length > 0;
        let inProgress = false;

        for (let j = 0; j < chapter.sections.length; j++) {
          const sec = chapter.sections[j];

          if (!sec.has_exercise) {
            if ((i === 0 && j === 0) || process.env.UNLOCK_ALL_SECTION === 'true' || lastSectionPassed) {
              if (sec.unlocked === 0) sec.unlocked = 2;
              lastSectionPassed = true;
              nextSectionUnlocked = false;
              inProgress = inProgress || sec.unlocked > 0;
              continue;
            }
            allPassed = false;
            continue;
          }

          if (lastSectionPassed && !nextSectionUnlocked) {
            if (sec.unlocked === 0) sec.unlocked = 1;
            nextSectionUnlocked = true;
          }

          if (sec.unlocked === 2) {
            lastSectionPassed = true;
            nextSectionUnlocked = false;
          } else {
            lastSectionPassed = false;
            allPassed = false;
          }
          if (sec.unlocked > 0) inProgress = true;
        }

        const hasExercise = chapter.sections.some((s: any) => s.has_exercise);
        if (!hasExercise) {
          if (lastSectionPassed || chapter.unlocked === 2) chapter.unlocked = 2;
        } else {
          if (allPassed) chapter.unlocked = 2;
          else if (inProgress) chapter.unlocked = 1;
        }

        if (chapter.unlocked === 2) {
          let next = i + 1;
          while (next < chapterList.length) {
            const nc = chapterList[next];
            if (nc.sections.some((s: any) => s.has_exercise)) {
              const first = nc.sections[0];
              if (first && first.unlocked === 0) first.unlocked = 1;
              break;
            } else {
              nc.unlocked = 2;
              next++;
            }
          }
        }
      }

      return c.json(
        ok({
          course_id: course[0]!.course_id,
          course_name: course[0]!.name,
          chapters: chapterList,
        }),
      );
    } catch (err) {
      logger.error(`[courses] 获取课程章节树失败 (course_id=${course_id}, user_id=${user_id}):`, err);
      return c.json(fail('获取课程章节树失败'), 500);
    }
  },
);

// ── 公共导入函数 ─────────────────────────────────────

/**
 * 删除课程及其关联数据（章节、小节、练习、选项、引导问题）
 * @param courseId 课程 ID
 */
async function deleteCourseWithRelations(courseId: string) {
  // 查询该课程下所有章节
  const chapterRows = await mainDb.select({ chapter_id: chapters.chapter_id }).from(chapters).where(eq(chapters.course_id, courseId));
  const chapterIds = chapterRows.map(r => r.chapter_id);

  if (chapterIds.length > 0) {
    // 查询所有小节
    const sectionRows = await mainDb.select({ section_id: sections.section_id }).from(sections).where(inArray(sections.chapter_id, chapterIds));
    const sectionIds = sectionRows.map(r => r.section_id);

    if (sectionIds.length > 0) {
      // 查询所有练习
      const exerciseRows = await mainDb.select({ exercise_id: exercises.exercise_id }).from(exercises).where(inArray(exercises.section_id, sectionIds));
      const exerciseIds = exerciseRows.map(r => r.exercise_id);

      // 删除练习选项
      if (exerciseIds.length > 0) {
        await mainDb.delete(exerciseOptions).where(inArray(exerciseOptions.exercise_id, exerciseIds));
      }
      // 删除练习
      await mainDb.delete(exercises).where(inArray(exercises.section_id, sectionIds));
      // 删除引导问题
      await mainDb.delete(leadingQuestions).where(inArray(leadingQuestions.section_id, sectionIds));
    }
    // 删除小节
    await mainDb.delete(sections).where(inArray(sections.chapter_id, chapterIds));
  }
  // 删除章节
  await mainDb.delete(chapters).where(eq(chapters.course_id, courseId));
  // 删除课程
  await mainDb.delete(courses).where(eq(courses.course_id, courseId));
}

/**
 * 导入课程数据的公共函数
 * @param payload 课程导入数据
 * @returns 导入结果
 */
async function importCourseData(payload: ImportCoursePayload, override = false) {
  // 去重检查：按课程名称检查是否已存在
  const existingSameId = await mainDb.select({ course_id: courses.course_id, name: courses.name }).from(courses).where(eq(courses.course_id, payload.course_id)).limit(1);
  const existingSameName = await mainDb.select({ course_id: courses.course_id, name: courses.name }).from(courses).where(eq(courses.name, payload.title)).limit(1);

  if (existingSameId[0]) {
    // 课程已存在，检查是否需要覆盖
    if (!override) {
      // 没有 override 参数，返回课程已存在的信息
      throw { status: 409, error: fail('相同id课程已存在', { course_id: existingSameId[0].course_id, name: existingSameId[0].name }) };
    }
    // 有 override 参数，先删除已存在的课程及相关数据
    await deleteCourseWithRelations(existingSameId[0].course_id);
  } else if (existingSameName[0]) {
    // 课程已存在，检查是否需要覆盖
    throw { status: 409, error: fail('相同名称课程已存在', { course_id: existingSameName[0].course_id, name: existingSameName[0].name }) };
  }

  const result = await mainDb.transaction(async tx => {
    let defaultPersonaId: string | null = null;

    // 1. 处理课程携带的人设，并作为该课程默认人设
    if (payload.ai_persona) {
      const personaPayload = payload.ai_persona;

      if (personaPayload.persona_id) {
        const existingPersona = await tx.select({ persona_id: aiPersonas.persona_id }).from(aiPersonas).where(eq(aiPersonas.persona_id, personaPayload.persona_id)).limit(1);

        if (existingPersona[0]) {
          await tx
            .update(aiPersonas)
            .set({
              name: personaPayload.name,
              prompt: personaPayload.prompt,
              is_default_template: personaPayload.is_default_template,
            })
            .where(eq(aiPersonas.persona_id, personaPayload.persona_id));
        } else {
          await tx.insert(aiPersonas).values({
            persona_id: personaPayload.persona_id,
            name: personaPayload.name,
            prompt: personaPayload.prompt,
            is_default_template: personaPayload.is_default_template,
          });
        }
        defaultPersonaId = personaPayload.persona_id;
      } else {
        const [createdPersona] = await tx
          .insert(aiPersonas)
          .values({
            name: personaPayload.name,
            prompt: personaPayload.prompt,
            is_default_template: personaPayload.is_default_template,
          })
          .returning({ persona_id: aiPersonas.persona_id });
        defaultPersonaId = createdPersona?.persona_id ?? null;
      }
    }

    // 1. 插入课程
    const [course] = await tx
      .insert(courses)
      .values({
        course_id: payload.course_id,
        name: payload.title,
        icon_url: payload.icon_url || null,
        description: payload.description,
        category: payload.category,
        contributors: payload.contributors,
        default_ai_persona_id: defaultPersonaId,
      })
      .returning();

    const courseId = course!.course_id;

    for (const ch of payload.chapters) {
      // 2. 插入章节
      const [chapter] = await tx.insert(chapters).values({ chapter_id: ch.chapter_id, course_id: courseId, title: ch.title, chapter_order: ch.order }).returning();

      const chapterId = chapter!.chapter_id;

      for (const sec of ch.sections) {
        // 3. 插入小节
        const [section] = await tx
          .insert(sections)
          .values({
            section_id: sec.section_id,
            chapter_id: chapterId,
            title: sec.title,
            section_order: sec.order,
            video_url: sec.video_url,
            knowledge_content: sec.knowledge_content,
            estimated_time: sec.estimated_time,
            knowledge_points: sec.knowledge_points ?? null,
            video_subtitles: sec.video_subtitles,
          })
          .returning();

        const sectionId = section!.section_id;

        // 4. 插入练习及选项
        for (const ex of sec.exercises) {
          const [exercise] = await tx
            .insert(exercises)
            .values({ exercise_id: ex.exercise_id, section_id: sectionId, question: ex.question, type_status: ex.type, score: ex.score })
            .returning();

          const exerciseId = exercise!.exercise_id;

          if (ex.options.length > 0) {
            await tx.insert(exerciseOptions).values(
              ex.options.map(opt => ({
                option_id: opt.option_id,
                exercise_id: exerciseId,
                option_text: opt.text,
                is_correct: opt.is_correct,
              })),
            );
          }
        }

        // 5. 插入引导问题
        if (sec.leading_questions.length > 0) {
          await tx.insert(leadingQuestions).values(
            sec.leading_questions.map(lq => ({
              question_id: lq.question_id,
              section_id: sectionId,
              question: lq.question,
            })),
          );
        }
      }
    }

    return { course_id: courseId, name: payload.title };
  });

  return result;
}

// ── POST /import ─────────────────────────────────────

/** 整体导入课程（含章节、小节、练习、选项、引导问题），使用事务保证原子性 */
app.post(
  '/import',
  describeRoute({
    tags: ['课程管理'],
    summary: '整体导入课程数据（含章节/小节/练习/选项/引导问题）',
    requestBody: jsonBody(importCourseSchema) as any,
    parameters: [
      {
        name: 'override',
        in: 'query',
        schema: {
          type: 'boolean',
        },
      },
    ],
    responses: {
      201: jsonResponse('导入成功', z.object({ success: z.literal(true), data: z.object({ course_id: z.uuid(), name: z.string() }), message: z.string() })),
      400: jsonResponse('请求参数错误', apiErrorSchema),
    },
  }),
  async c => {
    try {
      const body = await c.req.json();
      const override = c.req.query('override') === 'true';
      const payload = importCourseSchema.parse(body);
      const result = await importCourseData(payload, override);
      return c.json(ok(result, '课程导入成功'), 201);
    } catch (error: any) {
      if (error.status === 409) {
        return c.json(error.error, 409);
      }
      return c.json(fail('导入失败', error.message), 500);
    }
  },
);

// ── POST /import-zip ─────────────────────────────────

/** 通过 ZIP 文件批量导入课程，递归读取压缩包内的所有 course*.json 文件并导入 */
app.post(
  '/import-zip',
  describeRoute({
    tags: ['课程管理'],
    summary: '通过 ZIP 文件批量导入课程，递归读取压缩包内的所有 course*.json 文件并导入',
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              file: {
                type: 'string',
                format: 'binary',
                description: '上传的文件',
              },
            },
          },
        },
      },
    },
    parameters: [
      {
        name: 'override',
        in: 'query',
        schema: {
          type: 'boolean',
        },
      },
    ],
    responses: {
      201: jsonResponse(
        '批量导入成功',
        z.object({
          success: z.literal(true),
          data: z.object({
            total: z.number().int(),
            success: z.number().int(),
            failed: z.number().int(),
            results: z.array(
              z.object({
                filename: z.string(),
                success: z.boolean(),
                course_id: z.uuid().optional(),
                name: z.string().optional(),
                error: z.string().optional(),
              }),
            ),
          }),
          message: z.string(),
        }),
      ),
      400: jsonResponse('请求参数错误', apiErrorSchema),
      500: jsonResponse('服务器内部错误', apiErrorSchema),
    },
  }),
  async c => {
    try {
      const formData = await c.req.formData();
      const override = c.req.query('override') === 'true';
      const file = formData.get('file') as File | null;

      if (!file) {
        return c.json(fail('请上传 ZIP 文件'), 400);
      }

      // 检查文件类型
      if (!file.type.includes('zip') && !file.name.toLowerCase().endsWith('.zip')) {
        return c.json(fail('请上传 ZIP 格式文件'), 400);
      }

      // 读取文件内容
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 解析 ZIP 文件
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();

      // 递归查找所有 course*.json 文件
      const courseFiles: { entry: AdmZip.IZipEntry; path: string }[] = [];

      function findCourseFiles(entries: AdmZip.IZipEntry[], basePath = '') {
        for (const entry of entries) {
          const entryPath = basePath ? `${basePath}/${entry.entryName}` : entry.entryName;
          if (entry.isDirectory) {
            const allEntries = zip.getEntries();
            const dirEntries = allEntries.filter(e => e.entryName.startsWith(entry.entryName + '/') && e.entryName !== entry.entryName);
            if (dirEntries.length > 0) {
              findCourseFiles(dirEntries, entryPath);
            }
          } else if (entry.name.match(/^course.*\.json$/i)) {
            // 匹配 course*.json 文件
            courseFiles.push({ entry, path: entryPath });
          }
        }
      }

      findCourseFiles(zipEntries);

      if (courseFiles.length === 0) {
        return c.json(fail('ZIP 文件中未找到 course*.json 文件'), 400);
      }

      // 处理每个课程文件
      const results: Array<{
        filename: string;
        success: boolean;
        course_id?: string;
        name?: string;
        error?: string;
      }> = [];

      let successCount = 0;
      let failedCount = 0;

      for (const { entry, path } of courseFiles) {
        try {
          // 读取 JSON 文件内容
          const fileContent = entry.getData().toString('utf8');
          const jsonData = JSON.parse(fileContent);

          // 验证数据格式
          const payload = importCourseSchema.parse(jsonData);

          // 导入课程
          const result = await importCourseData(payload, override);

          results.push({
            filename: path,
            success: true,
            course_id: result.course_id,
            name: result.name,
          });
          successCount++;
        } catch (error: any) {
          results.push({
            filename: path,
            success: false,
            error: error.message || '导入失败',
          });
          failedCount++;
        }
      }

      return c.json(
        ok(
          {
            total: courseFiles.length,
            success: successCount,
            failed: failedCount,
            results,
          },
          `批量导入完成，成功 ${successCount} 个，失败 ${failedCount} 个`,
        ),
        201,
      );
    } catch (error: any) {
      return c.json(fail('处理 ZIP 文件失败', error.message), 500);
    }
  },
);

export default app;
