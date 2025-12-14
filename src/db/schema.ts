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
// Career stages for profile
// ============================================
export const CAREER_STAGES = [
  "junior",      // 新手期
  "growth",      // 成长期
  "senior",      // 成熟期
  "transition",  // 转型期
] as const;

export type CareerStage = typeof CAREER_STAGES[number];

// ============================================
// Risk attitudes for preference
// ============================================
export const RISK_ATTITUDES = [
  "aggressive",  // 激进
  "moderate",    // 稳健
  "conservative", // 保守
] as const;

export type RiskAttitude = typeof RISK_ATTITUDES[number];

// ============================================
// Table 8: candidate_profiles (档案画像)
// 回答"此人是谁、能做什么"
// ============================================
export const candidateProfiles = pgTable("candidate_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }).unique(),

  // 基础属性
  careerStage: varchar("career_stage", { length: 50 }),  // junior/growth/senior/transition
  yearsOfExperience: integer("years_of_experience"),

  // 能力图谱
  hardSkills: jsonb("hard_skills").$type<Array<{name: string; level: number}>>().default([]),
  softSkills: jsonb("soft_skills").$type<Array<{name: string; level: number}>>().default([]),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  knowledgeStructure: jsonb("knowledge_structure").$type<{breadth: number; depth: number}>(),

  // 行为模式
  behaviorPatterns: jsonb("behavior_patterns").$type<{
    communicationStyle?: string;      // 沟通风格
    decisionStyle?: string;           // 决策模式
    collaborationStyle?: string;      // 协作方式
    pressureResponse?: string;        // 压力反应
    conflictHandling?: string;        // 冲突处理
  }>(),

  // 社会位置
  socialPosition: jsonb("social_position").$type<{
    industryInfluence?: string;       // 行业影响力
    networkQuality?: string;          // 人脉质量
    reputation?: string;              // 声誉口碑
  }>(),

  // 资源禀赋
  resources: jsonb("resources").$type<{
    availableTime?: string;           // 可支配时间
    currentCommitments?: string;      // 当前承诺
    constraints?: string;             // 约束条件
  }>(),

  // AI 生成的速写
  profileSummary: text("profile_summary"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Table 9: candidate_preferences (偏好画像)
// 回答"此人要什么、会做什么"
// ============================================
export const candidatePreferences = pgTable("candidate_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }).unique(),

  // 价值排序
  valueRanking: jsonb("value_ranking").$type<Array<{
    value: string;  // 金钱/自由/认可/安全/意义/关系/成长/权力
    rank: number;
  }>>().default([]),

  // 动机结构
  motivation: jsonb("motivation").$type<{
    intrinsic?: string[];   // 内驱：好奇心、掌控感、成长欲、创造欲
    extrinsic?: string[];   // 外驱：物质奖励、社会认可、外部压力
    balance?: string;       // 内外驱动比例描述
  }>(),

  // 目标图景
  goals: jsonb("goals").$type<{
    shortTerm?: string;     // 1年内
    midTerm?: string;       // 3-5年
    longTerm?: string;      // 10年+
    clarity?: string;       // 目标清晰度
  }>(),

  // 风险态度
  riskAttitude: varchar("risk_attitude", { length: 50 }),  // aggressive/moderate/conservative
  riskDetails: jsonb("risk_details").$type<{
    uncertaintyTolerance?: string;    // 不确定性容忍度
    bettingPattern?: string;          // 下注模式
    lossAversion?: string;            // 损失厌恶程度
    timeOrientation?: string;         // 长期/短期导向
  }>(),

  // 认知偏好
  cognitiveStyle: jsonb("cognitive_style").$type<{
    analysisVsIntuition?: string;     // 理性分析 vs 直觉判断
    abstractVsConcrete?: string;      // 抽象 vs 具象
    globalVsDetail?: string;          // 全局 vs 细节
    infoPreference?: string;          // 信息获取偏好
  }>(),

  // 关系偏好
  relationshipStyle: jsonb("relationship_style").$type<{
    depthVsBreadth?: string;          // 深度少量 vs 广泛浅层
    competitionVsCooperation?: string; // 竞争 vs 合作
    leadershipPreference?: string;    // 领导 vs 跟随
    trustPattern?: string;            // 信任建立模式
  }>(),

  // 成长偏好
  growthStyle: jsonb("growth_style").$type<{
    learningStyle?: string;           // 学习风格
    feedbackReceptivity?: string;     // 反馈接受度
    comfortZoneFlexibility?: string;  // 舒适区弹性
    failureAttitude?: string;         // 对失败态度
  }>(),

  // 边界与底线
  boundaries: jsonb("boundaries").$type<{
    moralBoundaries?: string;         // 道德底线
    professionalPrinciples?: string;  // 职业原则
    nonNegotiables?: string[];        // 不可谈判条件
    triggers?: string[];              // 触发负面反应的事项
  }>(),

  // AI 生成的速写
  preferenceSummary: text("preference_summary"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
export type CandidateProfile = typeof candidateProfiles.$inferSelect;
export type NewCandidateProfile = typeof candidateProfiles.$inferInsert;
export type CandidatePreference = typeof candidatePreferences.$inferSelect;
export type NewCandidatePreference = typeof candidatePreferences.$inferInsert;
