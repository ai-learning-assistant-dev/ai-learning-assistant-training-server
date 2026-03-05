import { Hono } from 'hono';
import { eq, inArray, asc, and } from 'drizzle-orm';
import { mainDb, userDb } from '@db/index';
import { courses, chapters, sections, exercises } from '@db/main/schema';
import { userSectionUnlocks } from '@db/user/schema';
import { createCrudRoutes } from './_crud';
import { createCourseSchema, updateCourseSchema } from '@schemas/course';
import { ok, fail } from '@schemas/common';

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
  }),
);

// ── POST /getCourseChaptersSections ─────────────────

app.post('/getCourseChaptersSections', async c => {
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
});

export default app;
