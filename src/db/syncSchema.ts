import type { PGlite } from '@electric-sql/pglite';
import logger from '../utils/logger';

/**
 * 同步数据库 schema（PGlite 开发模式）
 * 使用 CREATE TABLE IF NOT EXISTS 确保表结构存在
 */
export async function syncMainSchema(pg: PGlite): Promise<void> {
  await pg.exec(`
    CREATE TABLE IF NOT EXISTS ai_personas (
      persona_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      prompt TEXT NOT NULL,
      is_default_template BOOLEAN NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS courses (
      course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      icon_url TEXT,
      description TEXT,
      default_ai_persona_id UUID
    );

    CREATE TABLE IF NOT EXISTS chapters (
      chapter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL,
      title VARCHAR(255) NOT NULL,
      chapter_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sections (
      section_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      chapter_id UUID NOT NULL,
      video_url TEXT,
      knowledge_points JSONB,
      video_subtitles JSONB,
      srt_path VARCHAR(512),
      knowledge_content TEXT,
      estimated_time INTEGER,
      section_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercises (
      exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id UUID,
      question TEXT NOT NULL,
      type_status VARCHAR(50) NOT NULL,
      score INTEGER NOT NULL DEFAULT 1,
      answer TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS exercise_options (
      option_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      exercise_id UUID NOT NULL,
      option_text TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS tests (
      test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID,
      type_status VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS test_exercises (
      test_id UUID NOT NULL,
      exercise_id UUID NOT NULL,
      PRIMARY KEY (test_id, exercise_id)
    );

    CREATE TABLE IF NOT EXISTS leading_question (
      question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id UUID NOT NULL,
      question TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_prompts (
      title VARCHAR(255) PRIMARY KEY,
      prompt_text TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  logger.info('✅ 主库 schema 已同步');
}

export async function syncUserSchema(pg: PGlite): Promise<void> {
  await pg.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      education_level VARCHAR(255),
      learning_ability TEXT,
      goal TEXT,
      level INTEGER,
      experience INTEGER,
      current_title_id UUID
    );

    CREATE TABLE IF NOT EXISTS course_schedule (
      plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      course_id UUID NOT NULL,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      status VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS learning_records (
      task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plan_id UUID NOT NULL,
      user_id UUID NOT NULL,
      section_id UUID NOT NULL,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      status VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS titles (
      title_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      icon_url TEXT,
      min_experience_required INTEGER,
      min_section_required INTEGER,
      is_default_template BOOLEAN
    );

    CREATE TABLE IF NOT EXISTS ai_interactions (
      interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      section_id UUID NOT NULL,
      session_id VARCHAR(255) NOT NULL,
      user_message TEXT NOT NULL,
      ai_response TEXT NOT NULL,
      query_time TIMESTAMP,
      persona_id_in_use UUID
    );

    CREATE TABLE IF NOT EXISTS daily_summaries (
      summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      summary_date TIMESTAMP NOT NULL,
      content TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_session_mapping (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      thread_id UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata JSONB
    );

    CREATE TABLE IF NOT EXISTS conversation_analytics (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      conversation_summary TEXT,
      analytics_data JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_section_unlock (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      chapter_id UUID NOT NULL,
      section_id UUID,
      unlocked INTEGER NOT NULL DEFAULT 0,
      duration INTEGER NOT NULL DEFAULT 0,
      UNIQUE (user_id, chapter_id, section_id)
    );

    CREATE TABLE IF NOT EXISTS exercise_results (
      result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      exercise_id UUID NOT NULL,
      test_result_id UUID,
      user_answer TEXT,
      score INTEGER,
      ai_feedback TEXT
    );

    CREATE TABLE IF NOT EXISTS test_results (
      result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      test_id UUID NOT NULL,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP,
      score INTEGER,
      ai_feedback TEXT
    );
  `);
  logger.info('✅ 用户库 schema 已同步');
}
