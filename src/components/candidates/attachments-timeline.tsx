"use client";

import { useState, useEffect } from "react";
import { FileText, File, Music, Video, Image, Download, Eye, Bot, AlertTriangle, Link2, X, ExternalLink, Loader2 } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  blobUrl: string;
  type: string;
  description: string | null;
  tags: string[] | null;
  pipelineStage: string | null;
  stageId: string | null;
  sourcePromptId: string | null;
  promptNameSnapshot: string | null;
  createdAt: Date;
}

interface StageWithPrompts {
  id: string;
  displayName: string;
  prompts: { id: string; name: string }[];
}

interface AttachmentsTimelineProps {
  attachments: Attachment[];
  stagesWithPrompts?: StageWithPrompts[];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getFileIcon(mimeType: string | null, type: string) {
  if (type === "ai_analysis") {
    return <Bot className="w-5 h-5 text-purple-500" />;
  }
  if (mimeType?.startsWith("image/")) {
    return <Image className="w-5 h-5 text-green-500" />;
  }
  if (mimeType?.startsWith("audio/")) {
    return <Music className="w-5 h-5 text-orange-500" />;
  }
  if (mimeType?.startsWith("video/")) {
    return <Video className="w-5 h-5 text-red-500" />;
  }
  if (mimeType?.includes("pdf") || mimeType?.startsWith("text/")) {
    return <FileText className="w-5 h-5 text-blue-500" />;
  }
  return <File className="w-5 h-5 text-zinc-500" />;
}

function getTypeBadge(type: string) {
  const typeLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    resume: { label: "简历", variant: "default" },
    recording: { label: "录音", variant: "secondary" },
    transcript: { label: "转录", variant: "secondary" },
    homework: { label: "作业", variant: "outline" },
    note: { label: "笔记", variant: "outline" },
    ai_analysis: { label: "AI分析", variant: "default" },
    other: { label: "其他", variant: "secondary" },
  };

