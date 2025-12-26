"use client";

import { useState } from "react";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import { Play, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { StagePrompt, ContextSource } from "@/db";

interface AIAnalysisSectionProps {
  candidateId: string;
  candidateName: string;
  stage: string;
  prompts: StagePrompt[];
  onAnalysisComplete?: () => void;
}

const CONTEXT_SOURCE_LABELS: Record<ContextSource, string> = {
  resume: "简历",
  profile: "Profile",
  preference: "Preference",
  stage_attachments: "当前阶段附件",
  history_attachments: "历史附件",
  history_reports: "历史AI报告",
  interview_notes: "面试记录",
};

export function AIAnalysisSection({
  candidateId,
  candidateName,
  stage,
  prompts,
  onAnalysisComplete,
}: AIAnalysisSectionProps) {
  const [executingPromptId, setExecutingPromptId] = useState<string | null>(null);
  const [completedPrompts, setCompletedPrompts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async (promptId: string) => {
    setExecutingPromptId(promptId);
    setError(null);

    try {
      const response = await fetch(`/api/candidates/${candidateId}/execute-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, stage }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "执行失败");
      }

      setCompletedPrompts((prev) => new Set([...prev, promptId]));
      onAnalysisComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "执行失败");
    } finally {
      setExecutingPromptId(null);
    }
  };

  if (prompts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
          AI 分析
        </h3>
        <p className="text-sm text-zinc-500 mb-4">
          点击执行按钮，AI 将根据配置的上下文材料进行分析，生成的报告会自动保存到阶段材料中。
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}

        <div className="space-y-3">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {prompt.name}
                    </h4>
                    {completedPrompts.has(prompt.id) && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {prompt.contextSources && prompt.contextSources.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-zinc-500">上下文：</span>
                      {prompt.contextSources.map((source) => (
                        <Badge key={source} variant="secondary" className="text-xs">
                          {CONTEXT_SOURCE_LABELS[source]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExecute(prompt.id)}
                  disabled={executingPromptId !== null}
                >
                  {executingPromptId === prompt.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      执行中...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      执行
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
                {prompt.instructions.slice(0, 100)}...
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                输出文件：{prompt.name}_{candidateName}.md
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
