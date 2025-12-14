import { pgTable, uuid, varchar, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

// Pipeline stages enum
export const PIPELINE_STAGES = [
  "resume_review",   // 简历筛选
  "phone_screen",    // 电话面试
  "homework",        // 作业
  "team_interview",  // Research team 面试
  "final_interview", // 终面
  "offer",           // Offer
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

// Candidate status enum
export const CANDIDATE_STATUSES = [
  "active",    // 进行中
  "archived",  // 已归档
  "rejected",  // 已拒绝
  "hired",     // 已录用
] as const;

export type CandidateStatus = typeof CANDIDATE_STATUSES[number];

// Attachment types
export const ATTACHMENT_TYPES = [
  "resume",     // 简历
  "recording",  // 录音
  "note",       // 备注文件
  "homework",   // 作业
  "other",      // 其他
] as const;

export type AttachmentType = typeof ATTACHMENT_TYPES[number];

// ============================================
// Table 1: candidates (候选人主表)
// ============================================
export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  location: varchar("location", { length: 255 }),
  linkedin: varchar("linkedin", { length: 500 }),
  github: varchar("github", { length: 500 }),
  website: varchar("website", { length: 500 }),
  summary: text("summary"),
  skills: jsonb("skills").$type<string[]>().default([]),
  resumeRawText: text("resume_raw_text"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  pipelineStage: varchar("pipeline_stage", { length: 50 }).notNull().default("resume_review"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Table 2: work_experiences (工作经历)
// ============================================
export const workExperiences = pgTable("work_experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  company: varchar("company", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  startDate: varchar("start_date", { length: 50 }),
  endDate: varchar("end_date", { length: 50 }),
  description: jsonb("description").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Table 3: educations (教育经历)
// ============================================
export const educations = pgTable("educations", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  school: varchar("school", { length: 255 }).notNull(),
  degree: varchar("degree", { length: 255 }),
  major: varchar("major", { length: 255 }),
  startDate: varchar("start_date", { length: 50 }),
  endDate: varchar("end_date", { length: 50 }),
  gpa: varchar("gpa", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Table 4: projects (项目经历)
// ============================================
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  technologies: jsonb("technologies").$type<string[]>().default([]),
  url: varchar("url", { length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Table 5: pipeline_history (流程历史记录)
// ============================================
export const pipelineHistory = pgTable("pipeline_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  fromStage: varchar("from_stage", { length: 50 }),
  toStage: varchar("to_stage", { length: 50 }).notNull(),
  changedBy: varchar("changed_by", { length: 255 }),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Table 6: attachments (附件 - 指向 Blob)
// ============================================
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  blobUrl: varchar("blob_url", { length: 1000 }).notNull(),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Table 7: interview_notes (面试评价)
// ============================================
export const interviewNotes = pgTable("interview_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  stage: varchar("stage", { length: 50 }).notNull(),
  interviewer: varchar("interviewer", { length: 255 }),
  rating: integer("rating"),
  content: text("content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Type exports for use in application
// ============================================
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
export type WorkExperience = typeof workExperiences.$inferSelect;
export type NewWorkExperience = typeof workExperiences.$inferInsert;
export type Education = typeof educations.$inferSelect;
export type NewEducation = typeof educations.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type PipelineHistoryRecord = typeof pipelineHistory.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type InterviewNote = typeof interviewNotes.$inferSelect;