  const config = typeLabels[type] || typeLabels.other;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Check if an attachment has broken links
function checkBrokenLinks(
  attachment: Attachment,
  stagesWithPrompts: StageWithPrompts[]
): { stageBroken: boolean; promptBroken: boolean } {
  // Only check AI analysis type attachments
  if (attachment.type !== "ai_analysis") {
    return { stageBroken: false, promptBroken: false };
  }

  let stageBroken = false;
  let promptBroken = false;

  // Check stage link
  if (attachment.stageId) {
    const stageExists = stagesWithPrompts.some(s => s.id === attachment.stageId);
    stageBroken = !stageExists;
  }

  // Check prompt link
  if (attachment.sourcePromptId) {
    const promptExists = stagesWithPrompts.some(s =>
      s.prompts.some(p => p.id === attachment.sourcePromptId)
    );
    promptBroken = !promptExists;
  }

  return { stageBroken, promptBroken };
}

// Relink Modal Component
function RelinkModal({
  attachment,
  stagesWithPrompts,
  onClose,
  onRelink,
}: {
  attachment: Attachment;
  stagesWithPrompts: StageWithPrompts[];
  onClose: () => void;
  onRelink: (stageId: string | null, promptId: string | null) => void;
}) {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(attachment.stageId);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(attachment.sourcePromptId);

  const selectedStage = stagesWithPrompts.find(s => s.id === selectedStageId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">重新关联</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-zinc-500 mb-4">
            文件: <span className="font-medium text-zinc-700 dark:text-zinc-300">{attachment.fileName}</span>
            {attachment.promptNameSnapshot && (
              <div className="mt-1">
                原 Prompt: <span className="text-amber-600">{attachment.promptNameSnapshot}</span> (已删除/修改)
              </div>
            )}
          </div>

          {/* Stage selector */}
          <div>
            <label className="block text-sm font-medium mb-1">选择阶段</label>
            <select
              value={selectedStageId || ""}
              onChange={(e) => {
                setSelectedStageId(e.target.value || null);
                setSelectedPromptId(null);
              }}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            >
              <option value="">不关联阶段</option>
              {stagesWithPrompts.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Prompt selector */}
          {selectedStage && selectedStage.prompts.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">选择 Prompt</label>
              <select
                value={selectedPromptId || ""}
                onChange={(e) => setSelectedPromptId(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="">不关联 Prompt</option>
                {selectedStage.prompts.map((prompt) => (
                  <option key={prompt.id} value={prompt.id}>
                    {prompt.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={() => onRelink(selectedStageId, selectedPromptId)}>
            确定
          </Button>
        </div>
      </div>
    </div>
  );
}

// Text/Markdown Preview Modal
function TextPreviewModal({
  attachment,
  onClose,
}: {
  attachment: Attachment;
  onClose: () => void;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMarkdown = attachment.fileName.endsWith(".md") || attachment.mimeType === "text/markdown";

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(attachment.blobUrl);
        if (!response.ok) throw new Error("Failed to fetch file");
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
      } finally {
        setIsLoading(false);
      }
    }
    fetchContent();
  }, [attachment.blobUrl]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold truncate">{attachment.fileName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href={attachment.blobUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : isMarkdown ? (
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <ReactMarkdown>{content || ""}</ReactMarkdown>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm font-mono text-zinc-700 dark:text-zinc-300">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to determine preview type
function getPreviewType(attachment: Attachment): "pdf" | "text" | "image" | null {
  const { mimeType, fileName } = attachment;

  if (mimeType?.includes("pdf")) return "pdf";
  if (mimeType?.startsWith("image/")) return "image";
  if (
    mimeType?.startsWith("text/") ||
    mimeType === "application/json" ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".json") ||
    fileName.endsWith(".csv")
  ) return "text";

  return null;
}

export function AttachmentsTimeline({ attachments, stagesWithPrompts = [] }: AttachmentsTimelineProps) {
  const router = useRouter();
  const [relinkingAttachment, setRelinkingAttachment] = useState<Attachment | null>(null);
  const [previewingAttachment, setPreviewingAttachment] = useState<Attachment | null>(null);
  const [isRelinking, setIsRelinking] = useState(false);

  if (attachments.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-500 text-sm">
        暂无附件
      </div>
    );
  }

  const handleRelink = async (stageId: string | null, promptId: string | null) => {
    if (!relinkingAttachment) return;

    setIsRelinking(true);
    try {
      const response = await fetch(`/api/attachments/${relinkingAttachment.id}/relink`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, promptId }),
      });

      if (response.ok) {
        setRelinkingAttachment(null);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to relink attachment:", error);
    } finally {
      setIsRelinking(false);
    }
  };

  // Group by date
  const groupedByDate: Record<string, Attachment[]> = {};
  for (const att of attachments) {
    const dateKey = new Date(att.createdAt).toLocaleDateString("zh-CN");
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(att);
  }

  return (
    <>
      <div className="space-y-4">
        {Object.entries(groupedByDate).map(([date, dayAttachments]) => (
          <div key={date}>
            <div className="text-xs font-medium text-zinc-500 mb-2">{date}</div>
            <div className="space-y-2">
              {dayAttachments.map((attachment) => {
                const { stageBroken, promptBroken } = checkBrokenLinks(attachment, stagesWithPrompts);
                const hasBrokenLink = stageBroken || promptBroken;

                return (
                  <div
                    key={attachment.id}
                    className={`p-2 rounded-lg border transition-colors ${
                      hasBrokenLink
                        ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getFileIcon(attachment.mimeType, attachment.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]" title={attachment.fileName}>
                            {attachment.fileName}
                          </span>
                          {getTypeBadge(attachment.type)}
                        </div>

                        {/* Stage display with broken link indicator */}
                        {attachment.pipelineStage && (
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {attachment.pipelineStage}
                            </Badge>
                            {stageBroken && (
                              <span className="text-amber-500" title="阶段已被删除或修改">
                                <AlertTriangle className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        )}

                        {/* Broken link warning */}
                        {hasBrokenLink && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              {promptBroken ? "Prompt 已失效" : "阶段已失效"}
                            </span>
                            <button
                              onClick={() => setRelinkingAttachment(attachment)}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 ml-1"
                            >
                              <Link2 className="w-3 h-3" />
                              重新关联
                            </button>
                          </div>
                        )}

                        {attachment.description && !hasBrokenLink && (
                          <p className="text-xs text-zinc-500 mt-1 truncate" title={attachment.description}>
                            {attachment.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
                          <span>{formatDate(attachment.createdAt)}</span>
                          {attachment.fileSize && (
                            <span>{formatFileSize(attachment.fileSize)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {(() => {
                          const previewType = getPreviewType(attachment);
                          if (!previewType) return null;

                          if (previewType === "text") {
                            // Text/Markdown: inline preview modal
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setPreviewingAttachment(attachment)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            );
                          } else {
                            // PDF/Image: open in new tab
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                asChild
                              >
                                <a href={attachment.blobUrl} target="_blank" rel="noopener noreferrer">
                                  <Eye className="w-3.5 h-3.5" />
                                </a>
                              </Button>
                            );
                          }
                        })()}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          asChild
                        >
                          <a href={attachment.blobUrl} download={attachment.fileName}>
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Relink Modal */}
      {relinkingAttachment && (
        <RelinkModal
          attachment={relinkingAttachment}
          stagesWithPrompts={stagesWithPrompts}
          onClose={() => setRelinkingAttachment(null)}
          onRelink={handleRelink}
        />
      )}

      {/* Text Preview Modal */}
      {previewingAttachment && (
        <TextPreviewModal
          attachment={previewingAttachment}
          onClose={() => setPreviewingAttachment(null)}
        />
      )}
    </>
  );
}
