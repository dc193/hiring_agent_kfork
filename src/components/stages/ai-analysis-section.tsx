"use client";

import { useState, useMemo } from "react";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import { Play, Loader2, CheckCircle, AlertCircle, X, FileText, Folder, Check } from "lucide-react";
import type { StagePrompt, ContextSource, Attachment } from "@/db/schema";

interface StageInfo {
  name: string;
  displayName: string;
}

interface AIAnalysisSectionProps {
  candidateId: string;
  candidateName: string;
  stage: string;
  prompts: StagePrompt[];
  existingAttachments?: Attachment[];
  allAttachments?: Attachment[];
  stagesList?: StageInfo[];
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
  existingAttachments = [],
  allAttachments = [],
  stagesList = [],
  onAnalysisComplete,
}: AIAnalysisSectionProps) {
  const [executingPromptId, setExecutingPromptId] = useState<string | null>(null);
  const [newlyCompletedPrompts, setNewlyCompletedPrompts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // File selection modal state
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [pendingPromptId, setPendingPromptId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  // Check which prompts have already been executed by looking at existing attachments
  const executedPromptNames = useMemo(() => {
    const executed = new Set<string>();
    for (const attachment of existingAttachments) {
      if (attachment.description?.includes("AI 生成")) {
        const match = attachment.description.match(/AI 生成 - (.+)/);
        if (match) {
          executed.add(match[1]);
        }
      }
    }
    return executed;
  }, [existingAttachments]);

  // Group attachments by stage (handle null pipelineStage)
  const attachmentsByStage = useMemo(() => {
    const grouped: Record<string, Attachment[]> = {};
    for (const attachment of allAttachments) {
      const stageKey = attachment.pipelineStage || "未分类";
      if (!grouped[stageKey]) {
        grouped[stageKey] = [];
      }
      grouped[stageKey].push(attachment);
    }
    return grouped;
  }, [allAttachments]);

  // Get all unique stage keys from attachments, and map to display names
  const stageGroups = useMemo(() => {
    const groups: { key: string; displayName: string; isCurrent: boolean }[] = [];
    const stageKeys = Object.keys(attachmentsByStage);

    for (const key of stageKeys) {
      // Try to find a matching stage in stagesList for display name
      const matchingStage = stagesList.find(s => s.name === key || s.displayName === key);
      groups.push({
        key,
        displayName: matchingStage?.displayName || key,
        isCurrent: key === stage || matchingStage?.name === stage,
      });
    }

    return groups;
  }, [attachmentsByStage, stagesList, stage]);

  const isPromptCompleted = (prompt: StagePrompt) => {
    return executedPromptNames.has(prompt.name) || newlyCompletedPrompts.has(prompt.id);
  };

  const openFileSelector = (promptId: string) => {
    setPendingPromptId(promptId);
    setSelectedFileIds(new Set());
    setShowFileSelector(true);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const selectAllInStage = (stageName: string) => {
    const stageFiles = attachmentsByStage[stageName] || [];
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      const allSelected = stageFiles.every(f => next.has(f.id));
      if (allSelected) {
        // Deselect all
        stageFiles.forEach(f => next.delete(f.id));
      } else {
        // Select all
        stageFiles.forEach(f => next.add(f.id));
      }
      return next;
    });
  };

  const handleExecute = async (promptId: string, attachmentIds?: string[]) => {
    setShowFileSelector(false);
    setExecutingPromptId(promptId);
    setError(null);

    try {
      const response = await fetch(`/api/candidates/${candidateId}/execute-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId,
          stage,
          selectedAttachmentIds: attachmentIds && attachmentIds.length > 0 ? attachmentIds : undefined
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "执行失败");
      }

      setNewlyCompletedPrompts((prev) => new Set([...prev, promptId]));
      onAnalysisComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "执行失败");
    } finally {
      setExecutingPromptId(null);
      setPendingPromptId(null);
    }
  };

  const executeWithSelection = () => {
    if (pendingPromptId) {
      handleExecute(pendingPromptId, Array.from(selectedFileIds));
    }
  };

  if (prompts.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
            AI 分析
          </h3>
          <p className="text-sm text-zinc-500 mb-4">
            点击执行按钮选择上下文文件，AI 将进行分析，生成的报告会自动保存到阶段材料中。
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
                      {isPromptCompleted(prompt) && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {prompt.contextSources && prompt.contextSources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-zinc-500">默认上下文：</span>
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
                    onClick={() => openFileSelector(prompt.id)}
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

      {/* File Selection Modal */}
      {showFileSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold">选择上下文文件</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowFileSelector(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-zinc-500 mb-4">
                选择要作为 AI 分析上下文的文件。不选择文件将使用默认上下文配置。
              </p>

              {Object.keys(attachmentsByStage).length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>暂无可选文件</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stageGroups.map((group) => {
                    const stageFiles = attachmentsByStage[group.key] || [];
                    if (stageFiles.length === 0) return null;

                    const allSelected = stageFiles.every(f => selectedFileIds.has(f.id));

                    return (
                      <div key={group.key} className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 cursor-pointer"
                          onClick={() => selectAllInStage(group.key)}
                        >
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-zinc-400" />
                            <span className="font-medium text-sm">
                              {group.displayName}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {stageFiles.length}
                            </Badge>
                            {group.isCurrent && (
                              <Badge variant="default" className="text-xs bg-blue-500">
                                当前
                              </Badge>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                            allSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-zinc-300 dark:border-zinc-600"
                          }`}>
                            {allSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {stageFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                              onClick={() => toggleFileSelection(file.id)}
                            >
                              <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                selectedFileIds.has(file.id)
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-zinc-300 dark:border-zinc-600"
                              }`}>
                                {selectedFileIds.has(file.id) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <FileText className="w-4 h-4 text-zinc-400" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                                  {file.fileName}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {file.type} · {new Date(file.createdAt).toLocaleDateString("zh-CN")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <p className="text-sm text-zinc-500">
                已选择 {selectedFileIds.size} 个文件
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFileSelector(false)}
                >
                  取消
                </Button>
                <Button onClick={executeWithSelection}>
                  <Play className="w-4 h-4 mr-1" />
                  开始分析
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
