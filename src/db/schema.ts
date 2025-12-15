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
// Interview Types
// ============================================
export const INTERVIEW_TYPES = [
  "phone_screen",    // 电话面试
  "video",           // 视频面试
  "in_person",       // 现场面试
  "panel",           // 群面
  "technical",       // 技术面试
  "behavioral",      // 行为面试
  "case_study",      // 案例分析
] as const;

export type InterviewType = typeof INTERVIEW_TYPES[number];

// ============================================
// Interview Session Status
// ============================================
export const INTERVIEW_SESSION_STATUSES = [
  "scheduled",       // 已安排
  "in_progress",     // 进行中
  "completed",       // 已完成
  "cancelled",       // 已取消
  "no_show",         // 未出席
] as const;

export type InterviewSessionStatus = typeof INTERVIEW_SESSION_STATUSES[number];

// ============================================
// Question Categories
// ============================================
export const QUESTION_CATEGORIES = [
  "technical",       // 技术问题
  "behavioral",      // 行为问题
  "situational",     // 情景问题
  "motivational",    // 动机问题
  "cultural_fit",    // 文化匹配
  "case_study",      // 案例分析
  "general",         // 通用问题
] as const;

export type QuestionCategory = typeof QUESTION_CATEGORIES[number];

// ============================================
// Table 13: interview_sessions (面试场次)
// 每次正式面试的记录
// ============================================
export const interviewSessions = pgTable("interview_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),

  // 面试信息
  pipelineStage: varchar("pipeline_stage", { length: 50 }).notNull(), // 对应 candidates 的 pipeline_stage
  interviewType: varchar("interview_type", { length: 50 }).notNull(), // phone_screen/video/in_person/panel/technical/behavioral/case_study
  title: varchar("title", { length: 255 }).notNull(), // 面试标题，如"第一轮技术面试"

  // 时间安排
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // 实际时长（分钟）

  // 面试官
  interviewers: jsonb("interviewers").$type<Array<{
    name: string;
    role?: string;
    email?: string;
  }>>().default([]),

  // 状态
  status: varchar("status", { length: 50 }).notNull().default("scheduled"),

  // 位置/链接
  location: varchar("location", { length: 500 }), // 面试地点或视频链接
  meetingLink: varchar("meeting_link", { length: 500 }), // 在线会议链接

  // 备注
  notes: text("notes"), // 面试前备注

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Table 14: interview_questions (面试问题库)
// 可复用的面试问题
// ============================================
export const interviewQuestions = pgTable("interview_questions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // 问题内容
  question: text("question").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // technical/behavioral/situational/motivational/cultural_fit/case_study
  difficulty: integer("difficulty"), // 1-5

  // 问题上下文
  targetRole: varchar("target_role", { length: 255 }), // 针对的岗位
  targetLevel: varchar("target_level", { length: 50 }), // junior/senior/lead 等

  // 评分标准
  expectedPoints: jsonb("expected_points").$type<string[]>().default([]), // 期望答案要点
  scoringCriteria: jsonb("scoring_criteria").$type<Array<{
    criterion: string;
    weight: number;
  }>>(),

  // 关联技能
  relatedSkills: jsonb("related_skills").$type<string[]>().default([]),

  // 使用统计
  timesUsed: integer("times_used").notNull().default(0),
  avgScore: integer("avg_score"), // 平均得分 1-5

  // 来源
  createdBy: varchar("created_by", { length: 255 }),
  isActive: varchar("is_active", { length: 10 }).notNull().default("true"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Table 15: session_questions (面试问答记录)
// 特定面试中问的问题和候选人回答
// ============================================
export const sessionQuestions = pgTable("session_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => interviewSessions.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").references(() => interviewQuestions.id), // 可选，可能是临时问题

  // 问题（如果是临时问题，直接存储）
  questionText: text("question_text").notNull(),
  category: varchar("category", { length: 50 }),

  // 候选人回答
  answerText: text("answer_text"), // 文字记录/转录
  answerNotes: text("answer_notes"), // 面试官对回答的笔记

  // 评分
  score: integer("score"), // 1-5
  scoreNotes: text("score_notes"), // 评分理由

  // 顺序和时间
  orderIndex: integer("order_index"), // 问题顺序
  askedAt: timestamp("asked_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Table 16: interview_evaluations (面试评估)
// 每场面试的综合评估
// ============================================
export const interviewEvaluations = pgTable("interview_evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => interviewSessions.id, { onDelete: "cascade" }),
  evaluatorName: varchar("evaluator_name", { length: 255 }).notNull(),
  evaluatorRole: varchar("evaluator_role", { length: 255 }),

  // 分项评分 (1-5)
  technicalScore: integer("technical_score"),
  communicationScore: integer("communication_score"),
  problemSolvingScore: integer("problem_solving_score"),
  culturalFitScore: integer("cultural_fit_score"),
  overallScore: integer("overall_score"),

  // 评价内容
  strengths: jsonb("strengths").$type<string[]>().default([]),
  concerns: jsonb("concerns").$type<string[]>().default([]),
  detailedFeedback: text("detailed_feedback"),

  // 推荐
  recommendation: varchar("recommendation", { length: 50 }), // strong_yes/yes/maybe/no/strong_no
  recommendationNotes: text("recommendation_notes"),

  // 是否继续
  proceedToNext: varchar("proceed_to_next", { length: 10 }).default("pending"), // yes/no/pending

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Table 17: interview_transcripts (面试录音转录)
// 面试录音的文字转录和AI分析
// ============================================
export const interviewTranscripts = pgTable("interview_transcripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => interviewSessions.id, { onDelete: "cascade" }),

  // 音频/视频文件
  recordingUrl: varchar("recording_url", { length: 1000 }),
  recordingType: varchar("recording_type", { length: 50 }), // audio/video
  recordingDuration: integer("recording_duration"), // 秒

  // 转录内容
  rawTranscript: text("raw_transcript"), // 原始转录文本
  structuredTranscript: jsonb("structured_transcript").$type<Array<{
    speaker: string;
    timestamp: string;
    text: string;
  }>>(),

  // AI 分析
  aiSummary: text("ai_summary"), // AI 生成的面试摘要
  aiKeyInsights: jsonb("ai_key_insights").$type<Array<{
    category: string;
    insight: string;
    confidence: number;
  }>>(),
  aiStrengths: jsonb("ai_strengths").$type<string[]>().default([]),
  aiConcerns: jsonb("ai_concerns").$type<string[]>().default([]),
  aiRecommendation: text("ai_recommendation"),

  // Profile/Preference 更新建议
  profileUpdates: jsonb("profile_updates").$type<Record<string, unknown>>(),
  preferenceUpdates: jsonb("preference_updates").$type<Record<string, unknown>>(),

  // 处理状态
  transcriptionStatus: varchar("transcription_status", { length: 50 }).default("pending"), // pending/processing/completed/failed
  analysisStatus: varchar("analysis_status", { length: 50 }).default("pending"), // pending/processing/completed/failed

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Bug status enum
// ============================================
export const BUG_STATUSES = [
  "open",       // 待处理
  "confirmed",  // 已确认
  "in_progress", // 修复中
  "fixed",      // 已修复
  "wont_fix",   // 不修复
  "duplicate",  // 重复
] as const;

export type BugStatus = typeof BUG_STATUSES[number];

// ============================================
// Bug priority enum
// ============================================
export const BUG_PRIORITIES = [
  "critical",   // 严重
  "high",       // 高
  "medium",     // 中
  "low",        // 低
] as const;

export type BugPriority = typeof BUG_PRIORITIES[number];

// ============================================
// Feature request status enum
// ============================================
export const FEATURE_STATUSES = [
  "proposed",     // 提议中
  "under_review", // 评审中
  "planned",      // 已计划
  "in_progress",  // 开发中
  "completed",    // 已完成
  "rejected",     // 已拒绝
] as const;

export type FeatureStatus = typeof FEATURE_STATUSES[number];

// ============================================
// Table 10: bug_reports (Bug报告)
// ============================================
export const bugReports = pgTable("bug_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  stepsToReproduce: text("steps_to_reproduce"),
  expectedBehavior: text("expected_behavior"),
  actualBehavior: text("actual_behavior"),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  priority: varchar("priority", { length: 50 }).default("medium"),
  reportedBy: varchar("reported_by", { length: 255 }),
  assignedTo: varchar("assigned_to", { length: 255 }),

  // AI分析字段
  aiAnalysis: text("ai_analysis"),
  aiSuggestedFix: text("ai_suggested_fix"),
  relatedFiles: jsonb("related_files").$type<string[]>().default([]),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Table 11: feature_requests (功能建议)
// ============================================
export const featureRequests = pgTable("feature_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  useCase: text("use_case"),  // 使用场景
  status: varchar("status", { length: 50 }).notNull().default("proposed"),
  priority: varchar("priority", { length: 50 }).default("medium"),
  requestedBy: varchar("requested_by", { length: 255 }),
  votes: integer("votes").notNull().default(0),

  // AI分析字段
  aiAnalysis: text("ai_analysis"),
  aiImplementationPlan: text("ai_implementation_plan"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Table 12: roadmap_items (路线图)
// ============================================
export const roadmapItems = pgTable("roadmap_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: varchar("version", { length: 50 }).notNull(),  // e.g., "v0.1", "v0.2"
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("planned"), // planned/in_progress/completed
  features: jsonb("features").$type<string[]>().default([]),
  targetDate: timestamp("target_date"),
  completedDate: timestamp("completed_date"),
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
export type BugReport = typeof bugReports.$inferSelect;
export type NewBugReport = typeof bugReports.$inferInsert;
export type FeatureRequest = typeof featureRequests.$inferSelect;
export type NewFeatureRequest = typeof featureRequests.$inferInsert;
export type RoadmapItem = typeof roadmapItems.$inferSelect;
export type NewRoadmapItem = typeof roadmapItems.$inferInsert;
export type InterviewSession = typeof interviewSessions.$inferSelect;
export type NewInterviewSession = typeof interviewSessions.$inferInsert;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type NewInterviewQuestion = typeof interviewQuestions.$inferInsert;
export type SessionQuestion = typeof sessionQuestions.$inferSelect;
export type NewSessionQuestion = typeof sessionQuestions.$inferInsert;
export type InterviewEvaluation = typeof interviewEvaluations.$inferSelect;
export type NewInterviewEvaluation = typeof interviewEvaluations.$inferInsert;
export type InterviewTranscript = typeof interviewTranscripts.$inferSelect;
export type NewInterviewTranscript = typeof interviewTranscripts.$inferInsert;
