import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { eq } from 'drizzle-orm';
import { mainDb } from '@db/index';
import { systemPrompts } from '@db/main/schema';
import { updateSystemPromptSchema } from '@schemas/systemPrompt';
import { ok, fail } from '@schemas/common';

const app = new Hono();

/** GET / — 获取全部系统提示词 */
app.get(
  '/',
  describeRoute({
    tags: ['AI 管理'],
    summary: '获取全部系统提示词',
  }),
  async c => {
    const rows = await mainDb.select().from(systemPrompts);
    return c.json(ok(rows));
  },
);

/** GET /keys — 获取全部 title 列表 */
app.get(
  '/keys',
  describeRoute({
    tags: ['AI 管理'],
    summary: '获取全部 title 列表',
  }),
  async c => {
    const rows = await mainDb.select({ title: systemPrompts.title }).from(systemPrompts);
    return c.json(ok(rows.map(r => r.title)));
  },
);

/** GET /:title — 按 title 查找 */
app.get(
  '/:title',
  describeRoute({
    tags: ['AI 管理'],
    summary: '按 title 查找系统提示词',
  }),
  async c => {
    const title = c.req.param('title');
    const rows = await mainDb.select().from(systemPrompts).where(eq(systemPrompts.title, title)).limit(1);
    if (!rows[0]) return c.json(fail('未找到记录'), 404);
    return c.json(ok(rows[0]));
  },
);

/** PUT /:title — 更新或新增提示词（按 title 做 upsert，存在则更新，不存在则插入） */
app.put(
  '/:title',
  describeRoute({
    tags: ['AI 管理'],
    summary: '更新或新增提示词（按 title 做 upsert，存在则更新，不存在则插入）',
  }),
  async c => {
    const title = c.req.param('title');
    const body = updateSystemPromptSchema.parse(await c.req.json());

    const result = await mainDb
      .insert(systemPrompts)
      .values({ title, prompt_text: body.prompt_text })
      .onConflictDoUpdate({
        target: systemPrompts.title,
        set: { prompt_text: body.prompt_text, updated_at: new Date() },
      })
      .returning();

    return c.json(ok(result[0]));
  },
);

export default app;
