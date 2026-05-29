import { Hono } from 'hono';

import courses from './courses';
import chapters from './chapters';
import sections from './sections';
import exercises from './exercises';
import exerciseOptions from './exerciseOptions';
import exerciseResults from './exerciseResults';
import tests from './tests';
import testResults from './testResults';
import users from './users';
import learningRecords from './learningRecords';
import courseSchedules from './courseSchedules';
import titles from './titles';
import dailySummaries from './dailySummaries';
import aiChat from './aiChat';
import aiInteractions from './aiInteractions';
import aiPersonas from './aiPersonas';
import leadingQuestions from './leadingQuestions';
import systemPrompts from './systemPrompts';
import bilibili from './bilibili';

const api = new Hono();

// ── 内容管理 ─────────────────────────────────────────
api.route('/courses', courses);
api.route('/chapters', chapters);
api.route('/sections', sections);
api.route('/exercises', exercises);
api.route('/exercise-options', exerciseOptions);
api.route('/exercise-results', exerciseResults);
api.route('/tests', tests);
api.route('/test-results', testResults);
api.route('/leading-questions', leadingQuestions);

// ── 用户与学习 ───────────────────────────────────────
api.route('/users', users);
api.route('/learning-records', learningRecords);
api.route('/course-schedules', courseSchedules);
api.route('/titles', titles);
api.route('/daily-summaries', dailySummaries);

// ── AI ───────────────────────────────────────────────
api.route('/ai-chat', aiChat);
api.route('/ai-interactions', aiInteractions);
api.route('/ai-personas', aiPersonas);
api.route('/system-prompts', systemPrompts);

// ── B站代理 ──────────────────────────────────────────
api.route('/proxy/bilibili', bilibili);

export default api;

/** Hono RPC 客户端类型推断 */
export type ApiType = typeof api;
