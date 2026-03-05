import { Hono } from 'hono';
import { userDb } from '@db/index';
import { testResults } from '@db/user/schema';
import { createCrudRoutes } from './_crud';
import { createTestResultSchema, updateTestResultSchema } from '@schemas/testResult';

const app = new Hono();

app.route(
  '/',
  createCrudRoutes({
    db: () => userDb,
    table: testResults,
    idColumn: testResults.result_id,
    idField: 'result_id',
    createSchema: createTestResultSchema,
    updateSchema: updateTestResultSchema,
  }),
);

export default app;
