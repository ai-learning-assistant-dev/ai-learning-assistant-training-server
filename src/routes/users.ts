import { Hono } from 'hono';
import { eq, like, sql, inArray } from 'drizzle-orm';
import { mainDb, userDb } from '@db/index';
import { courses, chapters, sections } from '@db/main/schema';
import { users, courseSchedules, dailySummaries } from '@db/user/schema';
import { createCrudRoutes } from './_crud';
import { createUserSchema, updateUserSchema } from '@schemas/user';
import { searchSchema, ok, fail, paginate } from '@schemas/common';
import logger from '@utils/logger';

const app = new Hono();

// ── GET /firstUser ──────────────────────────────────

app.get('/firstUser', async c => {
  const rows = await userDb.select().from(users).limit(1);
  if (!rows[0]) return c.json(fail('没有用户数据'), 404);
  return c.json(ok(rows[0]));
});

// ── POST /courseChaptersSectionsByUser ───────────────

app.post('/courseChaptersSectionsByUser', async c => {
  const { user_id } = await c.req.json();
  if (!user_id) return c.json(fail('user_id 必填'), 400);

  // 1. 查课程安排
  const schedules = await userDb.select().from(courseSchedules).where(eq(courseSchedules.user_id, user_id));
  const courseIds = schedules.map(s => s.course_id);
  if (!courseIds.length) return c.json(ok([]));

  // 2. 查课程
  const courseList = await mainDb.select().from(courses).where(inArray(courses.course_id, courseIds));

  // 3. 查章节
  const chapterList = await mainDb.select().from(chapters).where(inArray(chapters.course_id, courseIds));
  const chapterIds = chapterList.map(ch => ch.chapter_id);

  // 4. 查小节
  const sectionList = chapterIds.length > 0 ? await mainDb.select().from(sections).where(inArray(sections.chapter_id, chapterIds)) : [];

  // 5. 组装结构 — 计算进度百分比
  const courseMap = courseList.map(course => {
    const courseChapters = chapterList.filter(ch => ch.course_id === course.course_id);
    const allSections = courseChapters.flatMap(ch => sectionList.filter(sec => sec.chapter_id === ch.chapter_id));
    const maxOrder = allSections.length > 0 ? Math.max(...allSections.map(sec => sec.section_order)) : 0;

    const schedule = schedules.find(s => s.course_id === course.course_id);
    const statusNum = schedule?.status ? parseInt(schedule.status, 10) : 0;
    const percent = maxOrder > 0 ? Math.round((statusNum / maxOrder) * 100) : 0;

    return { ...course, progress: percent };
  });

  return c.json(ok(courseMap));
});

// ── GET /allCourses ─────────────────────────────────

app.get('/allCourses', async c => {
  const rows = await mainDb.select().from(courses);
  return c.json(ok(rows));
});

// ── POST /testJoinById ──────────────────────────────

app.post('/testJoinById', async c => {
  const { user_id } = await c.req.json();
  if (!user_id) return c.json(fail('user_id 必填'), 400);

  const user = await userDb.query.users.findFirst({
    where: eq(users.user_id, user_id),
    with: { dailySummaries: true },
  });
  if (!user) return c.json(fail('用户不存在'), 404);

  return c.json(ok(user));
});

// ── POST /search（带模糊搜索）───────────────────────

app.post('/search', async c => {
  const body = await c.req.json();
  const { page = 1, limit = 20 } = searchSchema.parse(body);
  const offset = (page - 1) * limit;

  const whereClauses = body.name ? like(users.name, `%${body.name}%`) : undefined;

  const [rows, totalResult] = await Promise.all([
    userDb.select().from(users).where(whereClauses).limit(limit).offset(offset),
    userDb
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClauses),
  ]);
  const total = Number(totalResult[0]?.count ?? 0);

  return c.json(paginate(rows, total, page, limit));
});

// ── POST /getById ───────────────────────────────────

app.post('/getById', async c => {
  const { user_id } = await c.req.json();
  if (!user_id) return c.json(fail('缺少 user_id'), 400);

  const rows = await userDb.select().from(users).where(eq(users.user_id, user_id)).limit(1);
  if (!rows[0]) return c.json(fail('用户不存在'), 404);

  return c.json(ok(rows[0]));
});

// ── POST /add ───────────────────────────────────────

app.post('/add', async c => {
  const body = createUserSchema.parse(await c.req.json());
  const result = await userDb.insert(users).values(body).returning();
  return c.json(ok(result[0], '用户创建成功'));
});

// ── POST /update ────────────────────────────────────

app.post('/update', async c => {
  const body = updateUserSchema.parse(await c.req.json());
  const existing = await userDb.select().from(users).where(eq(users.user_id, body.user_id)).limit(1);
  if (!existing[0]) return c.json(fail('用户不存在'), 404);

  const { user_id, ...data } = body;
  const result = await userDb.update(users).set(data).where(eq(users.user_id, user_id)).returning();
  return c.json(ok(result[0], '用户信息更新成功'));
});

// ── POST /delete ────────────────────────────────────

app.post('/delete', async c => {
  const { user_id } = await c.req.json();
  if (!user_id) return c.json(fail('缺少 user_id'), 400);

  const existing = await userDb.select().from(users).where(eq(users.user_id, user_id)).limit(1);
  if (!existing[0]) return c.json(fail('用户不存在'), 404);

  await userDb.delete(users).where(eq(users.user_id, user_id));
  return c.json(ok(null, '用户删除成功'));
});

export default app;
