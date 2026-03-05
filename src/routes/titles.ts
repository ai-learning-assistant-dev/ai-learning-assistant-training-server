import { Hono } from 'hono';
import { userDb } from '@db/index';
import { titles } from '@db/user/schema';
import { createCrudRoutes } from './_crud';
import { createTitleSchema, updateTitleSchema } from '@schemas/title';

const app = new Hono();

app.route(
  '/',
  createCrudRoutes({
    db: () => userDb,
    table: titles,
    idColumn: titles.title_id,
    idField: 'title_id',
    createSchema: createTitleSchema,
    updateSchema: updateTitleSchema,
  }),
);

export default app;
