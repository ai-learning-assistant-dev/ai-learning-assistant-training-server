import { eq, inArray, sum } from 'drizzle-orm';
import { mainDb } from '@db/index';
import { courses, chapters, sections } from '@db/main/schema';
import logger from '@utils/logger';

/**
 * 重新计算并更新指定课程的总学时（单位：小时，保留两位小数）
 * 通过汇总课程下所有小节的 estimated_time（分钟）计算
 */
export async function updateCourseTotalTime(courseId: string): Promise<void> {
  const chapterRows = await mainDb.select({ chapter_id: chapters.chapter_id }).from(chapters).where(eq(chapters.course_id, courseId));

  const chapterIds = chapterRows.map(c => c.chapter_id);

  let totalMinutes = 0;
  if (chapterIds.length > 0) {
    const result = await mainDb
      .select({ total: sum(sections.estimated_time) })
      .from(sections)
      .where(inArray(sections.chapter_id, chapterIds));
    totalMinutes = Number(result[0]?.total ?? 0);
  }

  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
  await mainDb.update(courses).set({ total_estimated_time: totalHours }).where(eq(courses.course_id, courseId));
  logger.debug(`📊 课程 ${courseId} 总学时已更新: ${totalHours} 小时`);
}
