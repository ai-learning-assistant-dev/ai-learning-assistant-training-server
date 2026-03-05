import { Hono } from 'hono';
import { mainDb } from '@db/index';
import { sections } from '@db/main/schema';
import { createCrudRoutes } from './_crud';
import { createSectionSchema, updateSectionSchema } from '@schemas/section';

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
  }),
);

export default app;
