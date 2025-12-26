"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Save, X } from "lucide-react";
import { CONTEXT_SOURCES, type ContextSource } from "@/db";

interface PromptData {
  name: string;
  instructions: string;
  contextSources: ContextSource[];
}

interface PromptEditorProps {
  prompt?: PromptData;
  onSave: (prompt: PromptData) => void;
  onCancel: () => void;
}

const CONTEXT_SOURCE_LABELS: Record<ContextSource, { label: string; description: string }> = {
  resume: { label: "简历原文", description: "候选人上传的简历内容" },
  profile: { label: "Profile（候选人画像）", description: "能力、行为模式等结构化数据" },
  preference: { label: "Preference（候选人偏好）", description: "价值观、目标、动机等" },
  stage_attachments: { label: "当前阶段附件", description: "当前阶段上传的所有文件" },
  history_attachments: { label: "历史阶段附件", description: "之前阶段上传的所有文件" },
  history_reports: { label: "历史 AI 报告", description: "之前 AI 生成的分析报告" },
  interview_notes: { label: "面试记录", description: "面试评价、问答记录等" },
};

export function PromptEditor({ prompt, onSave, onCancel }: PromptEditorProps) {
  const [name, setName] = useState(prompt?.name || "");
  const [instructions, setInstructions] = useState(prompt?.instructions || "");
  const [contextSources, setContextSources] = useState<ContextSource[]>(
    prompt?.contextSources || []
  );

  const toggleContextSource = (source: ContextSource) => {
    if (contextSources.includes(source)) {
      setContextSources(contextSources.filter((s) => s !== source));
    } else {
      setContextSources([...contextSources, source]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("请输入 Prompt 名称");
      return;
    }
    if (!instructions.trim()) {
      alert("请输入 Instructions");
      return;
    }

    onSave({ name, instructions, contextSources });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {prompt ? "编辑 Prompt" : "新建 Prompt"}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" />
            取消
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            保存
          </Button>
        </div>
      </div>

      {/* Prompt Name */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Prompt 名称 *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：面试分析、作业评估"
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          这个名称会显示在执行按钮和生成的报告文件名中
        </p>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          📝 Instructions *
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={`请输入 AI 分析的指令...

例如：
你是一位专业的招聘顾问。请根据提供的材料分析这次面试，评估候选人的表现。

请输出：
1. 面试摘要
2. 优势（3-5点）
3. 风险点
4. 综合评估（1-5分）`}
          rows={12}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
      </div>

      {/* Context Sources (Files) */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          📎 Files（上下文来源）
        </label>
        <p className="text-xs text-zinc-500 mb-4">
          选择 AI 分析时可以参考的材料。勾选的材料会作为上下文传递给 AI。
        </p>
        <div className="space-y-2">
          {CONTEXT_SOURCES.map((source) => (
            <label
              key={source}
              className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={contextSources.includes(source)}
                onChange={() => toggleContextSource(source)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-blue-500 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {CONTEXT_SOURCE_LABELS[source].label}
                </span>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {CONTEXT_SOURCE_LABELS[source].description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
