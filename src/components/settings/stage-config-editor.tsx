"use client";

import { useState } from "react";
import { Button, Badge } from "@/components/ui";
import { Plus, Trash2, Save, X } from "lucide-react";
import { ProcessingRuleEditor } from "./processing-rule-editor";

interface ProcessingRule {
  fileType: string;
  autoTranscribe: boolean;
  autoAnalyze: boolean;
  analysisPrompt: string;
  outputType: string;
  outputTemplate?: string;
}

interface StageConfig {
  id?: string;
  stage: string;
  displayName: string;
  description?: string | null;
  isActive: string;
  processingRules: ProcessingRule[];
  defaultAnalysisPrompt?: string | null;
  evaluationDimensions: Array<{
    name: string;
    weight: number;
    description?: string;
  }>;
  recommendedQuestionCategories: string[];
}

interface StageConfigEditorProps {
  config: StageConfig;
  onSave: (config: StageConfig) => void;
  onCancel: () => void;
}

export function StageConfigEditor({
  config,
  onSave,
  onCancel,
}: StageConfigEditorProps) {
  const [editedConfig, setEditedConfig] = useState<StageConfig>({
    ...config,
    processingRules: config.processingRules || [],
  });
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/stage-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedConfig),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      const saved = await response.json();
      onSave(saved);
    } catch (error) {
      console.error("Error saving config:", error);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRule = (rule: ProcessingRule) => {
    setEditedConfig((prev) => ({
      ...prev,
      processingRules: [...prev.processingRules, rule],
    }));
    setIsAddingRule(false);
  };

  const handleUpdateRule = (index: number, rule: ProcessingRule) => {
    setEditedConfig((prev) => ({
      ...prev,
      processingRules: prev.processingRules.map((r, i) =>
        i === index ? rule : r
      ),
    }));
    setEditingRuleIndex(null);
  };

  const handleDeleteRule = (index: number) => {
    setEditedConfig((prev) => ({
      ...prev,
      processingRules: prev.processingRules.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            显示名称
          </label>
          <input
            type="text"
            value={editedConfig.displayName}
            onChange={(e) =>
              setEditedConfig((prev) => ({
                ...prev,
                displayName: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            状态
          </label>
          <select
            value={editedConfig.isActive}
            onChange={(e) =>
              setEditedConfig((prev) => ({
                ...prev,
                isActive: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">启用</option>
            <option value="false">禁用</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          描述
        </label>
        <textarea
          value={editedConfig.description || ""}
          onChange={(e) =>
            setEditedConfig((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Processing Rules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            自动处理规则
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingRule(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            添加规则
          </Button>
        </div>

        {isAddingRule && (
          <div className="mb-4 p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <ProcessingRuleEditor
              onSave={handleAddRule}
              onCancel={() => setIsAddingRule(false)}
            />
          </div>
        )}

        {editedConfig.processingRules.length > 0 ? (
          <div className="space-y-2">
            {editedConfig.processingRules.map((rule, index) => (
              <div
                key={index}
                className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              >
                {editingRuleIndex === index ? (
                  <ProcessingRuleEditor
                    rule={rule}
                    onSave={(updated) => handleUpdateRule(index, updated)}
                    onCancel={() => setEditingRuleIndex(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {rule.fileType}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {rule.autoTranscribe && (
                          <Badge variant="outline" className="text-xs">
                            转录
                          </Badge>
                        )}
                        {rule.autoAnalyze && (
                          <Badge variant="outline" className="text-xs">
                            AI分析
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          → {rule.outputType}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRuleIndex(index)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-center">
            暂无处理规则，点击"添加规则"开始配置
          </p>
        )}
      </div>

      {/* Default Analysis Prompt */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          默认分析 Prompt
        </label>
        <textarea
          value={editedConfig.defaultAnalysisPrompt || ""}
          onChange={(e) =>
            setEditedConfig((prev) => ({
              ...prev,
              defaultAnalysisPrompt: e.target.value,
            }))
          }
          rows={4}
          placeholder="输入用于AI分析的默认Prompt..."
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
        <p className="text-xs text-zinc-500 mt-1">
          此Prompt将用于该阶段所有文件的AI分析。可使用 {"{candidate_name}"}, {"{file_name}"}, {"{stage}"} 等变量。
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          <X className="w-4 h-4 mr-1" />
          取消
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1" />
          {saving ? "保存中..." : "保存配置"}
        </Button>
      </div>
    </div>
  );
}
