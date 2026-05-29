import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { mainDb } from '@db/index';
import { leadingQuestions } from '@db/main/schema';
import { createCrudRoutes } from './_crud';
import { createLeadingQuestionSchema, updateLeadingQuestionSchema, searchBySectionSchema } from '@schemas/leadingQuestion';
import { ok, paginate } from '@schemas/common';

const app = new Hono();

// 标准 CRUD 路由
app.route(
  '/',
  createCrudRoutes({
    db: () => mainDb,
    table: leadingQuestions,
    idColumn: leadingQuestions.question_id,
    idField: 'question_id',
    createSchema: createLeadingQuestionSchema,
    updateSchema: updateLeadingQuestionSchema,
    tag: '课程管理',
    entityName: '引导问题',
  }),
);

// POST /searchBySection — 按 section_id 查询引导问题
app.post('/searchBySection', async c => {
  const { section_id, page, limit } = searchBySectionSchema.parse(await c.req.json());

  const offset = (page - 1) * limit;

  const rows = await mainDb.select().from(leadingQuestions).where(eq(leadingQuestions.section_id, section_id)).limit(limit).offset(offset);

  const totalResult = await mainDb
    .select({ count: sql<number>`count(*)::int` })
    .from(leadingQuestions)
    .where(eq(leadingQuestions.section_id, section_id));

  const total = Number(totalResult[0]?.count ?? 0);

  return c.json(paginate(rows, total, page, limit));
});

export default app;
