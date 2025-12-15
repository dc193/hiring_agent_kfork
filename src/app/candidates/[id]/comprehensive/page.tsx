import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileText, Sparkles, MessageSquare, Star, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  db,
  candidates,
  attachments,
  processingJobs,
  interviewSessions,
  interviewEvaluations,
  sessionQuestions,
  interviewNotes,
  PIPELINE_STAGES,
} from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { PageLayout, Section, Card, CardContent, Button, Badge } from "@/components/ui";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STAGE_LABELS: Record<string, string> = {
  resume_review: "简历筛选",
  phone_screen: "电话面试",
  homework: "作业",
  team_interview: "Team 面试",
  final_interview: "终面",
  offer: "Offer",
};

const TYPE_LABELS: Record<string, string> = {
  resume: "简历",
  recording: "录音",
  transcript: "转录",
  homework: "作业",
  note: "备注",
  other: "其他",
  report: "分析报告",
};

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string }> = {
  strong_yes: { label: "强烈推荐", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  yes: { label: "推荐", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  maybe: { label: "待定", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  no: { label: "不推荐", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  strong_no: { label: "强烈不推荐", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

// Safe query helper
async function safeQuery<T>(queryFn: () => Promise<T[]>, defaultValue: T[] = []): Promise<T[]> {
  try {
    return await queryFn();
  } catch (error) {
    if (error && typeof error === "object") {
      const err = error as { code?: string; message?: string };
      if (err.code === "42P01" || err.code === "42703") {
        return defaultValue;
      }
      if (err.message?.includes("does not exist") || err.message?.includes("relation")) {
        return defaultValue;
      }
    }
    throw error;
  }
}

export default async function ComprehensivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, id));

  if (!candidate) {
    notFound();
  }

  // Fetch all related data
  const [
    allAttachments,
    allProcessingJobs,
    allSessions,
    allNotes,
  ] = await Promise.all([
    db.select().from(attachments).where(eq(attachments.candidateId, id)).orderBy(desc(attachments.createdAt)),
    safeQuery(() => db.select().from(processingJobs).where(eq(processingJobs.candidateId, id)).orderBy(desc(processingJobs.createdAt))),
    safeQuery(() => db.select().from(interviewSessions).where(eq(interviewSessions.candidateId, id)).orderBy(desc(interviewSessions.createdAt))),
    db.select().from(interviewNotes).where(eq(interviewNotes.candidateId, id)).orderBy(desc(interviewNotes.createdAt)),
  ]);

  // Fetch evaluations and questions for each session
  const sessionDetails = await Promise.all(
    allSessions.map(async (session) => {
      const [evaluations, questions] = await Promise.all([
        safeQuery(() => db.select().from(interviewEvaluations).where(eq(interviewEvaluations.sessionId, session.id))),
        safeQuery(() => db.select().from(sessionQuestions).where(eq(sessionQuestions.sessionId, session.id)).orderBy(sessionQuestions.orderIndex)),
      ]);
      return { session, evaluations, questions };
    })
  );

  // Group attachments by stage
  const attachmentsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = allAttachments.filter((a) => a.pipelineStage === stage);
    return acc;
  }, {} as Record<string, typeof allAttachments>);

  // Map processing jobs to attachments
  const processingJobsByAttachment = allProcessingJobs.reduce((acc, job) => {
    if (!acc[job.attachmentId]) {
      acc[job.attachmentId] = [];
    }
    acc[job.attachmentId].push(job);
    return acc;
  }, {} as Record<string, typeof allProcessingJobs>);

  // Group sessions by stage
  const sessionsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = sessionDetails.filter((sd) => sd.session.pipelineStage === stage);
    return acc;
  }, {} as Record<string, typeof sessionDetails>);

  // Group notes by stage
  const notesByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = allNotes.filter((n) => n.stage === stage);
    return acc;
  }, {} as Record<string, typeof allNotes>);

  // Calculate overall stats
  const totalAttachments = allAttachments.length;
  const totalAnalysisReports = allProcessingJobs.filter(j => j.status === "completed" && j.jobType === "analyze").length;
  const totalSessions = allSessions.length;
  const totalEvaluations = sessionDetails.reduce((sum, sd) => sum + sd.evaluations.length, 0);

  return (
    <PageLayout>
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
        <Link href={`/candidates/${id}`}>
          <ChevronLeft className="w-4 h-4" />
          返回 {candidate.name}
        </Link>
      </Button>

      {/* Page Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                综合档案 / Comprehensive Profile
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {candidate.name} 的所有材料、评估和分析结果汇总
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              当前阶段: {STAGE_LABELS[candidate.pipelineStage]}
            </Badge>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalAttachments}</p>
              <p className="text-sm text-zinc-500">附件材料</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalAnalysisReports}</p>
              <p className="text-sm text-zinc-500">AI分析报告</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalSessions}</p>
              <p className="text-sm text-zinc-500">面试场次</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalEvaluations}</p>
              <p className="text-sm text-zinc-500">面试评估</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline by Stage */}
      {PIPELINE_STAGES.map((stage) => {
        const stageAttachments = attachmentsByStage[stage];
        const stageSessions = sessionsByStage[stage];
        const stageNotes = notesByStage[stage];
        const hasContent = stageAttachments.length > 0 || stageSessions.length > 0 || stageNotes.length > 0;

        if (!hasContent) return null;

        const isCurrentStage = candidate.pipelineStage === stage;
        const isPastStage = PIPELINE_STAGES.indexOf(candidate.pipelineStage as typeof PIPELINE_STAGES[number]) > PIPELINE_STAGES.indexOf(stage);

        return (
          <Section
            key={stage}
            title={
              <div className="flex items-center gap-2">
                <span>{STAGE_LABELS[stage]}</span>
                {isCurrentStage && (
                  <Badge variant="default" className="bg-blue-500 text-xs">当前</Badge>
                )}
                {isPastStage && (
                  <Badge variant="secondary" className="text-xs">已完成</Badge>
                )}
              </div>
            }
            className="mb-6"
          >
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Attachments with Analysis */}
                {stageAttachments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      材料附件 ({stageAttachments.length})
                    </h4>
                    <div className="space-y-3">
                      {stageAttachments.map((attachment) => {
                        const jobs = processingJobsByAttachment[attachment.id] || [];
                        const analysisJob = jobs.find(j => j.jobType === "analyze" && j.status === "completed");
                        const outputData = analysisJob?.outputData as { analysis?: string; summary?: string } | null;

                        return (
                          <div
                            key={attachment.id}
                            className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                          >
                            {/* Attachment Header */}
                            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-zinc-500" />
                                <a
                                  href={attachment.blobUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {attachment.fileName}
                                </a>
                                <Badge variant="secondary" className="text-xs">
                                  {TYPE_LABELS[attachment.type] || attachment.type}
                                </Badge>
                              </div>
                              <span className="text-xs text-zinc-500">
                                {new Date(attachment.createdAt).toLocaleDateString("zh-CN")}
                              </span>
                            </div>

                            {/* AI Analysis Result */}
                            {analysisJob && outputData && (
                              <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="w-4 h-4 text-purple-500" />
                                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                    AI 分析结果
                                  </span>
                                </div>
                                <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg">
                                  {outputData.summary || outputData.analysis || JSON.stringify(outputData, null, 2)}
                                </div>
                              </div>
                            )}

                            {/* Processing Status if not completed */}
                            {jobs.length > 0 && !analysisJob && (
                              <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
                                {jobs.map((job) => (
                                  <div key={job.id} className="flex items-center gap-2 text-sm">
                                    {job.status === "pending" && (
                                      <>
                                        <Clock className="w-4 h-4 text-zinc-400" />
                                        <span className="text-zinc-500">{job.jobType}: 等待处理</span>
                                      </>
                                    )}
                                    {job.status === "processing" && (
                                      <>
                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-blue-600 dark:text-blue-400">{job.jobType}: 处理中...</span>
                                      </>
                                    )}
                                    {job.status === "failed" && (
                                      <>
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-red-600 dark:text-red-400">{job.jobType}: 处理失败</span>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Interview Sessions */}
                {stageSessions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      面试记录 ({stageSessions.length})
                    </h4>
                    <div className="space-y-4">
                      {stageSessions.map(({ session, evaluations, questions }) => (
                        <div
                          key={session.id}
                          className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                        >
                          {/* Session Header */}
                          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50">
                            <div>
                              <Link
                                href={`/candidates/${id}/interviews/${session.id}`}
                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {session.title}
                              </Link>
                              <p className="text-xs text-zinc-500 mt-1">
                                {session.scheduledAt
                                  ? new Date(session.scheduledAt).toLocaleDateString("zh-CN", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "未安排时间"}
                              </p>
                            </div>
                            <Badge
                              variant={
                                session.status === "completed"
                                  ? "default"
                                  : session.status === "scheduled"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {session.status === "completed" ? "已完成" :
                               session.status === "scheduled" ? "已安排" :
                               session.status === "cancelled" ? "已取消" :
                               session.status === "in_progress" ? "进行中" :
                               session.status}
                            </Badge>
                          </div>

                          {/* Evaluations */}
                          {evaluations.length > 0 && (
                            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
                              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                                面试评估 ({evaluations.length})
                              </p>
                              <div className="space-y-3">
                                {evaluations.map((evaluation) => (
                                  <div
                                    key={evaluation.id}
                                    className="bg-zinc-50 dark:bg-zinc-800/30 rounded-lg p-3"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                        {evaluation.evaluatorName}
                                        {evaluation.evaluatorRole && (
                                          <span className="text-zinc-500 ml-1">({evaluation.evaluatorRole})</span>
                                        )}
                                      </span>
                                      {evaluation.recommendation && RECOMMENDATION_LABELS[evaluation.recommendation] && (
                                        <Badge className={RECOMMENDATION_LABELS[evaluation.recommendation].color}>
                                          {RECOMMENDATION_LABELS[evaluation.recommendation].label}
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Scores */}
                                    <div className="flex flex-wrap gap-4 text-sm mb-2">
                                      {evaluation.overallScore && (
                                        <span className="flex items-center gap-1">
                                          <Star className="w-4 h-4 text-yellow-500" />
                                          总分: {evaluation.overallScore}/5
                                        </span>
                                      )}
                                      {evaluation.technicalScore && (
                                        <span>技术: {evaluation.technicalScore}/5</span>
                                      )}
                                      {evaluation.communicationScore && (
                                        <span>沟通: {evaluation.communicationScore}/5</span>
                                      )}
                                      {evaluation.problemSolvingScore && (
                                        <span>问题解决: {evaluation.problemSolvingScore}/5</span>
                                      )}
                                      {evaluation.culturalFitScore && (
                                        <span>文化匹配: {evaluation.culturalFitScore}/5</span>
                                      )}
                                    </div>

                                    {/* Strengths & Concerns */}
                                    {((evaluation.strengths as string[]) || []).length > 0 && (
                                      <div className="mt-2">
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">优点:</span>
                                        <ul className="text-sm text-zinc-600 dark:text-zinc-400 ml-4 list-disc">
                                          {((evaluation.strengths as string[]) || []).map((s, i) => (
                                            <li key={i}>{s}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {((evaluation.concerns as string[]) || []).length > 0 && (
                                      <div className="mt-2">
                                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">顾虑:</span>
                                        <ul className="text-sm text-zinc-600 dark:text-zinc-400 ml-4 list-disc">
                                          {((evaluation.concerns as string[]) || []).map((c, i) => (
                                            <li key={i}>{c}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Detailed Feedback */}
                                    {evaluation.detailedFeedback && (
                                      <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                        <span className="text-xs font-medium">详细反馈:</span>
                                        <p className="mt-1 whitespace-pre-wrap">{evaluation.detailedFeedback}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Questions & Answers */}
                          {questions.length > 0 && (
                            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
                              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                                问答记录 ({questions.length})
                              </p>
                              <div className="space-y-3">
                                {questions.slice(0, 5).map((q, index) => (
                                  <div key={q.id} className="bg-zinc-50 dark:bg-zinc-800/30 rounded-lg p-3">
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                      Q{index + 1}: {q.questionText}
                                    </p>
                                    {q.answerText && (
                                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                        A: {q.answerText.length > 200 ? `${q.answerText.slice(0, 200)}...` : q.answerText}
                                      </p>
                                    )}
                                    {q.score && (
                                      <div className="flex items-center gap-1 mt-2">
                                        <Star className="w-3 h-3 text-yellow-500" />
                                        <span className="text-xs text-zinc-500">评分: {q.score}/5</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {questions.length > 5 && (
                                  <Link
                                    href={`/candidates/${id}/interviews/${session.id}`}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    查看全部 {questions.length} 个问答...
                                  </Link>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interview Notes */}
                {stageNotes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      面试备注 ({stageNotes.length})
                    </h4>
                    <div className="space-y-3">
                      {stageNotes.map((note) => (
                        <div
                          key={note.id}
                          className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {note.interviewer || "匿名"}
                            </span>
                            <div className="flex items-center gap-2">
                              {note.rating && (
                                <span className="flex items-center gap-1 text-sm">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  {note.rating}/5
                                </span>
                              )}
                              <span className="text-xs text-zinc-500">
                                {new Date(note.createdAt).toLocaleDateString("zh-CN")}
                              </span>
                            </div>
                          </div>
                          {note.content && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                              {note.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Section>
        );
      })}

      {/* No Content Message */}
      {totalAttachments === 0 && totalSessions === 0 && allNotes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
            <p className="text-zinc-500">暂无材料和评估记录</p>
            <p className="text-sm text-zinc-400 mt-1">
              通过 Pipeline 各阶段页面上传材料或创建面试记录
            </p>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
