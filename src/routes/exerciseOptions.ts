import { Hono } from 'hono';
import { mainDb } from '@db/index';
import { exerciseOptions } from '@db/main/schema';
import { createCrudRoutes } from './_crud';
import { createExerciseOptionSchema, updateExerciseOptionSchema } from '@schemas/exercise';

const app = new Hono();

app.route(
  '/',
  createCrudRoutes({
    db: () => mainDb,
    table: exerciseOptions,
    idColumn: exerciseOptions.option_id,
    idField: 'option_id',
    createSchema: createExerciseOptionSchema,
    updateSchema: updateExerciseOptionSchema,
  }),
);

export default app;
