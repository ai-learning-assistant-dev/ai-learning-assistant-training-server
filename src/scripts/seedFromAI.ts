import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, AppDataSource } from '../config/database';
import { Course } from '../models/course';
import { Chapter } from '../models/chapter';
import { Section } from '../models/section';
import { LeadingQuestion } from '../models/leadingQuestion';
import { Exercise } from '../models/exercise';
import { ExerciseOption } from '../models/exerciseOption';
import { ExerciseResult } from '../models/exerciseResult';
import { Title } from '../models/title';
import { Test } from '../models/test';
import { CourseSchedule } from '../models/courseSchedule';

type FileMap = Record<string, string[]>;

function truncateString(input: any, max = 255) {
  if (input === undefined || input === null) return undefined;
  const s = String(input);
  if (s.length <= max) return s;
  return s.slice(0, max);
}

function baseFromFilename(name: string) {
  // prefer prefix before first '_', otherwise filename without extension
  const idx = name.indexOf('_');
  if (idx > 0) return name.substring(0, idx);
  return name.replace(/\.[^.]+$/, '');
}

async function readJsonSafe(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

async function buildFileMap(dir: string): Promise<FileMap> {
  const files = await fs.readdir(dir);
  const map: FileMap = {};
  for (const f of files) {
    // skip markdown folder for now (we'll read it separately)
    if (f === 'markdown') continue;
    const base = baseFromFilename(f);
    map[base] = map[base] || [];
    map[base].push(path.join(dir, f));
  }
  // also read markdown folder
  const mdDir = path.join(dir, 'markdown');
  try {
    const mdfiles = await fs.readdir(mdDir);
    for (const mf of mdfiles) {
      const name = mf.replace(/\.md$/, '');
      map[name] = map[name] || [];
      map[name].push(path.join(mdDir, mf));
    }
  } catch (err) {
    // ignore if no markdown folder
  }
  return map;
}

async function parseQuestions(obj: any) {
  if (!obj) return [];
  if (Array.isArray(obj.questions) && obj.questions.length > 0) return obj.questions;
  // sometimes questions are nested in raw_response as JSON string
  if (obj.raw_response && typeof obj.raw_response === 'string') {
    try {
      const parsed = JSON.parse(obj.raw_response);
      if (Array.isArray(parsed.questions)) return parsed.questions;
    } catch (e) {
      // ignore
    }
  }
  return [];
}

async function main() {
  await connectDatabase();

  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');

  const baseDir = path.resolve(__dirname, '../../AI使用');
  console.log('Reading AI data from', baseDir);
  const filesMap = await buildFileMap(baseDir);

  const courseRepo = AppDataSource.getRepository(Course);
  const chapterRepo = AppDataSource.getRepository(Chapter);
  const sectionRepo = AppDataSource.getRepository(Section);
  const lqRepo = AppDataSource.getRepository(LeadingQuestion);
  const exRepo = AppDataSource.getRepository(Exercise);
  const optRepo = AppDataSource.getRepository(ExerciseOption);

  for (const [base, paths] of Object.entries(filesMap)) {
    try {
      // skip unrelated files
      // determine primary info files
      const videoInfoPath = paths.find(p => p.endsWith('_video_info.json')) || paths.find(p => p.includes('video_info'));
      const exercisesPath = paths.find(p => p.endsWith('_exercises.json')) || paths.find(p => p.includes('exercises'));
      const questionsPath = paths.find(p => p.endsWith('_questions.json')) || paths.find(p => p.includes('questions'));
      const summaryPath = paths.find(p => p.endsWith('_summary.json')) || paths.find(p => p.includes('summary'));
      const mdPath = paths.find(p => p.endsWith('.md'));

      // skip if no meaningful files
      if (!videoInfoPath && !exercisesPath && !questionsPath && !mdPath) continue;

      // check existing course by name
      const exists = await courseRepo.findOneBy({ name: base });
      if (exists) {
        if (!force) {
          console.log(`Course '${base}' already exists, skipping.`);
          continue;
        }
        console.log(`--force set: will clear existing course '${base}' before re-seeding.`);
        // clear existing data for this course
        try {
          // delete related data: chapters -> sections -> exercises/options/leading questions
          const chapters = await chapterRepo.find({ where: { course_id: exists.course_id } });
          for (const ch of chapters) {
            const sections = await sectionRepo.find({ where: { chapter_id: ch.chapter_id } });
            for (const sec of sections) {
              await lqRepo.delete({ section_id: sec.section_id });
              const exercises = await exRepo.find({ where: { section_id: sec.section_id } });
              const exIds = exercises.map(e => e.exercise_id);
                  if (exIds.length > 0) {
                    // delete exercise results that reference these exercises first to satisfy FK constraints
                    const exResRepo = AppDataSource.getRepository(ExerciseResult);
                    await exResRepo.createQueryBuilder().delete().where('exercise_id IN (:...ids)', { ids: exIds }).execute();
                    await optRepo.createQueryBuilder().delete().where('exercise_id IN (:...ids)', { ids: exIds }).execute();
                    await exRepo.createQueryBuilder().delete().where('exercise_id IN (:...ids)', { ids: exIds }).execute();
                  }
              await sectionRepo.delete({ section_id: sec.section_id });
            }
            await chapterRepo.delete({ chapter_id: ch.chapter_id });
          }
          // delete titles, tests, schedules linked to course
          const titleRepo = AppDataSource.getRepository(Title);
          const testRepo = AppDataSource.getRepository(Test);
          const schedRepo = AppDataSource.getRepository(CourseSchedule);
          await titleRepo.createQueryBuilder().delete().where('course_id = :id', { id: exists.course_id }).execute();
          await testRepo.createQueryBuilder().delete().where('course_id = :id', { id: exists.course_id }).execute();
          await schedRepo.createQueryBuilder().delete().where('course_id = :id', { id: exists.course_id }).execute();
          // finally delete the course itself
          await courseRepo.delete({ course_id: exists.course_id });
          console.log(`Cleared course '${base}' and related data.`);
        } catch (err) {
          console.error('Failed to clear existing course data for', base, err);
          continue; // skip seeding this one to avoid partial state
        }
      }

      // parse files
      const videoInfo = videoInfoPath ? await readJsonSafe(videoInfoPath) : null;
      const exercises = exercisesPath ? await readJsonSafe(exercisesPath) : null;
      const questions = questionsPath ? await readJsonSafe(questionsPath) : null;
      const summary = summaryPath ? await readJsonSafe(summaryPath) : null;
      const md = mdPath ? await fs.readFile(mdPath, 'utf8') : undefined;
  // find a .srt file for this resource, if any
  const srtPath = paths.find(p => p.toLowerCase().endsWith('.srt'));

      const course = courseRepo.create({
        name: truncateString(base, 255) || base,
        description: md || (videoInfo?.desc || summary?.summary || ''),
        icon_url: truncateString(videoInfo?.pic, 255) || undefined,
      });
      await courseRepo.save(course);
      console.log('Created course', course.name);

      const chapter = chapterRepo.create({
        course_id: course.course_id,
        title: '默认章节',
        chapter_order: 1,
      });
      await chapterRepo.save(chapter);

      const sectionTitle = videoInfo?.title || base;
      const duration = videoInfo?.duration || (videoInfo?.pages?.[0]?.duration) || 0;
      const estimatedTime = duration ? Math.max(1, Math.ceil(duration / 60)) : undefined;

      // derive a best-effort video link from videoInfo
      function extractVideoLink(vinfo: any): string | undefined {
        if (!vinfo) return undefined;
        // common direct fields
        if (vinfo.weblink && typeof vinfo.weblink === 'string' && vinfo.weblink.trim()) return vinfo.weblink.trim();
        if (vinfo.video_url && typeof vinfo.video_url === 'string' && vinfo.video_url.trim()) return vinfo.video_url.trim();
        // pages may contain weblink or vid
        if (Array.isArray(vinfo.pages) && vinfo.pages.length > 0) {
          const p = vinfo.pages[0];
          if (p.weblink && typeof p.weblink === 'string' && p.weblink.trim()) return p.weblink.trim();
          if (p.vid && typeof p.vid === 'string' && p.vid.trim()) return p.vid.trim();
        }
        // bilibili bvid
        if (vinfo.bvid && typeof vinfo.bvid === 'string' && vinfo.bvid.trim()) return `https://www.bilibili.com/video/${vinfo.bvid.trim()}`;
        // fallback to aid if present
        if (vinfo.aid) return `https://www.bilibili.com/video/av${vinfo.aid}`;
        return undefined;
      }

      const videoLink = extractVideoLink(videoInfo);

      const section = sectionRepo.create({
        title: truncateString(sectionTitle, 255) || sectionTitle,
        chapter_id: chapter.chapter_id,
        video_url: truncateString(videoLink, 255),
        knowledge_content: truncateString(summary?.summary || summary?.raw_text || undefined, 255),
        video_subtitles: truncateString(videoInfo?.subtitle ? JSON.stringify(videoInfo.subtitle) : undefined, 255),
        // store absolute path to srt file if present
        srt_path: srtPath ? truncateString(path.resolve(srtPath), 512) : undefined,
        estimated_time: estimatedTime,
        section_order: 1,
      });
      await sectionRepo.save(section);

      // leading questions
      const parsedQs = await parseQuestions(questions);
      for (const q of parsedQs) {
        if (!q || !q.question) continue;
        const lq = lqRepo.create({
          section_id: section.section_id,
          question: q.question,
        });
        await lqRepo.save(lq);
      }

      // exercises: multiple_choice and short_answer
      if (exercises) {
        const mc = exercises.multiple_choice || [];
        for (const item of mc) {
          const ex = exRepo.create({
            section_id: section.section_id,
            question: item.question,
            type_status: '0', // 单选
            answer: item.correct_answer || null,
            score: 1,
          });
          await exRepo.save(ex);
          // options
          const opts = item.options || {};
          for (const [key, text] of Object.entries(opts)) {
            const isCorrect = String(item.correct_answer).toUpperCase() === String(key).toUpperCase();
            const opt = optRepo.create({
              exercise_id: ex.exercise_id,
              option_text: `${key}. ${text}`,
              is_correct: !!isCorrect,
            });
            await optRepo.save(opt);
          }
        }

        const sa = exercises.short_answer || [];
        for (const item of sa) {
          const ex = exRepo.create({
            section_id: section.section_id,
            question: item.question,
            type_status: '2', // 简答
            answer: (item.reference_answer || (item.answer_points ? item.answer_points.join('\n') : '')) || null,
            score: 1,
          });
          await exRepo.save(ex);
        }
      }

      console.log(`Seeded course '${base}' -> section '${section.title}'`);
    } catch (err) {
      console.error('Error seeding', base, err);
    }
  }

  console.log('Seeding finished.');
  process.exit(0);
}

main().catch(err => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
