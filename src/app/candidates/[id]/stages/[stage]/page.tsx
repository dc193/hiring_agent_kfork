import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db, candidates, attachments, interviewSessions, PIPELINE_STAGES } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { PageLayout, Section, Card, CardContent, Button, Badge } from "@/components/ui";
import { StageAttachments } from "@/components/stages";

const STAGE_LABELS: Record<string, string> = {
  resume_review: "简历筛选",
  phone_screen: "电话面试",
  homework: "作业",
  team_interview: "Team 面试",
  final_interview: "终面",
  offer: "Offer",
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  resume_review: "初步筛选候选人简历，评估基本条件是否符合岗位要求",
  phone_screen: "通过电话/视频初步了解候选人，确认基本信息和意向",
  homework: "分配技术作业或案例分析，评估实际能力",
  team_interview: "与团队成员进行深度技术面试和文化匹配评估",
  final_interview: "最终决策面试，通常由高层或HR参与",
  offer: "发放录用通知，进行薪资谈判",
};

const STAGE_ATTACHMENT_TYPES: Record<string, Array<{ value: string; label: string }>> = {
  resume_review: [
    { value: "resume", label: "简历" },
    { value: "note", label: "筛选备注" },
    { value: "other", label: "其他" },
  ],
  phone_screen: [
    { value: "recording", label: "通话录音" },
    { value: "transcript", label: "转录文本" },
    { value: "note", label: "面试笔记" },
    { value: "other", label: "其他" },
  ],
  homework: [
    { value: "homework", label: "作业提交" },
    { value: "note", label: "评审意见" },
    { value: "other", label: "其他" },
  ],
  team_interview: [
    { value: "recording", label: "面试录音" },
    { value: "transcript", label: "转录文本" },
    { value: "note", label: "面试笔记" },
    { value: "other", label: "其他" },
  ],
  final_interview: [
    { value: "recording", label: "面试录音" },
    { value: "transcript", label: "转录文本" },
    { value: "note", label: "面试笔记" },
    { value: "other", label: "其他" },
  ],
  offer: [
    { value: "offer_letter", label: "Offer Letter" },
    { value: "contract", label: "合同" },
    { value: "note", label: "备注" },
    { value: "other", label: "其他" },
  ],
};

export default async function StagePage({
  params,
}: {
  params: Promise<{ id: string; stage: string }>;
}) {
  const { id, stage } = await params;

  // Validate stage
  if (!PIPELINE_STAGES.includes(stage as typeof PIPELINE_STAGES[number])) {
    notFound();
  }

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, id));

  if (!candidate) {
    notFound();
  }

  // Get attachments for this stage
  const stageAttachments = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.candidateId, id),
        eq(attachments.pipelineStage, stage)
      )
    )
    .orderBy(desc(attachments.createdAt));

  // Get interview sessions for this stage
  const stageSessions = await db
    .select()
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.candidateId, id),
        eq(interviewSessions.pipelineStage, stage)
      )
    )
    .orderBy(desc(interviewSessions.scheduledAt));

  const currentStageIndex = PIPELINE_STAGES.indexOf(stage as typeof PIPELINE_STAGES[number]);
  const prevStage = currentStageIndex > 0 ? PIPELINE_STAGES[currentStageIndex - 1] : null;
  const nextStage = currentStageIndex < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[currentStageIndex + 1] : null;

  const isCurrentStage = candidate.pipelineStage === stage;
  const isPastStage = PIPELINE_STAGES.indexOf(candidate.pipelineStage as typeof PIPELINE_STAGES[number]) > currentStageIndex;

  return (
    <PageLayout>
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
        <Link href={`/candidates/${id}`}>
          <ChevronLeft className="w-4 h-4" />
          Back to {candidate.name}
        </Link>
      </Button>

      {/* Stage Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {STAGE_LABELS[stage]}
                </h1>
                {isCurrentStage && (
                  <Badge variant="default" className="bg-blue-500">当前阶段</Badge>
                )}
                {isPastStage && (
                  <Badge variant="secondary">已完成</Badge>
                )}
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                {STAGE_DESCRIPTIONS[stage]}
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                候选人: <span className="font-medium text-zinc-700 dark:text-zinc-300">{candidate.name}</span>
              </p>
            </div>
          </div>

          {/* Stage Navigation */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            {prevStage ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/candidates/${id}/stages/${prevStage}`}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {STAGE_LABELS[prevStage]}
                </Link>
              </Button>
            ) : (
              <div />
            )}
            {nextStage && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/candidates/${id}/stages/${nextStage}`}>
                  {STAGE_LABELS[nextStage]}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attachments Section */}
      <Section title="阶段材料 / Attachments" className="mb-6">
        <StageAttachments
          candidateId={id}
          stage={stage}
          initialAttachments={stageAttachments}
          attachmentTypes={STAGE_ATTACHMENT_TYPES[stage] || STAGE_ATTACHMENT_TYPES.resume_review}
        />
      </Section>

      {/* Interview Sessions for this stage */}
      {stageSessions.length > 0 && (
        <Section title="面试记录 / Interview Sessions">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {stageSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/candidates/${id}/interviews/${session.id}`}
                    className="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                          {session.title}
                        </h4>
                        <p className="text-sm text-zinc-500">
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
                         session.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>
      )}
    </PageLayout>
  );
}
