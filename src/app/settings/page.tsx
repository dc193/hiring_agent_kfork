import { db, pipelineStageConfigs, PIPELINE_STAGES } from "@/db";
import { PageLayout, Section, Card, CardContent } from "@/components/ui";
import { Settings as SettingsIcon } from "lucide-react";
import { StageConfigList } from "@/components/settings/stage-config-list";

// Force dynamic rendering - don't cache this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Safe query helper for tables that may not exist yet
async function safeQuery<T>(queryFn: () => Promise<T[]>, defaultValue: T[] = []): Promise<T[]> {
  try {
    return await queryFn();
  } catch (error) {
    // Check for PostgreSQL error codes
    if (error && typeof error === "object") {
      const err = error as { code?: string; message?: string };
      // 42P01 = undefined_table, 42703 = undefined_column
      if (err.code === "42P01" || err.code === "42703") {
        console.warn("Table or column not found, returning empty array");
        return defaultValue;
      }
      // Also check error message for table not found
      if (err.message?.includes("does not exist") ||
          err.message?.includes("relation") ||
          err.message?.includes("Failed query")) {
        console.warn("Query failed (table may not exist), returning empty array:", err.message);
        return defaultValue;
      }
    }
    throw error;
  }
}

// Default stage configurations
const DEFAULT_STAGE_CONFIGS = PIPELINE_STAGES.map((stage) => ({
  stage,
  displayName: {
    resume_review: "简历筛选",
    phone_screen: "电话面试",
    homework: "作业",
    team_interview: "Team 面试",
    consultant_review: "外部顾问",
    final_interview: "终面",
    offer: "Offer",
  }[stage] || stage,
  description: {
    resume_review: "初步筛选候选人简历，评估基本条件是否符合岗位要求",
    phone_screen: "通过电话/视频初步了解候选人，确认基本信息和意向",
    homework: "分配技术作业或案例分析，评估实际能力",
    team_interview: "与团队成员进行深度技术面试和文化匹配评估",
    consultant_review: "外部顾问或专家对候选人进行独立评估和分析",
    final_interview: "最终决策面试，通常由高层或HR参与",
    offer: "发放录用通知，进行薪资谈判",
  }[stage] || "",
  isActive: "true" as const,
  processingRules: [],
  defaultAnalysisPrompt: null,
  evaluationDimensions: [],
  recommendedQuestionCategories: [],
}));

export default async function SettingsPage() {
  // Get existing stage configurations
  const existingConfigs = await safeQuery(() =>
    db.select().from(pipelineStageConfigs)
  );

  // Debug: log what we got from the database
  console.log("Existing configs from DB:", existingConfigs.length, "items");
  existingConfigs.forEach((c) => {
    console.log(`  - ${c.stage}: ${c.processingRules?.length || 0} rules`);
  });

  // Merge existing configs with defaults, ensuring null arrays are converted to empty arrays
  const stageConfigs = PIPELINE_STAGES.map((stage) => {
    const existing = existingConfigs.find((c) => c.stage === stage);
    if (existing) {
      console.log(`Found existing config for ${stage}, rules:`, existing.processingRules);
      return {
        ...existing,
        processingRules: existing.processingRules || [],
        evaluationDimensions: existing.evaluationDimensions || [],
        recommendedQuestionCategories: existing.recommendedQuestionCategories || [],
      };
    }
    console.log(`No existing config for ${stage}, using default`);
    return DEFAULT_STAGE_CONFIGS.find((c) => c.stage === stage)!;
  });

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <SettingsIcon className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            系统设置
          </h1>
          <p className="text-zinc-500 mt-1">
            配置招聘流程各阶段的自动处理规则
          </p>
        </div>
      </div>

      {/* Pipeline Stage Configurations */}
      <Section title="Pipeline 阶段配置" className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-500 mb-6">
              配置每个阶段的文件处理规则。当上传特定类型的文件时，系统会自动执行转录、AI分析等处理，并生成报告。
            </p>
            <StageConfigList initialConfigs={stageConfigs} />
          </CardContent>
        </Card>
      </Section>
    </PageLayout>
  );
}
