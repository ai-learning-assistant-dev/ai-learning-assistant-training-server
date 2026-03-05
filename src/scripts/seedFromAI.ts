/**
 * AI 生成种子数据导入脚本
 *
 * 读取 AI使用/ 目录下的 JSON 文件，导入课程、章节、小节、练习题等数据。
 *
 * 用法: bun src/scripts/seedFromAI.ts [--force|-f]
 */
import path from 'path';
import fs from 'fs/promises';
import { eq, inArray } from 'drizzle-orm';
import { initializeDatabase, closeDatabase, mainDb, userDb } from '../db/index';
import { courses, chapters, sections, leadingQuestions, exercises, exerciseOptions, tests } from '../db/main/schema';
import { titles, exerciseResults, courseSchedules } from '../db/user/schema';
import logger from '../utils/logger';

type FileMap = Record<string, string[]>;

function truncateString(input: unknown, max = 255): string | undefined {
  if (input === undefined || input === null) return undefined;
  const s = String(input);
  return s.length <= max ? s : s.slice(0, max);
}

function baseFromFilename(name: string): string {
  const idx = name.indexOf('_');
  if (idx > 0) return name.substring(0, idx);
  return name.replace(/\.[^.]+$/, '');
}

async function readJsonSafe(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function buildFileMap(dir: string): Promise<FileMap> {
  const files = await fs.readdir(dir);
  const map: FileMap = {};
  for (const f of files) {
    if (f === 'markdown') continue;
    const base = baseFromFilename(f);
    map[base] = map[base] || [];
    map[base].push(path.join(dir, f));
  }
  const mdDir = path.join(dir, 'markdown');
  try {
    const mdfiles = await fs.readdir(mdDir);
    for (const mf of mdfiles) {
      const name = mf.replace(/\.md$/, '');
      map[name] = map[name] || [];
      map[name].push(path.join(mdDir, mf));
    }
  } catch {
    // ignore if no markdown folder
  }
  return map;
}

async function parseQuestions(obj: any) {
  if (!obj) return [];
  if (Array.isArray(obj.questions) && obj.questions.length > 0) return obj.questions;
  if (obj.raw_response && typeof obj.raw_response === 'string') {
    try {
      const parsed = JSON.parse(obj.raw_response);
      if (Array.isArray(parsed.questions)) return parsed.questions;
    } catch {
      // ignore
    }
  }
  return [];
}

function extractVideoLink(vinfo: any): string | undefined {
  if (!vinfo) return undefined;
  if (vinfo.weblink?.trim()) return vinfo.weblink.trim();
  if (vinfo.video_url?.trim()) return vinfo.video_url.trim();
  if (Array.isArray(vinfo.pages) && vinfo.pages.length > 0) {
    const p = vinfo.pages[0];
    if (p.weblink?.trim()) return p.weblink.trim();
    if (p.vid?.trim()) return p.vid.trim();
  }
  if (vinfo.bvid?.trim()) return `https://www.bilibili.com/video/${vinfo.bvid.trim()}`;
  if (vinfo.aid) return `https://www.bilibili.com/video/av${vinfo.aid}`;
  return undefined;
}

async function main() {
  await initializeDatabase();

  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');

  const baseDir = path.resolve(import.meta.dirname ?? __dirname, '../../AI使用');
  logger.info('Reading AI data from', baseDir);
  const filesMap = await buildFileMap(baseDir);

  for (const [base, paths] of Object.entries(filesMap)) {
    try {
      const videoInfoPath = paths.find(p => p.endsWith('_video_info.json')) || paths.find(p => p.includes('video_info'));
      const exercisesPath = paths.find(p => p.endsWith('_exercises.json')) || paths.find(p => p.includes('exercises'));
      const questionsPath = paths.find(p => p.endsWith('_questions.json')) || paths.find(p => p.includes('questions'));
      const summaryPath = paths.find(p => p.endsWith('_summary.json')) || paths.find(p => p.includes('summary'));
      const mdPath = paths.find(p => p.endsWith('.md'));

      if (!videoInfoPath && !exercisesPath && !questionsPath && !mdPath) continue;

      // 检查是否已存在
      const [existing] = await mainDb.select().from(courses).where(eq(courses.name, base));

      if (existing) {
        if (!force) {
          logger.info(`Course '${base}' already exists, skipping.`);
          continue;
        }
        logger.info(`--force set: will clear existing course '${base}' before re-seeding.`);

        // 清理依赖数据
        try {
          const chapterList = await mainDb.select().from(chapters).where(eq(chapters.course_id, existing.course_id));

          for (const ch of chapterList) {
            const sectionList = await mainDb.select().from(sections).where(eq(sections.chapter_id, ch.chapter_id));

            for (const sec of sectionList) {
              await mainDb.delete(leadingQuestions).where(eq(leadingQuestions.section_id, sec.section_id));

              const exList = await mainDb.select({ id: exercises.exercise_id }).from(exercises).where(eq(exercises.section_id, sec.section_id));
              const exIds = exList.map(e => e.id);

              if (exIds.length > 0) {
                await userDb.delete(exerciseResults).where(inArray(exerciseResults.exercise_id, exIds));
                await mainDb.delete(exerciseOptions).where(inArray(exerciseOptions.exercise_id, exIds));
                await mainDb.delete(exercises).where(inArray(exercises.exercise_id, exIds));
              }

              await mainDb.delete(sections).where(eq(sections.section_id, sec.section_id));
            }
            await mainDb.delete(chapters).where(eq(chapters.chapter_id, ch.chapter_id));
          }

          await userDb.delete(titles).where(eq(titles.course_id, existing.course_id));
          await mainDb.delete(tests).where(eq(tests.course_id, existing.course_id));
          await userDb.delete(courseSchedules).where(eq(courseSchedules.course_id, existing.course_id));
          await mainDb.delete(courses).where(eq(courses.course_id, existing.course_id));
          logger.info(`Cleared course '${base}' and related data.`);
        } catch (err) {
          logger.error('Failed to clear existing course data for', base, err);
          continue;
        }
      }

      // 解析文件数据
      const videoInfo = videoInfoPath ? await readJsonSafe(videoInfoPath) : null;
      const exerciseData = exercisesPath ? await readJsonSafe(exercisesPath) : null;
      const questionData = questionsPath ? await readJsonSafe(questionsPath) : null;
      const summary = summaryPath ? await readJsonSafe(summaryPath) : null;
      const md = mdPath ? await fs.readFile(mdPath, 'utf8') : undefined;
      const srtPath = paths.find(p => p.toLowerCase().endsWith('.srt'));

      // 创建课程
      const [course] = await mainDb
        .insert(courses)
        .values({
          name: truncateString(base, 255) || base,
          description: md || videoInfo?.desc || summary?.summary || '',
          icon_url: truncateString(videoInfo?.pic, 255),
        })
        .returning();
      logger.info('Created course', course!.name);

      // 创建章节
      const [chapter] = await mainDb
        .insert(chapters)
        .values({
          course_id: course!.course_id,
          title: '默认章节',
          chapter_order: 1,
        })
        .returning();

      // 创建小节
      const sectionTitle = videoInfo?.title || base;
      const duration = videoInfo?.duration || videoInfo?.pages?.[0]?.duration || 0;
      const estimatedTime = duration ? Math.max(1, Math.ceil(duration / 60)) : undefined;
      const videoLink = extractVideoLink(videoInfo);

      const [section] = await mainDb
        .insert(sections)
        .values({
          title: truncateString(sectionTitle, 255) || sectionTitle,
          chapter_id: chapter!.chapter_id,
          video_url: truncateString(videoLink, 255),
          knowledge_content: truncateString(summary?.summary || summary?.raw_text || undefined, 255),
          video_subtitles: truncateString(videoInfo?.subtitle ? JSON.stringify(videoInfo.subtitle) : undefined, 255),
          srt_path: srtPath ? truncateString(path.resolve(srtPath), 512) : undefined,
          estimated_time: estimatedTime,
          section_order: 1,
        })
        .returning();

      // 引导问题
      const parsedQs = await parseQuestions(questionData);
      for (const q of parsedQs) {
        if (!q?.question) continue;
        await mainDb.insert(leadingQuestions).values({
          section_id: section!.section_id,
          question: q.question,
        });
      }

      // 练习题
      if (exerciseData) {
        const mc = exerciseData.multiple_choice || [];
        for (const item of mc) {
          const [ex] = await mainDb
            .insert(exercises)
            .values({
              section_id: section!.section_id,
              question: item.question,
              type_status: '0',
              answer: item.correct_answer || null,
              score: 1,
            })
            .returning();

          const opts = item.options || {};
          for (const [key, text] of Object.entries(opts)) {
            const isCorrect = String(item.correct_answer).toUpperCase() === String(key).toUpperCase();
            await mainDb.insert(exerciseOptions).values({
              exercise_id: ex!.exercise_id,
              option_text: `${key}. ${text}`,
              is_correct: isCorrect,
            });
          }
        }

        const sa = exerciseData.short_answer || [];
        for (const item of sa) {
          await mainDb.insert(exercises).values({
            section_id: section!.section_id,
            question: item.question,
            type_status: '2',
            answer: item.reference_answer || (item.answer_points ? item.answer_points.join('\n') : '') || null,
            score: 1,
          });
        }
      }

      logger.info(`Seeded course '${base}' -> section '${section!.title}'`);
    } catch (err) {
      logger.error('Error seeding', base, err);
    }
  }

  logger.info('Seeding finished.');
  await closeDatabase();
  process.exit(0);
}

main().catch(err => {
  logger.error('Seed script failed:', err);
  process.exit(1);
});
