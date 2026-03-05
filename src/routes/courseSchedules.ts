import { Hono } from 'hono';
import { userDb } from '@db/index';
import { courseSchedules } from '@db/user/schema';
import { createCrudRoutes } from './_crud';
import { createCourseScheduleSchema, updateCourseScheduleSchema } from '@schemas/courseSchedule';

const app = new Hono();

app.route(
  '/',
  createCrudRoutes({
    db: () => userDb,
    table: courseSchedules,
    idColumn: courseSchedules.plan_id,
    idField: 'plan_id',
    createSchema: createCourseScheduleSchema,
    updateSchema: updateCourseScheduleSchema,
    tag: '用户与学习',
    entityName: '课程安排',
  }),
);

export default app;
