"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Save, X } from "lucide-react";

interface ProcessingRule {
  fileType: string;
  autoTranscribe: boolean;
  autoAnalyze: boolean;
  analysisPrompt: string;
  outputType: string;
  outputTemplate?: string;
}

interface ProcessingRuleEditorProps {
  rule?: ProcessingRule;
  onSave: (rule: ProcessingRule) => void;
  onCancel: () => void;
}

const FILE_TYPES = [
  { value: "recording", label: "录音文件 (audio/video)" },
  { value: "transcript", label: "转录文本" },
  { value: "homework", label: "作业文件" },
  { value: "note", label: "备注/笔记" },
  { value: "resume", label: "简历" },
  { value: "other", label: "其他文件" },
];

const OUTPUT_TYPES = [
  { value: "report", label: "分析报告" },
  { value: "note", label: "备注文件" },
  { value: "profile_update", label: "更新候选人画像" },
  { value: "preference_update", label: "更新候选人偏好" },
  { value: "transcript", label: "转录文本" },
  { value: "summary", label: "摘要" },
];

const DEFAULT_PROMPTS: Record<string, string> = {
  recording: `你是一位专业的招聘顾问。请分析以下面试录音转录内容，并提供：
1. 面试摘要（2-3段）
2. 候选人的关键优势（3-5点）
3. 潜在风险或需要注意的地方（如有）
4. 建议的后续问题
5. 综合评估（1-5分）和建议

候选人: {candidate_name}
阶段: {stage}
文件: {file_name}

转录内容:
{content}`,
  homework: `你是一位专业的技术评估专家。请分析以下候选人提交的作业，并提供：
1. 作业质量评估（代码质量、设计思路、完整性）
2. 技术能力评估（使用的技术、实现方式、最佳实践）
3. 亮点（2-3个）
4. 需要改进的地方（如有）
5. 综合评分（1-5分）和评语

候选人: {candidate_name}
阶段: {stage}
文件: {file_name}

作业内容:
{content}`,
  resume: `你是一位专业的招聘顾问。请分析以下简历，并提供：
1. 候选人背景摘要
2. 核心能力和技能
3. 职业发展轨迹分析
4. 潜在的优势和劣势
5. 建议的面试问题
6. 初步匹配度评估

候选人: {candidate_name}
阶段: {stage}

简历内容:
{content}`,
};

export function ProcessingRuleEditor({
  rule,
  onSave,
  onCancel,
}: ProcessingRuleEditorProps) {
  const [editedRule, setEditedRule] = useState<ProcessingRule>(
    rule || {
      fileType: "recording",
      autoTranscribe: true,
      autoAnalyze: true,
      analysisPrompt: DEFAULT_PROMPTS.recording,
      outputType: "report",
    }
  );

  const handleFileTypeChange = (fileType: string) => {
    setEditedRule((prev) => ({
      ...prev,
      fileType,
      autoTranscribe: fileType === "recording",
      analysisPrompt:
        DEFAULT_PROMPTS[fileType] || prev.analysisPrompt,
    }));
  };

  const handleSave = () => {
    if (!editedRule.fileType) {
      alert("请选择文件类型");
      return;
    }
    onSave(editedRule);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* File Type */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            文件类型
          </label>
          <select
            value={editedRule.fileType}
            onChange={(e) => handleFileTypeChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FILE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Output Type */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            输出类型
          </label>
          <select
            value={editedRule.outputType}
            onChange={(e) =>
              setEditedRule((prev) => ({
                ...prev,
                outputType: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {OUTPUT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Auto Actions */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={editedRule.autoTranscribe}
            onChange={(e) =>
              setEditedRule((prev) => ({
                ...prev,
                autoTranscribe: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded border-zinc-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            自动转录（音视频）
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={editedRule.autoAnalyze}
            onChange={(e) =>
              setEditedRule((prev) => ({
                ...prev,
                autoAnalyze: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded border-zinc-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            自动AI分析
          </span>
        </label>
      </div>

      {/* Analysis Prompt */}
      {editedRule.autoAnalyze && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            分析 Prompt
          </label>
          <textarea
            value={editedRule.analysisPrompt}
            onChange={(e) =>
              setEditedRule((prev) => ({
                ...prev,
                analysisPrompt: e.target.value,
              }))
            }
            rows={8}
            placeholder="输入用于AI分析的Prompt..."
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-zinc-500 mt-1">
            可用变量: {"{candidate_name}"}, {"{stage}"}, {"{file_name}"}, {"{content}"}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          取消
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Save className="w-4 h-4 mr-1" />
          保存规则
        </Button>
      </div>
    </div>
  );
}
