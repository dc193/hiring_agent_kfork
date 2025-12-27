import { db, pipelineTemplates, templateStages, stagePrompts } from "@/db";
import { PageLayout, Section, Card, CardContent } from "@/components/ui";
import { Settings as SettingsIcon } from "lucide-react";
import { TemplateList } from "@/components/settings/template-list";
import { eq, asc } from "drizzle-orm";

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

export default async function SettingsPage() {
  // Get all templates
  const templates = await safeQuery(() =>
    db.select().from(pipelineTemplates).orderBy(asc(pipelineTemplates.createdAt))
  );

  // Get stages and prompts for each template
  const templatesWithDetails = await Promise.all(
    templates.map(async (template) => {
      const stages = await safeQuery(() =>
        db
          .select()
          .from(templateStages)
          .where(eq(templateStages.templateId, template.id))
          .orderBy(asc(templateStages.orderIndex))
      );

      const stagesWithPrompts = await Promise.all(
        stages.map(async (stage) => {
          const prompts = await safeQuery(() =>
            db
              .select()
              .from(stagePrompts)
              .where(eq(stagePrompts.stageId, stage.id))
              .orderBy(asc(stagePrompts.orderIndex))
          );

          return { ...stage, prompts };
        })
      );

      return { ...template, stages: stagesWithPrompts };
    })
  );

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
            管理招聘流程模板，配置各阶段的 AI 分析 Prompt
          </p>
        </div>
      </div>

      {/* Pipeline Templates */}
      <Section title="流程模板管理" className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-500 mb-6">
              创建自定义的招聘流程模板。每个模板可以有不同的阶段，每个阶段可以配置多个 AI 分析 Prompt。
              上传候选人简历时可以选择使用哪个模板。
            </p>
            <TemplateList initialTemplates={templatesWithDetails} />
          </CardContent>
        </Card>
      </Section>
    </PageLayout>
  );
}
