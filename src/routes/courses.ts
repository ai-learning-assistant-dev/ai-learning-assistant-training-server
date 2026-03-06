import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { eq, inArray, asc, and } from 'drizzle-orm';
import { mainDb, userDb } from '@db/index';
import { courses, chapters, sections, exercises, exerciseOptions, leadingQuestions } from '@db/main/schema';
import { userSectionUnlocks } from '@db/user/schema';
import { createCrudRoutes } from './_crud';
import { createCourseSchema, updateCourseSchema, importCourseSchema } from '@schemas/course';
import { ok, fail } from '@schemas/common';
import { jsonBody, jsonResponse, apiErrorSchema } from '@schemas/openapi';
import { z } from 'zod';

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
    const { course_id, user_id } = await c.req.json();
    if (!course_id || !user_id) return c.json(fail('course_id 和 user_id 必填'), 400);

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
  },
);

// ── POST /import ─────────────────────────────────────

/** 整体导入课程（含章节、小节、练习、选项、引导问题），使用事务保证原子性 */
app.post(
  '/import',
  describeRoute({
    tags: ['课程管理'],
    summary: '整体导入课程数据（含章节/小节/练习/选项/引导问题）',
    requestBody: jsonBody(importCourseSchema) as any,
    responses: {
      201: jsonResponse('导入成功', z.object({ success: z.literal(true), data: z.object({ course_id: z.uuid(), name: z.string() }), message: z.string() })),
      400: jsonResponse('请求参数错误', apiErrorSchema),
    },
  }),
  async c => {
    const body = await c.req.json();
    const payload = importCourseSchema.parse(body);

    const result = await mainDb.transaction(async tx => {
      // 1. 插入课程
      const [course] = await tx
        .insert(courses)
        .values({ name: payload.title, icon_url: payload.icon_url || null, description: payload.description, category: payload.category, contributors: payload.contributors })
        .returning();

      const courseId = course!.course_id;

      for (const ch of payload.chapters) {
        // 2. 插入章节
        const [chapter] = await tx.insert(chapters).values({ course_id: courseId, title: ch.title, chapter_order: ch.order }).returning();

        const chapterId = chapter!.chapter_id;

        for (const sec of ch.sections) {
          // 3. 插入小节
          const [section] = await tx
            .insert(sections)
            .values({
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
            const [exercise] = await tx.insert(exercises).values({ section_id: sectionId, question: ex.question, type_status: ex.type, score: ex.score }).returning();

            const exerciseId = exercise!.exercise_id;

            if (ex.options.length > 0) {
              await tx.insert(exerciseOptions).values(
                ex.options.map(opt => ({
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
                section_id: sectionId,
                question: lq.question,
              })),
            );
          }
        }
      }

      return { course_id: courseId, name: payload.title };
    });

    return c.json(ok(result, '课程导入成功'), 201);
  },
);

export default app;
