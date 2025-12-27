"use client";

import { useState } from "react";
import { Save, Loader2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STAGE_LABELS: Record<string, string> = {
  resume_review: "简历筛选",
  phone_screen: "电话面试",
  homework: "作业",
  team_interview: "Team 面试",
  consultant_review: "外部顾问",
  final_interview: "终面",
  offer: "Offer",
};

const DEFAULT_PROMPT = `你是一位资深的招聘专家。请基于以下候选人在招聘流程中收集的所有材料，生成一份阶段性综合评估报告。

## 评估要求

1. **材料概述**
   - 列出收到的所有材料类型
   - 标注材料的完整性

2. **能力评估**
   - 技术能力分析
   - 软技能观察
   - 与岗位的匹配度

3. **关键发现**
   - 亮点和优势
   - 需要关注的问题
   - 待验证的疑点

4. **阶段结论**
   - 当前阶段的综合评价
   - 是否推荐进入下一阶段
   - 下一阶段需要重点关注的问题

请用 Markdown 格式输出，语言使用中文。

---

候选人: {candidate_name}
当前阶段: {current_stage}
材料内容:

{materials}
`;

interface StageConfig {
  stage: string;
  stageSummaryPrompt?: string | null;
}

interface StageSummaryConfigProps {
  stages: StageConfig[];
}

export function StageSummaryConfig({ stages }: StageSummaryConfigProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    stages.forEach((s) => {
      initial[s.stage] = s.stageSummaryPrompt || "";
    });
    return initial;
  });
  const [savingStage, setSavingStage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ stage: string; type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (stage: string) => {
    setSavingStage(stage);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/settings/stage-configs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          stageSummaryPrompt: prompts[stage] || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveMessage({ stage, type: "success", text: "保存成功！" });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ stage, type: "error", text: "保存失败" });
      }
    } catch (error) {
      console.error("Failed to save:", error);
      setSaveMessage({ stage, type: "error", text: "保存失败" });
    } finally {
      setSavingStage(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">变量说明</h4>
        <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
          <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{"{candidate_name}"}</code> - 候选人姓名</li>
          <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{"{current_stage}"}</code> - 当前阶段名称</li>
          <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{"{materials}"}</code> - 收集的所有材料内容</li>
        </ul>
      </div>

      {stages.map((stageConfig) => {
        const isExpanded = expandedStage === stageConfig.stage;
        const hasPrompt = !!prompts[stageConfig.stage];

        return (
          <Card key={stageConfig.stage} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              onClick={() => setExpandedStage(isExpanded ? null : stageConfig.stage)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-zinc-500" />
                  <CardTitle className="text-base">
                    {STAGE_LABELS[stageConfig.stage] || stageConfig.stage}
                  </CardTitle>
                  <Badge variant={hasPrompt ? "default" : "secondary"}>
                    {hasPrompt ? "已配置" : "使用默认"}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-500" />
                )}
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0 border-t border-zinc-100 dark:border-zinc-800">
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      阶段总结 Prompt
                    </label>
                    <textarea
                      value={prompts[stageConfig.stage]}
                      onChange={(e) =>
                        setPrompts((prev) => ({
                          ...prev,
                          [stageConfig.stage]: e.target.value,
                        }))
                      }
                      rows={12}
                      placeholder={DEFAULT_PROMPT}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      留空则使用默认 Prompt
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPrompts((prev) => ({
                          ...prev,
                          [stageConfig.stage]: "",
                        }))
                      }
                    >
                      清空（使用默认）
                    </Button>

                    <div className="flex items-center gap-3">
                      {saveMessage?.stage === stageConfig.stage && (
                        <span
                          className={`text-sm ${
                            saveMessage.type === "success"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {saveMessage.text}
                        </span>
                      )}
                      <Button
                        onClick={() => handleSave(stageConfig.stage)}
                        disabled={savingStage === stageConfig.stage}
                        size="sm"
                      >
                        {savingStage === stageConfig.stage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            保存中...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            保存
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
