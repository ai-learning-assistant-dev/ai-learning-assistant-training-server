import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { eq, and, asc, desc } from 'drizzle-orm';
import { mainDb, userDb } from '@db/index';
import { aiPersonas, sections } from '@db/main/schema';
import { aiInteractions, users } from '@db/user/schema';
import { ok, fail } from '@schemas/common';
import {
  chatRequestSchema,
  streamChatRequestSchema,
  answerEvaluateRequestSchema,
  learningReviewRequestSchema,
  createSessionRequestSchema,
  switchPersonaSchema,
} from '@schemas/aiChat';
import { createLearningAssistant, startNewLearningSession, resumeLearningSession } from '@llm/domain/learning_assistant';
import type { LearningAssistant } from '@llm/domain/learning_assistant';
import AnswerEvaluator from '@llm/domain/answer_evaluator';
import LearningReviewEvaluator from '@llm/domain/learning_review_evaluator';
import DailyChat from '@llm/domain/daily_chat';
import { getAudioPromptByOption } from '@/services/systemPromptService';
import { modelConfigManager } from '@llm/utils/modelConfigManager';
import logger from '@utils/logger';

const normalizePersonaId = (id?: string): string | undefined => {
  if (!id) return undefined;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/** 将 Node.js Readable 写入 Hono stream */
async function pipeReadable(s: { write: (data: string) => Promise<unknown> }, readable: NodeJS.ReadableStream) {
  for await (const chunk of readable as AsyncIterable<Buffer | string>) {
    await s.write(typeof chunk === 'string' ? chunk : chunk.toString());
  }
}

const app = new Hono();

// ── POST /chat ──────────────────────────────────────

app.post('/chat', async c => {
  const request = chatRequestSchema.parse(await c.req.json());
  const { userId, sectionId, message, personaId, sessionId, modelName } = request;
  const normalizedPersonaId = normalizePersonaId(personaId);

  let assistant: LearningAssistant;

  if (sessionId) {
    assistant = await resumeLearningSession(userId, sessionId, undefined, modelName);
  } else {
    assistant = await createLearningAssistant(userId, sectionId, normalizedPersonaId, undefined, undefined, undefined, modelName);
  }

  const aiResponse = await assistant.chat(message);
  const personaInUse = assistant.getPersonaId();

  const result = {
    interaction_id: `${assistant.getSessionId()}_${Date.now()}`,
    user_id: userId,
    section_id: sectionId,
    session_id: assistant.getSessionId(),
    user_message: message,
    ai_response: aiResponse,
    query_time: new Date(),
    persona_id_in_use: personaInUse,
  };

  await assistant.cleanup();

  return c.json(ok(result));
});

// ── POST /daily ─────────────────────────────────────

app.post('/daily', async c => {
  const request = streamChatRequestSchema.parse(await c.req.json());
  const { message, reasoning, modelName } = request;
  if (!message) return c.json(fail('缺少必要参数 message'), 400);

  let requirements: string | undefined;
  if (request.useAudio && request.ttsOption) {
    const audioPrompts = await Promise.all(request.ttsOption.map(getAudioPromptByOption));
    requirements = audioPrompts.join('\n');
  }

  const dc = await DailyChat.create({ requirements, reasoning, modelName });
  const readable = dc.stream(message, { configurable: { thread_id: DailyChat.sessionId } });

  return streamText(c, async stream => {
    try {
      await pipeReadable(stream, readable);
    } finally {
      try {
        await dc.cleanup();
      } catch (e) {
        logger.warn('DailyChat cleanup failed:', e);
      }
    }
  });
});

// ── POST /evaluate ──────────────────────────────────

app.post('/evaluate', async c => {
  const request = answerEvaluateRequestSchema.parse(await c.req.json());
  const evaluator = new AnswerEvaluator();
  const result = await evaluator.evaluate(request);
  return c.json(ok(result));
});

// ── POST /learning-review ───────────────────────────

app.post('/learning-review', async c => {
  const request = learningReviewRequestSchema.parse(await c.req.json());
  const { userId, sectionId, sessionId, modelName } = request;

  const evaluator = new LearningReviewEvaluator({ modelName });
  const { stream: reviewStream, fullTextPromise } = await evaluator.evaluate(request);

  // 流式结束后异步保存到聊天记录
  fullTextPromise
    .then(async reviewText => {
      try {
        await userDb.insert(aiInteractions).values({
          user_id: userId,
          section_id: sectionId,
          session_id: sessionId,
          user_message: '请针对课程学习情况进行总结',
          ai_response: reviewText,
          query_time: new Date(),
        });
        logger.info(`学习总结评语已保存: ${sessionId}`);
      } catch (err) {
        logger.error('保存学习总结评语失败:', err);
      }
    })
    .catch(err => logger.error('学习总结评语生成失败:', err));

  return streamText(c, async stream => {
    await pipeReadable(stream, reviewStream);
  });
});

// ── POST /chat/stream ───────────────────────────────

app.post('/chat/stream', async c => {
  const request = streamChatRequestSchema.parse(await c.req.json());

  // daily 模式委托
  if (request.daily || request.sectionId === '') {
    // 重新创建 daily 流程
    const { message, reasoning, modelName } = request;
    if (!message) return c.json(fail('缺少必要参数 message'), 400);

    let requirements: string | undefined;
    if (request.useAudio && request.ttsOption) {
      const audioPrompts = await Promise.all(request.ttsOption.map(getAudioPromptByOption));
      requirements = audioPrompts.join('\n');
    }

    const dc = await DailyChat.create({ requirements, reasoning, modelName });
    const readable = dc.stream(message, { configurable: { thread_id: DailyChat.sessionId } });

    return streamText(c, async stream => {
      try {
        await pipeReadable(stream, readable);
      } finally {
        try {
          await dc.cleanup();
        } catch (e) {
          logger.warn('DailyChat cleanup failed:', e);
        }
      }
    });
  }

  let requirements: string | undefined;
  if (request.useAudio && request.ttsOption) {
    const audioPrompts = await Promise.all(request.ttsOption.map(getAudioPromptByOption));
    requirements = audioPrompts.join('\n');
  }

  const { userId, sectionId, message, personaId, sessionId, modelName, reasoning } = request;
  const normalizedPersonaId = normalizePersonaId(personaId);

  if (!userId || !sectionId || !message) {
    return c.json(fail('缺少必要参数：userId, sectionId, message'), 400);
  }

  let assistant: LearningAssistant;

  if (sessionId) {
    assistant = await resumeLearningSession(userId, sessionId, requirements, modelName, reasoning);
  } else {
    assistant = await createLearningAssistant(userId, sectionId, normalizedPersonaId, undefined, undefined, requirements, modelName, reasoning);
  }

  const readableStream = assistant.chatStream(message);

  return streamText(c, async stream => {
    try {
      await pipeReadable(stream, readableStream);
    } finally {
      await assistant.cleanup();
    }
  });
});

// ── GET /sessionID/by-user-section ──────────────────

app.get('/sessionID/by-user-section', async c => {
  const userId = c.req.query('userId');
  const sectionId = c.req.query('sectionId');
  if (!userId || !sectionId) return c.json(fail('缺少必要参数：userId 和 sectionId'), 400);

  const interactions = await userDb
    .select()
    .from(aiInteractions)
    .where(and(eq(aiInteractions.user_id, userId), eq(aiInteractions.section_id, sectionId)))
    .orderBy(asc(aiInteractions.query_time));

  // 按 session_id 分组
  const sessionMap = new Map<string, typeof interactions>();

  for (const i of interactions) {
    const list = sessionMap.get(i.session_id) ?? [];
    list.push(i);
    sessionMap.set(i.session_id, list);
  }

  const sessions = [...sessionMap.entries()]
    .map(([session_id, items]) => ({
      session_id,
      interaction_count: items.length,
      first_interaction: items[0]!.query_time,
      last_interaction: items[items.length - 1]!.query_time,
    }))
    .sort((a, b) => {
      const ta = a.last_interaction ? new Date(a.last_interaction).getTime() : 0;
      const tb = b.last_interaction ? new Date(b.last_interaction).getTime() : 0;
      return tb - ta;
    });

  return c.json(
    ok({
      user_id: userId,
      section_id: sectionId,
      session_count: sessions.length,
      sessions,
    }),
  );
});

// ── GET /history/:sessionId ─────────────────────────

app.get('/history/:sessionId', async c => {
  const sessionId = c.req.param('sessionId');
  const withoutInner = c.req.query('withoutInner') === 'true';

  const interactions = await userDb.select().from(aiInteractions).where(eq(aiInteractions.session_id, sessionId)).orderBy(asc(aiInteractions.query_time));

  // 缓存：避免 N+1fact
  const userCache = new Map<string, { name: string }>();
  const sectionCache = new Map<string, { title: string }>();
  const personaCache = new Map<string, { name: string }>();

  let history = await Promise.all(
    interactions.map(async interaction => {
      // 用户名
      let userName: string | undefined;
      if (interaction.user_id) {
        if (!userCache.has(interaction.user_id)) {
          const u = await userDb.select({ name: users.name }).from(users).where(eq(users.user_id, interaction.user_id)).limit(1);
          if (u[0]) userCache.set(interaction.user_id, u[0]);
        }
        userName = userCache.get(interaction.user_id)?.name;
      }

      // 章节名
      let sectionTitle: string | undefined;
      if (interaction.section_id) {
        if (!sectionCache.has(interaction.section_id)) {
          const s = await mainDb.select({ title: sections.title }).from(sections).where(eq(sections.section_id, interaction.section_id)).limit(1);
          if (s[0]) sectionCache.set(interaction.section_id, s[0]);
        }
        sectionTitle = sectionCache.get(interaction.section_id)?.title;
      }

      // 人设名
      let personaName: string | undefined;
      if (interaction.persona_id_in_use) {
        if (!personaCache.has(interaction.persona_id_in_use)) {
          const p = await mainDb.select({ name: aiPersonas.name }).from(aiPersonas).where(eq(aiPersonas.persona_id, interaction.persona_id_in_use)).limit(1);
          if (p[0]) personaCache.set(interaction.persona_id_in_use, p[0]);
        }
        personaName = personaCache.get(interaction.persona_id_in_use)?.name;
      }

      return {
        interaction_id: interaction.interaction_id,
        user_message: interaction.user_message,
        ai_response: interaction.ai_response,
        query_time: interaction.query_time,
        user_name: userName,
        section_title: sectionTitle,
        persona_name: personaName,
      };
    }),
  );

  if (withoutInner) {
    history = history.filter(item => !item.user_message?.trim().startsWith('[inner]'));
  }

  return c.json(
    ok({
      session_id: sessionId,
      message_count: history.length,
      history,
    }),
  );
});

// ── POST /sessions/new ──────────────────────────────

app.post('/sessions/new', async c => {
  const request = createSessionRequestSchema.parse(await c.req.json());
  const { userId, sectionId, personaId } = request;
  const normalizedPersonaId = normalizePersonaId(personaId);

  if (sectionId === '') {
    // daily 模式
    return c.json(
      ok({
        session_id: '12345672',
        user_id: userId,
        section_id: sectionId,
        persona_id: normalizedPersonaId,
        created_at: new Date(),
      }),
    );
  }

  const assistant = await startNewLearningSession(userId, sectionId, normalizedPersonaId);
  const sessionIdResult = assistant.getSessionId();
  const personaInUse = assistant.getPersonaId();
  await assistant.cleanup();

  return c.json(
    ok({
      session_id: sessionIdResult,
      user_id: userId,
      section_id: sectionId,
      persona_id: personaInUse,
      created_at: new Date(),
    }),
  );
});

// ── GET /analytics/:sessionId ───────────────────────

app.get('/analytics/:sessionId', async c => {
  const sessionId = c.req.param('sessionId');
  if (!sessionId) return c.json(fail('缺少会话ID参数'), 400);

  const parts = sessionId.split('_');
  if (parts.length < 4) return c.json(fail('无效的会话ID格式'), 400);

  const userId = parts[1]!;
  const sectionId = parts[2]!;

  const assistant = await createLearningAssistant(userId, sectionId);
  const analytics = await assistant.getSessionAnalytics();
  await assistant.cleanup();

  return c.json(ok(analytics));
});

// ── GET /personas ───────────────────────────────────

app.get('/personas', async c => {
  const rows = await mainDb
    .select({
      persona_id: aiPersonas.persona_id,
      name: aiPersonas.name,
      prompt: aiPersonas.prompt,
      is_default_template: aiPersonas.is_default_template,
    })
    .from(aiPersonas)
    .orderBy(desc(aiPersonas.is_default_template));

  return c.json(ok(rows));
});

// ── POST /switch-persona ────────────────────────────

app.post('/switch-persona', async c => {
  const { sessionId, personaId } = switchPersonaSchema.parse(await c.req.json());

  const parts = sessionId.split('_');
  if (parts.length < 4) return c.json(fail('无效的会话ID格式'), 400);

  const userId = parts[1]!;

  const assistant = await resumeLearningSession(userId, sessionId);
  await assistant.switchPersona(personaId);
  await assistant.cleanup();

  return c.json(ok({ success: true, message: `已成功切换到人设: ${personaId}` }));
});

// ── GET /models ─────────────────────────────────────

app.get('/models', async c => {
  const models = modelConfigManager.getNonEmbeddingModels();
  const modelList = models.map(model => ({
    id: model.id,
    name: model.name,
    displayName: model.displayName || model.name,
  }));

  const defaultModel = modelConfigManager.getDefaultModel();
  const defaultModelName = defaultModel.displayName || defaultModel.name;

  return c.json(ok({ all: modelList, default: defaultModelName }));
});

export default app;
