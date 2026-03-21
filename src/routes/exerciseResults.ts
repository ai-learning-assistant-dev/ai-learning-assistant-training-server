import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { mainDb, userDb } from '@db/index';
import { exercises, exerciseOptions, sections, chapters } from '@db/main/schema';
import { exerciseResults, userSectionUnlocks } from '@db/user/schema';
import { createCrudRoutes } from './_crud';
import { createExerciseResultSchema, updateExerciseResultSchema, saveExerciseResultsSchema, getExerciseResultsSchema } from '@schemas/exerciseResult';
import { ok, fail } from '@schemas/common';
import AnswerEvaluator from '@llm/domain/answer_evaluator';
import { distance } from 'fastest-levenshtein';
import logger from '@utils/logger';

const app = new Hono();

// ── 标准 CRUD ───────────────────────────────────────

app.route(
  '/',
  createCrudRoutes({
    db: () => userDb,
    table: exerciseResults,
    idColumn: exerciseResults.result_id,
    idField: 'result_id',
    createSchema: createExerciseResultSchema,
    updateSchema: updateExerciseResultSchema,
    tag: '练习与测试',
    entityName: '答题结果',
  }),
);

// ── 简答题查重 ──────────────────────────────────────

function repeatDetect(userAnswer: string, refAnswer: string): { isValid: boolean; message?: string } {
  const user = userAnswer.trim();
  const ref = refAnswer.trim();
  if (ref === '') return { isValid: true };
  if (user === '') return { isValid: false, message: '答案为空，无法进行评分' };
  if (user === ref) return { isValid: false, message: '答案与参考答案完全相同' };
  if (ref.includes(user) || user.includes(ref)) return { isValid: false, message: '答案直接摘抄自参考答案' };

  const dist = distance(user, ref);
  const similarity = 1 - dist / Math.max(user.length, ref.length);
  if (similarity >= 0.8) return { isValid: false, message: '答案与参考答案过于相似' };
  return { isValid: true };
}

// ── POST /saveExerciseResults ───────────────────────

