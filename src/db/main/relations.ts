import { relations } from 'drizzle-orm';
import { courses, chapters, sections, exercises, exerciseOptions, tests, testExercises, leadingQuestions, aiPersonas } from './schema';

// ── Course 关系 ─────────────────────────────────────

export const coursesRelations = relations(courses, ({ one, many }) => ({
  defaultPersona: one(aiPersonas, {
    fields: [courses.default_ai_persona_id],
    references: [aiPersonas.persona_id],
  }),
  chapters: many(chapters),
  tests: many(tests),
}));

// ── Chapter 关系 ────────────────────────────────────

export const chaptersRelations = relations(chapters, ({ one }) => ({
  course: one(courses, {
    fields: [chapters.course_id],
    references: [courses.course_id],
  }),
}));

// ── Section 关系 ────────────────────────────────────

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [sections.chapter_id],
    references: [chapters.chapter_id],
  }),
  exercises: many(exercises),
  leadingQuestions: many(leadingQuestions),
}));

// ── Exercise 关系 ───────────────────────────────────

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  section: one(sections, {
    fields: [exercises.section_id],
    references: [sections.section_id],
  }),
  options: many(exerciseOptions),
}));

// ── ExerciseOption 关系 ─────────────────────────────

export const exerciseOptionsRelations = relations(exerciseOptions, ({ one }) => ({
  exercise: one(exercises, {
    fields: [exerciseOptions.exercise_id],
    references: [exercises.exercise_id],
  }),
}));

// ── Test 关系 ────────────────────────────────────────

export const testsRelations = relations(tests, ({ one }) => ({
  course: one(courses, {
    fields: [tests.course_id],
    references: [courses.course_id],
  }),
}));

// ── TestExercise 关系 ───────────────────────────────

export const testExercisesRelations = relations(testExercises, ({ one }) => ({
  test: one(tests, {
    fields: [testExercises.test_id],
    references: [tests.test_id],
  }),
  exercise: one(exercises, {
    fields: [testExercises.exercise_id],
    references: [exercises.exercise_id],
  }),
}));

// ── LeadingQuestion 关系 ────────────────────────────

export const leadingQuestionsRelations = relations(leadingQuestions, ({ one }) => ({
  section: one(sections, {
    fields: [leadingQuestions.section_id],
    references: [sections.section_id],
  }),
}));
