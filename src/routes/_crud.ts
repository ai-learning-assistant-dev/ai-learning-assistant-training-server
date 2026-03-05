/**
 * CRUD 路由工厂 — 为标准 CRUD 控制器生成 Hono 路由
 *
 * 大多数实体控制器共享相同的 5 个端点：
 *   POST /search    — 分页查询
 *   POST /getById   — 按 ID 查询
 *   POST /add       — 创建
 *   POST /update    — 更新
 *   POST /delete    — 删除
 */
import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { z } from 'zod';
import { searchSchema, ok, fail, paginate } from '@schemas/common';

export interface CrudConfig {
  /** Drizzle 数据库实例的 getter（延迟获取，避免模块加载时未初始化） */
  db: () => any;
  /** Drizzle 表对象 */
  table: PgTable;
  /** 主键列对象，如 courses.course_id */
  idColumn: any;
  /** JSON 中的主键字段名，如 'course_id' */
  idField: string;
  /** 创建时的 Zod 验证 schema */
  createSchema: z.ZodType;
  /** 更新时的 Zod 验证 schema */
  updateSchema: z.ZodType;
}

/**
 * 创建标准 CRUD 路由
 */
export function createCrudRoutes(config: CrudConfig): Hono {
  const { db: getDb, table, idColumn, idField, createSchema, updateSchema } = config;
  const app = new Hono();

  // POST /search — 分页查询
  app.post('/search', async c => {
    const db = getDb();
    const { page, limit } = searchSchema.parse(await c.req.json());
    const offset = (page - 1) * limit;

    const [rows, totalResult] = await Promise.all([db.select().from(table).limit(limit).offset(offset), db.select({ count: sql<number>`count(*)::int` }).from(table)]);
    const total = Number(totalResult[0]?.count ?? 0);

    return c.json(paginate(rows, total, page, limit));
  });

  // POST /getById — 按 ID 查询
  app.post('/getById', async c => {
    const db = getDb();
    const body = await c.req.json();
    const id = body[idField];
    if (!id) return c.json(fail(`缺少 ${idField}`), 400);

    const rows = await db.select().from(table).where(eq(idColumn, id)).limit(1);
    if (!rows[0]) return c.json(fail('未找到记录'), 404);

    return c.json(ok(rows[0]));
  });

  // POST /add — 创建
  app.post('/add', async c => {
    const db = getDb();
    const body = createSchema.parse(await c.req.json());
    const result = await db.insert(table).values(body).returning();
    return c.json(ok(result[0], '创建成功'));
  });

  // POST /update — 更新
  app.post('/update', async c => {
    const db = getDb();
    const body = updateSchema.parse(await c.req.json());
    const id = (body as Record<string, unknown>)[idField];
    if (!id) return c.json(fail(`缺少 ${idField}`), 400);

    const existing = await db.select().from(table).where(eq(idColumn, id)).limit(1);
    if (!existing[0]) return c.json(fail('未找到记录'), 404);

    const { [idField]: _, ...data } = body as Record<string, unknown>;
    const result = await db.update(table).set(data).where(eq(idColumn, id)).returning();
    return c.json(ok(result[0], '更新成功'));
  });

  // POST /delete — 删除
  app.post('/delete', async c => {
    const db = getDb();
    const body = await c.req.json();
    const id = body[idField];
    if (!id) return c.json(fail(`缺少 ${idField}`), 400);

    const existing = await db.select().from(table).where(eq(idColumn, id)).limit(1);
    if (!existing[0]) return c.json(fail('未找到记录'), 404);

    await db.delete(table).where(eq(idColumn, id));
    return c.json(ok(null, '删除成功'));
  });

  return app;
}
