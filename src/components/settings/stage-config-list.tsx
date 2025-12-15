"use client";

import { useState } from "react";
import { PipelineStageConfig } from "@/db";
import { ChevronDown, ChevronUp, FileAudio, FileText, Sparkles, Settings2 } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { StageConfigEditor } from "./stage-config-editor";

interface StageConfig {
  id?: string;
  stage: string;
  displayName: string;
  description?: string | null;
  isActive: string;
  processingRules: Array<{
    fileType: string;
    autoTranscribe: boolean;
    autoAnalyze: boolean;
    analysisPrompt: string;
    outputType: string;
    outputTemplate?: string;
  }>;
  defaultAnalysisPrompt?: string | null;
  evaluationDimensions: Array<{
    name: string;
    weight: number;
    description?: string;
  }>;
  recommendedQuestionCategories: string[];
}

interface StageConfigListProps {
  initialConfigs: StageConfig[];
}

const FILE_TYPE_ICONS: Record<string, typeof FileAudio> = {
  recording: FileAudio,
  transcript: FileText,
  note: FileText,
  homework: FileText,
  resume: FileText,
};

const FILE_TYPE_LABELS: Record<string, string> = {
  recording: "录音文件",
  transcript: "转录文本",
  note: "备注/笔记",
  homework: "作业文件",
  resume: "简历",
  other: "其他文件",
};

export function StageConfigList({ initialConfigs }: StageConfigListProps) {
  const [configs, setConfigs] = useState<StageConfig[]>(initialConfigs);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<string | null>(null);

  const handleConfigUpdate = (stage: string, updatedConfig: StageConfig) => {
    setConfigs((prev) =>
      prev.map((c) => (c.stage === stage ? updatedConfig : c))
    );
    setEditingStage(null);
  };

  const toggleExpand = (stage: string) => {
    setExpandedStage((prev) => (prev === stage ? null : stage));
  };

  return (
    <div className="space-y-3">
      {configs.map((config) => {
        const isExpanded = expandedStage === config.stage;
        const isEditing = editingStage === config.stage;
        const hasRules = config.processingRules && config.processingRules.length > 0;

        return (
          <div
            key={config.stage}
            className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
          >
            {/* Stage Header */}
            <div
              className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => toggleExpand(config.stage)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                    {config.displayName}
                  </h3>
                  <p className="text-sm text-zinc-500 line-clamp-1">
                    {config.description || "暂无描述"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasRules && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {config.processingRules.length} 条规则
                  </Badge>
                )}
                <Badge
                  variant={config.isActive === "true" ? "default" : "outline"}
                >
                  {config.isActive === "true" ? "启用" : "禁用"}
                </Badge>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
                {isEditing ? (
                  <StageConfigEditor
                    config={config}
                    onSave={(updated) => handleConfigUpdate(config.stage, updated)}
                    onCancel={() => setEditingStage(null)}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Processing Rules Summary */}
                    <div>
                      <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        自动处理规则
                      </h4>
                      {hasRules ? (
                        <div className="space-y-2">
                          {config.processingRules.map((rule, index) => {
                            const Icon = FILE_TYPE_ICONS[rule.fileType] || FileText;
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                              >
                                <Icon className="w-4 h-4 text-zinc-500" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {FILE_TYPE_LABELS[rule.fileType] || rule.fileType}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    {rule.autoTranscribe && (
                                      <Badge variant="outline" className="text-xs">
                                        自动转录
                                      </Badge>
                                    )}
                                    {rule.autoAnalyze && (
                                      <Badge variant="outline" className="text-xs">
                                        AI分析
                                      </Badge>
                                    )}
                                    <Badge variant="secondary" className="text-xs">
                                      输出: {rule.outputType}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                          暂未配置自动处理规则。点击"编辑"按钮添加规则。
                        </p>
                      )}
                    </div>

                    {/* Default Analysis Prompt */}
                    {config.defaultAnalysisPrompt && (
                      <div>
                        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          默认分析 Prompt
                        </h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg whitespace-pre-wrap">
                          {config.defaultAnalysisPrompt}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingStage(config.stage)}
                      >
                        编辑配置
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
