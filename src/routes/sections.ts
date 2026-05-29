import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { mainDb } from '@db/index';
import { sections, chapters } from '@db/main/schema';
import { createCrudRoutes } from './_crud';
import { createSectionSchema, updateSectionSchema } from '@schemas/section';
import { updateCourseTotalTime } from '@/services/courseService';

/** 通过 chapter_id 查找 course_id 并更新课程总学时 */
async function updateTotalTimeByChapterId(chapterId: string): Promise<void> {
  const [chapter] = await mainDb.select({ course_id: chapters.course_id }).from(chapters).where(eq(chapters.chapter_id, chapterId));
  if (chapter) await updateCourseTotalTime(chapter.course_id);
}

const app = new Hono();

app.route(
  '/',
  createCrudRoutes({
    db: () => mainDb,
    table: sections,
    idColumn: sections.section_id,
    idField: 'section_id',
    createSchema: createSectionSchema,
    updateSchema: updateSectionSchema,
    tag: '课程管理',
    entityName: '小节',
    afterCreate: async record => {
      if (record.chapter_id) await updateTotalTimeByChapterId(record.chapter_id as string);
    },
    afterUpdate: async record => {
      if (record.chapter_id) await updateTotalTimeByChapterId(record.chapter_id as string);
    },
    afterDelete: async record => {
      if (record.chapter_id) await updateTotalTimeByChapterId(record.chapter_id as string);
    },
  }),
);

export default app;
