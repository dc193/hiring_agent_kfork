import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db, candidates, attachments, interviewSessions, PIPELINE_STAGES, Attachment, InterviewSession, templateStages, stagePrompts, StagePrompt } from "@/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { PageLayout, Section, Card, CardContent, Button, Badge } from "@/components/ui";
import { StageAttachments, AIAnalysisSection, GenerateSummaryButton } from "@/components/stages";

// Safe query helper for tables that may not exist yet
async function safeQuery<T>(queryFn: () => Promise<T[]>, defaultValue: T[] = []): Promise<T[]> {
  try {
    return await queryFn();
  } catch (error) {
    // Handle table/column not found errors
    if (error && typeof error === "object" && "code" in error) {
      const code = (error as { code: string }).code;
      if (code === "42P01" || code === "42703") {
        // 42P01: undefined_table, 42703: undefined_column
        console.warn("Table or column not found, returning empty array");
        return defaultValue;
      }
    }
    throw error;
  }
}

const STAGE_LABELS: Record<string, string> = {
  resume_review: "简历筛选",
  phone_screen: "电话面试",
  homework: "作业",
  team_interview: "Team 面试",
  consultant_review: "外部顾问",
  final_interview: "终面",
  offer: "Offer",
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  resume_review: "初步筛选候选人简历，评估基本条件是否符合岗位要求",
  phone_screen: "通过电话/视频初步了解候选人，确认基本信息和意向",
  homework: "分配技术作业或案例分析，评估实际能力",
  team_interview: "与团队成员进行深度技术面试和文化匹配评估",
  consultant_review: "外部顾问或专家对候选人进行独立评估和分析",
  final_interview: "最终决策面试，通常由高层或HR参与",
  offer: "发放录用通知，进行薪资谈判",
};

// Unified attachment types for all stages
const ATTACHMENT_TYPES = [
  { value: "transcript", label: "转录/记录" },
  { value: "portfolio", label: "作品" },
  { value: "note", label: "备注" },
  { value: "contract", label: "合同/Offer" },
  { value: "other", label: "其他" },
];

