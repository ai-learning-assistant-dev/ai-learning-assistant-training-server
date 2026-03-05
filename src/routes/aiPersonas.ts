import { Hono } from 'hono';
import { mainDb } from '@db/index';
import { aiPersonas } from '@db/main/schema';
import { createCrudRoutes } from './_crud';
import { createAiPersonaSchema, updateAiPersonaSchema } from '@schemas/aiPersona';

const app = new Hono();

app.route(
  '/',
  createCrudRoutes({
    db: () => mainDb,
    table: aiPersonas,
    idColumn: aiPersonas.persona_id,
    idField: 'persona_id',
    createSchema: createAiPersonaSchema,
    updateSchema: updateAiPersonaSchema,
  }),
);

export default app;