/** 批量保存练习答题结果：选择题本地判分，简答题通过 LLM 评估打分，通过后自动解锁下一小节 */
app.post(
  '/saveExerciseResults',
  describeRoute({
    tags: ['练习与测试'],
    summary: '批量保存练习答题结果：选择题本地判分，简答题通过 LLM 评估打分，通过后自动解锁下一小节',
  }),
  async c => {
    let user_id: string | undefined, section_id: string | undefined;
    try {
      const body = await c.req.json();
      const parsed = saveExerciseResultsSchema.parse(body);
      ({ user_id, section_id } = parsed);
      const { test_result_id, list, duration } = parsed;

      const results: any[] = [];
      let userTotalScore = 0;

      // 收集简答题任务
      const shortAnswerTasks: Array<{
        item: any;
        exercise: any;
        questionScore: number;
        userAnswerRaw: string;
        exist: any;
      }> = [];

      for (const item of list) {
        const exerciseRow = await mainDb.select().from(exercises).where(eq(exercises.exercise_id, item.exercise_id)).limit(1);
        const exercise = exerciseRow[0];
        let questionScore = exercise?.score || 0;
        if (exercise?.type_status === '2' && questionScore < 10) questionScore = 10;

        const userAnswerRaw = item.user_answer ?? '';
        const typeStatus = exercise?.type_status ?? '';

        // 查重条件
        const conditions = [eq(exerciseResults.user_id, user_id), eq(exerciseResults.exercise_id, item.exercise_id)];
        if (test_result_id) conditions.push(eq(exerciseResults.test_result_id, test_result_id));
        const existRow = await userDb
          .select()
          .from(exerciseResults)
          .where(and(...conditions))
          .limit(1);
        const exist = existRow[0];

        if (typeStatus === '2') {
          shortAnswerTasks.push({ item, exercise, questionScore, userAnswerRaw, exist });
          continue;
        }

        // 非简答题本地判分
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
        }

        const user_score = isCorrect ? questionScore : 0;
        userTotalScore += user_score;

        if (exist) {
          await userDb.update(exerciseResults).set({ user_answer: userAnswerRaw, score: user_score }).where(eq(exerciseResults.result_id, exist.result_id));
          results.push({ ...exist, _action: 'updated', score: questionScore, user_score, ai_feedback: exist.ai_feedback ?? '' });
        } else {
          const values: any = { user_id, exercise_id: item.exercise_id, user_answer: userAnswerRaw, score: user_score };
          if (test_result_id) values.test_result_id = test_result_id;
          const saved = await userDb.insert(exerciseResults).values(values).returning();
          results.push({ ...saved[0], _action: 'created', score: questionScore, user_score, ai_feedback: '' });
        }
      }

      // 查询总分
      let score = 0;
      let currentSection: any = null;
      let currentChapter: any = null;

      if (section_id) {
        const sectionExercises = await mainDb.select().from(exercises).where(eq(exercises.section_id, section_id));
        score = sectionExercises.reduce((sum, ex) => {
          let s = ex.score || 0;
          if (ex.type_status === '2' && s === 1) s = 10;
          return sum + s;
        }, 0);
        const secRow = await mainDb.select().from(sections).where(eq(sections.section_id, section_id)).limit(1);
        currentSection = secRow[0];
        if (currentSection) {
          const chRow = await mainDb.select().from(chapters).where(eq(chapters.chapter_id, currentSection.chapter_id)).limit(1);
          currentChapter = chRow[0];
        }
      }

      // LLM 评估简答题
      if (shortAnswerTasks.length > 0) {
        const evaluator = new AnswerEvaluator();
        const batchSize = 5;
        for (let i = 0; i < shortAnswerTasks.length; i += batchSize) {
          const batch = shortAnswerTasks.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async task => {
              const { item, exercise, questionScore, userAnswerRaw, exist } = task;
              const refAnswer = (exercise?.answer ?? '').toString().trim();
              const check = repeatDetect(userAnswerRaw, refAnswer);

              let user_score = 0;
              let ai_feedback = '';

              if (!check.isValid) {
                ai_feedback = check.message || '答案不符合要求，无法进行评分';
              } else {
                const req = {
                  studentAnswer: userAnswerRaw,
                  prompt: '',
                  priorKnowledge: '',
                  question: (exercise?.question as any) || '',
                  standardAnswer: (exercise?.answer as any) || '',
                };
                let evalRes: any = undefined;
                for (let retry = 0; retry < 3; retry++) {
                  try {
                    evalRes = await evaluator.evaluate(req);
                    break;
                  } catch (err) {
                    logger.error(`LLM 评估失败，重试第${retry + 1}次:`, err);
                  }
                }
                if (evalRes?.score != null) {
                  user_score = Math.round((evalRes.score / 100) * questionScore);
                  ai_feedback = String(evalRes.reply ?? '');
                } else {
                  const expect = (exercise?.answer ?? '').toString().trim().toLowerCase();
                  const actual = (userAnswerRaw ?? '').toString().trim().toLowerCase();
                  const ratio = distance(expect, actual) / Math.max(expect.length, actual.length);
                  user_score = (1 - ratio) * questionScore || 0;
                  ai_feedback = '大模型评分失败，采用距离向量模式进行评分。';
                }
              }

              userTotalScore += user_score;

              if (exist) {
                await userDb.update(exerciseResults).set({ user_answer: userAnswerRaw, score: user_score, ai_feedback }).where(eq(exerciseResults.result_id, exist.result_id));
                results.push({ ...exist, _action: 'updated', score: questionScore, user_score, ai_feedback });
              } else {
                const values: any = {
                  user_id,
                  exercise_id: item.exercise_id,
                  user_answer: userAnswerRaw,
                  score: user_score,
                  ai_feedback,
                };
                if (section_id) values.section_id = section_id;
                if (test_result_id) values.test_result_id = test_result_id;
                const saved = await userDb.insert(exerciseResults).values(values).returning();
                results.push({ ...saved[0], _action: 'created', score: questionScore, user_score, ai_feedback });
              }
            }),
          );
        }
      }

      const pass = score > 0 ? userTotalScore / score > 0.6 : false;

      // 解锁逻辑
      if (pass && currentChapter && currentSection) {
        const unlockRow = await userDb
          .select()
          .from(userSectionUnlocks)
          .where(
            and(
              eq(userSectionUnlocks.user_id, user_id),
              eq(userSectionUnlocks.chapter_id, currentChapter.chapter_id),
              eq(userSectionUnlocks.section_id, currentSection.section_id),
            ),
          )
          .limit(1);

        if (unlockRow[0]) {
          const newDuration = unlockRow[0].duration + (duration || 0);
          await userDb.update(userSectionUnlocks).set({ unlocked: 2, duration: newDuration }).where(eq(userSectionUnlocks.id, unlockRow[0].id));
        } else {
          await userDb.insert(userSectionUnlocks).values({
            user_id,
            chapter_id: currentChapter.chapter_id,
            section_id: currentSection.section_id,
            unlocked: 2,
            duration: duration || 0,
          });
        }
      }

      return c.json(ok({ results, score, user_score: userTotalScore, pass }, '答题结果批量保存/更新成功'));
    } catch (err) {
      logger.error(`[exerciseResults] 保存答题结果失败 (user_id=${user_id}, section_id=${section_id}):`, err);
      return c.json(fail('保存答题结果失败'), 500);
    }
  },
);

