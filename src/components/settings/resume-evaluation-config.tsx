"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEFAULT_PROMPT = `你是一位资深的招聘专家。请基于以下候选人简历信息，生成一份全面的评估报告。

## 评估维度

1. **基本情况分析**
   - 教育背景评估
   - 工作经验年限和连贯性
   - 技能匹配度

2. **能力画像**
   - 核心技术能力
   - 软技能评估
   - 学习能力和成长潜力

3. **风险评估**
   - 稳定性分析
   - 潜在顾虑点
   - 需要面试验证的问题

4. **综合建议**
   - 是否推荐进入下一轮
   - 建议的面试重点
   - 适合的岗位方向

请用 Markdown 格式输出，语言使用中文。

---

候选人信息：
{resume_data}
`;

interface ResumeEvaluationConfigProps {
  initialPrompt?: string | null;
}

export function ResumeEvaluationConfig({ initialPrompt }: ResumeEvaluationConfigProps) {
  const [prompt, setPrompt] = useState(initialPrompt || DEFAULT_PROMPT);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/settings/global", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "resume_evaluation_prompt",
          value: prompt,
          description: "上传简历后自动生成评估报告使用的 Prompt",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveMessage("保存成功！");
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage("保存失败: " + (result.error || "未知错误"));
      }
    } catch (error) {
      console.error("Failed to save:", error);
      setSaveMessage("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT);
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">简历评估 Prompt</CardTitle>
              <p className="text-sm text-zinc-500 mt-1">
                上传简历后，自动使用此 Prompt 生成评估报告
              </p>
            </div>
          </div>
          <Badge variant={prompt ? "default" : "secondary"}>
            {prompt ? "已配置" : "未配置"}
          </Badge>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>变量说明：</strong>使用 <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">{"{resume_data}"}</code> 表示解析后的简历数据（JSON 格式）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                评估 Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={15}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入评估 Prompt..."
              />
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleReset}>
                重置为默认
              </Button>

              <div className="flex items-center gap-3">
                {saveMessage && (
                  <span className={`text-sm ${saveMessage.includes("成功") ? "text-green-600" : "text-red-600"}`}>
                    {saveMessage}
                  </span>
                )}
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      保存配置
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
}
