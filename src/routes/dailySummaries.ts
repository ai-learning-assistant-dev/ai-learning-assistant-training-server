import { createCrudRoutes } from './_crud';
import { userDb } from '@db/index';
import { dailySummaries } from '@db/user/schema';
import { createDailySummarySchema, updateDailySummarySchema } from '@schemas/dailySummary';

const app = createCrudRoutes({
  db: () => userDb,
  table: dailySummaries,
  idColumn: dailySummaries.summary_id,
  idField: 'summary_id',
  createSchema: createDailySummarySchema,
  updateSchema: updateDailySummarySchema,
  tag: '用户与学习',
  entityName: '每日总结',
});

export default app;
