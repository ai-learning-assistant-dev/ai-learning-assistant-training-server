import { MainDataSource } from '../config/database';
import { Course } from '../models/course';
import { Chapter } from '../models/chapter';
import { Section } from '../models/section';

export class CourseService {
  /**
   * 重新计算并更新指定课程的总学时（单位：小时，保留两位小数）
   */
  static async updateCourseTotalTime(courseId: string) {
    const chapterRepo = MainDataSource.getRepository(Chapter);
    const sectionRepo = MainDataSource.getRepository(Section);
    const courseRepo = MainDataSource.getRepository(Course);

    const chapters = await chapterRepo.find({ where: { course_id: courseId } });
    const chapterIds = chapters.map(c => c.chapter_id);

    let totalMinutes = 0;
    if (chapterIds.length > 0) {
      const sections = await sectionRepo
        .createQueryBuilder('section')
        .where('section.chapter_id IN (:...chapterIds)', { chapterIds })
        .getMany();
      totalMinutes = sections.reduce((sum, s) => sum + (s.estimated_time || 0), 0);
    }
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    await courseRepo.update(courseId, { total_estimated_time: totalHours });
  }
}