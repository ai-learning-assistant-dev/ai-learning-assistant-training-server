import { Hono } from 'hono';
import { mainDb } from '@db/index';
import { chapters } from '@db/main/schema';
import { createCrudRoutes } from './_crud';
import { createChapterSchema, updateChapterSchema } from '@schemas/chapter';

const app = new Hono();

app.route(
  '/',
  createCrudRoutes({
    db: () => mainDb,
    table: chapters,
    idColumn: chapters.chapter_id,
    idField: 'chapter_id',
    createSchema: createChapterSchema,
    updateSchema: updateChapterSchema,
  }),
);

export default app;
