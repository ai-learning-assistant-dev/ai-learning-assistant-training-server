import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { eq, inArray, asc, sql } from 'drizzle-orm';
import { mainDb } from '@db/index';
import { exercises, exerciseOptions } from '@db/main/schema';
import { createCrudRoutes } from './_crud';
import { createExerciseSchema, updateExerciseSchema } from '@schemas/exercise';
import { ok, fail } from '@schemas/common';

const app = new Hono();

// ── 标准 CRUD ───────────────────────────────────────

app.route(
  '/',
  createCrudRoutes({
    db: () => mainDb,
    table: exercises,
    idColumn: exercises.exercise_id,
    idField: 'exercise_id',
    createSchema: createExerciseSchema,
    updateSchema: updateExerciseSchema,
    tag: '练习与测试',
    entityName: '练习题',
  }),
);

// ── POST /getExercisesWithOptionsBySection ──────────

/** 根据小节 ID 查询该小节下所有练习题及其选项列表 */
app.post(
  '/getExercisesWithOptionsBySection',
  describeRoute({
    tags: ['练习与测试'],
    summary: '根据小节 ID 查询该小节下所有练习题及其选项列表',
  }),
  async c => {
    const { section_id } = await c.req.json();
    if (!section_id) return c.json(fail('section_id 必填'), 400);

    const exerciseList = await mainDb.select().from(exercises).where(eq(exercises.section_id, section_id)).orderBy(asc(exercises.exercise_id));

    if (!exerciseList.length) return c.json(ok([]));

    const exerciseIds = exerciseList.map(e => e.exercise_id);
    const options = await mainDb.select().from(exerciseOptions).where(inArray(exerciseOptions.exercise_id, exerciseIds));

    const result = exerciseList.map(ex => ({
      ...ex,
      options: options.filter(opt => opt.exercise_id === ex.exercise_id),
      isMultiple: ex.type_status === '2',
    }));

    return c.json(ok(result));
  },
);

export default app;
