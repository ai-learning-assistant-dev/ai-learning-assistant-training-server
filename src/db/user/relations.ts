import { relations } from 'drizzle-orm';
import { users, courseSchedules, learningRecords, dailySummaries } from './schema';

// ── User 关系 ───────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  dailySummaries: many(dailySummaries),
  learningRecords: many(learningRecords),
}));

// ── CourseSchedule 关系 ─────────────────────────────

export const courseSchedulesRelations = relations(courseSchedules, ({ many }) => ({
  learningRecords: many(learningRecords),
}));

// ── LearningRecord 关系 ─────────────────────────────

export const learningRecordsRelations = relations(learningRecords, ({ one }) => ({
  user: one(users, {
    fields: [learningRecords.user_id],
    references: [users.user_id],
  }),
  plan: one(courseSchedules, {
    fields: [learningRecords.plan_id],
    references: [courseSchedules.plan_id],
  }),
}));

// ── DailySummary 关系 ───────────────────────────────

export const dailySummariesRelations = relations(dailySummaries, ({ one }) => ({
  user: one(users, {
    fields: [dailySummaries.user_id],
    references: [users.user_id],
  }),
}));
