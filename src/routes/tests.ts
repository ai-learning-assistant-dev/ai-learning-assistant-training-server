import { Hono } from 'hono';
import { eq, inArray, and, asc } from 'drizzle-orm';
import { mainDb, userDb } from '@db/index';
import { tests, testExercises, exercises, exerciseOptions } from '@db/main/schema';
import { testResults, exerciseResults } from '@db/user/schema';
import { createCrudRoutes } from './_crud';
import { createTestSchema, updateTestSchema } from '@schemas/test';
import { ok, fail } from '@schemas/common';

const app = new Hono();

// ── 标准 CRUD ───────────────────────────────────────

app.route(
  '/',
  createCrudRoutes({
    db: () => mainDb,
    table: tests,
    idColumn: tests.test_id,
    idField: 'test_id',
    createSchema: createTestSchema,
    updateSchema: updateTestSchema,
  }),
);

// ── POST /getTestsWithExercisesByCourse ─────────────

app.post('/getTestsWithExercisesByCourse', async c => {
  const { course_id } = await c.req.json();
  if (!course_id) return c.json(fail('course_id 必填'), 400);

  const testList = await mainDb.select().from(tests).where(eq(tests.course_id, course_id)).orderBy(asc(tests.test_id));
  if (!testList.length) return c.json(ok([]));

  const testIds = testList.map(t => t.test_id);
  const teRows = await mainDb.select().from(testExercises).where(inArray(testExercises.test_id, testIds));
  const exerciseIds = teRows.map(te => te.exercise_id);

  const exerciseList = exerciseIds.length > 0 ? await mainDb.select().from(exercises).where(inArray(exercises.exercise_id, exerciseIds)) : [];
  const optionList = exerciseIds.length > 0 ? await mainDb.select().from(exerciseOptions).where(inArray(exerciseOptions.exercise_id, exerciseIds)) : [];

  const exerciseMap = exerciseList.map(ex => ({
    ...ex,
    options: optionList.filter(opt => opt.exercise_id === ex.exercise_id),
  }));

  const result = testList.map(test => {
    const rels = teRows.filter(te => te.test_id === test.test_id);
    return {
      ...test,
      exercises: rels.map(rel => exerciseMap.find(ex => ex.exercise_id === rel.exercise_id)).filter(Boolean),
    };
  });

  return c.json(ok(result));
});

// ── POST /saveTestResults ───────────────────────────

app.post('/saveTestResults', async c => {
  const body = await c.req.json();
  const { user_id, test_id, start_date, end_date, ai_feedback, list } = body;

  if (!user_id || !test_id || !list || !Array.isArray(list) || list.length === 0) {
    return c.json(fail('user_id、test_id 和 list 必须传，且 list 为非空数组'), 400);
  }

  const results: any[] = [];
  let userTotalScore = 0;
  let totalTestScore = 0;

  // 查看是否已有 TestResult
  const existing = await userDb
    .select()
    .from(testResults)
    .where(and(eq(testResults.user_id, user_id), eq(testResults.test_id, test_id)))
    .limit(1);

  let testResultAction = 'created';
  let testResultId: string;

  if (existing[0]) {
    await userDb
      .update(testResults)
      .set({ start_date, end_date, ai_feedback: ai_feedback ?? '' })
      .where(eq(testResults.result_id, existing[0].result_id));
    testResultId = existing[0].result_id;
    testResultAction = 'updated';
  } else {
    const inserted = await userDb
      .insert(testResults)
      .values({ user_id, test_id, start_date, end_date, ai_feedback: ai_feedback ?? '', score: 0 })
      .returning();
    testResultId = inserted[0]!.result_id;
  }

  for (const item of list) {
    const exercise = await mainDb.select().from(exercises).where(eq(exercises.exercise_id, item.exercise_id)).limit(1);
    const ex = exercise[0];
    const questionScore = ex?.score || 0;
    totalTestScore += questionScore;

    const userAnswerRaw = item.user_answer ?? '';
    const typeStatus = ex?.type_status ?? '';

    let isCorrect = false;

    if (typeStatus === '0' || typeStatus === '1') {
      const options = await mainDb.select().from(exerciseOptions).where(eq(exerciseOptions.exercise_id, item.exercise_id));
      const correctIds = options.filter(o => o.is_correct).map(o => o.option_id);
      const userIds = userAnswerRaw
        ? String(userAnswerRaw)
            .split(';')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

      if (typeStatus === '0') {
        isCorrect = userIds.length === 1 && correctIds.length === 1 && userIds[0] === correctIds[0];
      } else {
        const uniqUser = [...new Set(userIds)];
        const uniqCorrect = [...new Set(correctIds.map(String))];
        isCorrect = uniqUser.length === uniqCorrect.length && uniqUser.every(uid => uniqCorrect.includes(uid));
      }
    } else if (typeStatus === '2') {
      const expect = (ex?.answer ?? '').toString().trim().toLowerCase();
      const actual = (userAnswerRaw ?? '').toString().trim().toLowerCase();
      isCorrect = expect !== '' && expect === actual;
    }

    const user_score = isCorrect ? questionScore : 0;
    userTotalScore += user_score;

    // 查重
    const existingResult = await userDb
      .select()
      .from(exerciseResults)
      .where(and(eq(exerciseResults.user_id, user_id), eq(exerciseResults.exercise_id, item.exercise_id), eq(exerciseResults.test_result_id, testResultId)))
      .limit(1);

    if (existingResult[0]) {
      await userDb.update(exerciseResults).set({ user_answer: userAnswerRaw, score: user_score }).where(eq(exerciseResults.result_id, existingResult[0].result_id));
      results.push({ ...existingResult[0], _action: 'updated', score: questionScore, user_score, ai_feedback: '' });
    } else {
      const saved = await userDb
        .insert(exerciseResults)
        .values({ user_id, exercise_id: item.exercise_id, user_answer: userAnswerRaw, test_result_id: testResultId, score: user_score })
        .returning();
      results.push({ ...saved[0], _action: 'created', score: questionScore, user_score, ai_feedback: '' });
    }
  }

  const pass = totalTestScore > 0 ? userTotalScore / totalTestScore > 0.6 : false;

  // 更新总分
  await userDb.update(testResults).set({ score: userTotalScore }).where(eq(testResults.result_id, testResultId));

  return c.json(
    ok(
      {
        test_result_action: testResultAction,
        test_result_id: testResultId,
        results,
        total_score: totalTestScore,
        user_score: userTotalScore,
        pass,
        pass_rate: totalTestScore > 0 ? (userTotalScore / totalTestScore) * 100 : 0,
      },
      '测试答题结果批量保存/更新成功',
    ),
  );
});

export default app;