// ── POST /getExerciseResults ────────────────────────

/** 查询指定小节下用户的答题结果，包含各题判分、正确性校验及 AI 反馈 */
app.post(
  '/getExerciseResults',
  describeRoute({
    tags: ['练习与测试'],
    summary: '查询指定小节下用户的答题结果，包含各题判分、正确性校验及 AI 反馈',
  }),
  async c => {
    let user_id: string | undefined, section_id: string | undefined;
    try {
      const body = await c.req.json();
      const parsed = getExerciseResultsSchema.parse(body);
      ({ user_id, section_id } = parsed);
      const { test_result_id } = parsed;

      const exerciseList = await mainDb.select().from(exercises).where(eq(exercises.section_id, section_id));
      let score = 0;
      let userTotalScore = 0;
      const results: any[] = [];

      for (const exercise of exerciseList) {
        let questionScore = exercise?.score || 0;
        if (exercise?.type_status === '2' && questionScore < 10) questionScore = 10;
        score += questionScore;

        const conditions = [eq(exerciseResults.user_id, user_id), eq(exerciseResults.exercise_id, exercise.exercise_id)];
        if (test_result_id) conditions.push(eq(exerciseResults.test_result_id, test_result_id));
        const existRow = await userDb
          .select()
          .from(exerciseResults)
          .where(and(...conditions))
          .limit(1);
        const exist = existRow[0];
        const userAnswerRaw = exist?.user_answer ?? '';

        let isCorrect = false;
        const typeStatus = exercise?.type_status ?? '';

        if (typeStatus === '0' || typeStatus === '1') {
          const options = await mainDb.select().from(exerciseOptions).where(eq(exerciseOptions.exercise_id, exercise.exercise_id));
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
        }

        let user_score = isCorrect ? questionScore : 0;
        if (typeStatus === '2' && exist && typeof exist.score === 'number') {
          user_score = exist.score;
          isCorrect = user_score >= questionScore * 0.6;
        }
        userTotalScore += user_score;

        results.push({
          ...(exist || {}),
          exercise_id: exercise.exercise_id,
          user_answer: userAnswerRaw,
          score: questionScore,
          user_score,
          isCorrect,
          _action: exist ? 'exist' : 'not_exist',
          ai_feedback: exist?.ai_feedback ?? '',
        });
      }

      const pass = score > 0 ? userTotalScore / score > 0.6 : false;
      return c.json(ok({ results, score, user_score: userTotalScore, pass }, '查询答题结果成功'));
    } catch (err) {
      logger.error(`[exerciseResults] 查询答题结果失败 (user_id=${user_id}, section_id=${section_id}):`, err);
      return c.json(fail('查询答题结果失败'), 500);
    }
  },
);

export default app;
