import { Hono } from 'hono';
import { userDb } from '@db/index';
import { aiInteractions } from '@db/user/schema';
import { createCrudRoutes } from './_crud';
import { createAiInteractionSchema, updateAiInteractionSchema } from '@schemas/aiInteraction';

const app = new Hono();

app.route(
  '/',
  createCrudRoutes({
    db: () => userDb,
    table: aiInteractions,
    idColumn: aiInteractions.interaction_id,
    idField: 'interaction_id',
    createSchema: createAiInteractionSchema,
    updateSchema: updateAiInteractionSchema,
    tag: 'AI 管理',
    entityName: 'AI 交互记录',
  }),
);

export default app;
