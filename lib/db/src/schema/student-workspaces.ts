import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// One row per authenticated student; document updates are serialized with a row lock.
export const studentWorkspaces = pgTable("student_workspaces", {
  userId: text("user_id").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertStudentWorkspaceSchema = createInsertSchema(studentWorkspaces);
export type StudentWorkspace = typeof studentWorkspaces.$inferSelect;