export default async function StagePage({
  params,
}: {
  params: Promise<{ id: string; stage: string }>;
}) {
  const { id, stage: encodedStage } = await params;
  // Decode URL-encoded stage name (e.g., %E7%AE%80%E5%8E%86 -> 简历)
  const stage = decodeURIComponent(encodedStage);

  // First get the candidate to check their template
  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, id));

  if (!candidate) {
    notFound();
  }

  // Validate stage against template stages or default stages
  // Check both name and displayName for robustness
  let validStages: string[] = [];
  let normalizedStage = stage; // The internal stage name to use
  if (candidate.templateId) {
    const templateStagesData = await safeQuery(() =>
      db
        .select()
        .from(templateStages)
        .where(eq(templateStages.templateId, candidate.templateId!))
    );
    // Build list of valid stage identifiers (both name and displayName)
    validStages = templateStagesData.flatMap(s => [s.name, s.displayName]);
    // Find matching stage and normalize to internal name
    const matchingStage = templateStagesData.find(s => s.name === stage || s.displayName === stage);
    if (matchingStage) {
      normalizedStage = matchingStage.name;
    }
    console.log("[Stage Page Debug]", {
      candidateId: id,
      templateId: candidate.templateId,
      urlStage: stage,
      normalizedStage,
      urlStageEncoded: encodeURIComponent(stage),
      validStages,
      candidatePipelineStage: candidate.pipelineStage,
      stageInValid: validStages.includes(stage),
    });
  } else {
    validStages = [...PIPELINE_STAGES];
  }

  if (!validStages.includes(stage)) {
    console.log("[Stage Page] 404 - stage not found in validStages");
    notFound();
  }

  // Use normalizedStage for subsequent queries
  const stageForQueries = normalizedStage;

  // Get prompts for this stage from template
  let stagePromptsData: StagePrompt[] = [];
  let templateStageData: { displayName: string; description: string | null } | null = null;

  if (candidate.templateId) {
    // Find the stage in the template that matches the current stage name
    // Use normalizedStage which has been mapped to the internal name
    const templateStage = await safeQuery(() =>
      db
        .select()
        .from(templateStages)
        .where(
          and(
            eq(templateStages.templateId, candidate.templateId!),
            eq(templateStages.name, stageForQueries)
          )
        )
    );

    if (templateStage.length > 0) {
      templateStageData = {
        displayName: templateStage[0].displayName,
        description: templateStage[0].description,
      };

      // Get prompts for this stage
      stagePromptsData = await safeQuery(() =>
        db
          .select()
          .from(stagePrompts)
          .where(eq(stagePrompts.stageId, templateStage[0].id))
          .orderBy(asc(stagePrompts.orderIndex))
      );
    }
  }

  // Get stage navigation from template or use default
  let stagesList: { name: string; displayName: string }[] = [];
  if (candidate.templateId) {
    const allTemplateStages = await safeQuery(() =>
      db
        .select()
        .from(templateStages)
        .where(eq(templateStages.templateId, candidate.templateId!))
        .orderBy(asc(templateStages.orderIndex))
    );
    stagesList = allTemplateStages.map((s) => ({ name: s.name, displayName: s.displayName }));
  } else {
    // Fall back to default stages
    stagesList = PIPELINE_STAGES.map((s) => ({ name: s, displayName: STAGE_LABELS[s] || s }));
  }

  // Get attachments for this stage (with safe query for new columns)
  const stageAttachments = await safeQuery<Attachment>(() =>
    db
      .select()
      .from(attachments)
      .where(
        and(
          eq(attachments.candidateId, id),
          eq(attachments.pipelineStage, stage)
        )
      )
      .orderBy(desc(attachments.createdAt))
  );

  // Get ALL attachments for the candidate (for file selection in AI analysis)
  const allAttachments = await safeQuery<Attachment>(() =>
    db
      .select()
      .from(attachments)
      .where(eq(attachments.candidateId, id))
      .orderBy(desc(attachments.createdAt))
  );

  // Get interview sessions for this stage (with safe query for new table)
  const stageSessions = await safeQuery<InterviewSession>(() =>
    db
      .select()
      .from(interviewSessions)
      .where(
        and(
          eq(interviewSessions.candidateId, id),
          eq(interviewSessions.pipelineStage, stage)
        )
      )
      .orderBy(desc(interviewSessions.scheduledAt))
  );

  // Use template stages or default stages for navigation
  const currentStageIndex = stagesList.findIndex((s) => s.name === stage);
  const prevStage = currentStageIndex > 0 ? stagesList[currentStageIndex - 1] : null;
  const nextStage = currentStageIndex < stagesList.length - 1 ? stagesList[currentStageIndex + 1] : null;

  const isCurrentStage = candidate.pipelineStage === stage;
  const candidateStageIndex = stagesList.findIndex((s) => s.name === candidate.pipelineStage);
  const isPastStage = candidateStageIndex > currentStageIndex;

  // Get display name and description from template or defaults
  const stageDisplayName = templateStageData?.displayName || STAGE_LABELS[stage] || stage;
  const stageDescription = templateStageData?.description || STAGE_DESCRIPTIONS[stage] || "";

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
                  {stageDisplayName}
                </h1>
                {isCurrentStage && (
                  <Badge variant="default" className="bg-blue-500">当前阶段</Badge>
                )}
                {isPastStage && (
                  <Badge variant="secondary">已完成</Badge>
                )}
              </div>
              {stageDescription && (
                <p className="text-zinc-600 dark:text-zinc-400">
                  {stageDescription}
                </p>
              )}
              <p className="text-sm text-zinc-500 mt-2">
                候选人: <span className="font-medium text-zinc-700 dark:text-zinc-300">{candidate.name}</span>
              </p>
            </div>
          </div>

          {/* Generate Summary */}
          <div className="mt-4">
            <GenerateSummaryButton
              candidateId={id}
              stage={stage}
              stageLabel={STAGE_LABELS[stage]}
            />
          </div>

          {/* Stage Navigation */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            {prevStage ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/candidates/${id}/stages/${prevStage.name}`}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {prevStage.displayName}
                </Link>
              </Button>
            ) : (
              <div />
            )}
            {nextStage && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/candidates/${id}/stages/${nextStage.name}`}>
                  {nextStage.displayName}
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
          attachmentTypes={ATTACHMENT_TYPES}
        />
      </Section>

      {/* AI Analysis Section */}
      {stagePromptsData.length > 0 && (
        <Section title="AI 分析" className="mb-6">
          <AIAnalysisSection
            candidateId={id}
            candidateName={candidate.name}
            stage={stage}
            prompts={stagePromptsData}
            existingAttachments={stageAttachments}
            allAttachments={allAttachments}
            stagesList={stagesList}
          />
        </Section>
      )}

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
