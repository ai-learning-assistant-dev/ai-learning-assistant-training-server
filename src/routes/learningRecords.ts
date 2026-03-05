import { Hono } from 'hono';
import { userDb } from '@db/index';
import { learningRecords } from '@db/user/schema';
import { createCrudRoutes } from './_crud';
import { createLearningRecordSchema, updateLearningRecordSchema } from '@schemas/learningRecord';

const app = new Hono();

app.route(
  '/',
  createCrudRoutes({
    db: () => userDb,
    table: learningRecords,
    idColumn: learningRecords.task_id,
    idField: 'task_id',
    createSchema: createLearningRecordSchema,
    updateSchema: updateLearningRecordSchema,
  }),
);

export default app;
