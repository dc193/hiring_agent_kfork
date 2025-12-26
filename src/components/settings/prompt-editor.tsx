"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Save, X, FileText } from "lucide-react";

interface PromptData {
  name: string;
  instructions: string;
  referenceContent?: string;
}

interface PromptEditorProps {
  prompt?: PromptData;
  onSave: (prompt: PromptData) => void;
  onCancel: () => void;
}

export function PromptEditor({ prompt, onSave, onCancel }: PromptEditorProps) {
  const [name, setName] = useState(prompt?.name || "");
  const [instructions, setInstructions] = useState(prompt?.instructions || "");
  const [referenceContent, setReferenceContent] = useState(prompt?.referenceContent || "");

  const handleSave = () => {
    if (!name.trim()) {
      alert("请输入 Prompt 名称");
      return;
    }
    if (!instructions.trim()) {
      alert("请输入 Instructions");
      return;
    }

    onSave({ name, instructions, referenceContent: referenceContent.trim() || undefined });
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

      {/* Reference Content (Template-level reference materials) */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          <FileText className="w-4 h-4 inline mr-1" />
          参考资料（可选）
        </label>
        <p className="text-xs text-zinc-500 mb-3">
          在这里粘贴模板级别的参考资料内容（如评分标准、问题库、规范文档等）。这些内容会在执行 AI 分析时作为固定参考传递给 AI，适用于所有候选人。
        </p>
        <textarea
          value={referenceContent}
          onChange={(e) => setReferenceContent(e.target.value)}
          placeholder={`例如：

=== 评分标准 ===
- 5分：优秀，超出预期
- 4分：良好，符合预期
- 3分：一般，基本达标
- 2分：欠佳，需要提升
- 1分：不合格

=== 面试问题标准 ===
1. 技术问题应该涵盖...
2. 行为问题应该探索...`}
          rows={10}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
        <p className="text-xs text-zinc-400 mt-1">
          提示：可以直接复制粘贴 .md 或 .txt 文件的内容
        </p>
      </div>

      {/* Info about execution-time file selection */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
          💡 关于候选人材料的选择
        </h4>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          候选人的具体材料（简历、面试附件等）会在<strong>执行 AI 分析时</strong>选择，而不是在这里配置。
          当你在候选人页面点击"执行"按钮时，会弹出文件选择器让你选择要分析的候选人材料。
        </p>
      </div>
    </div>
  );
}
