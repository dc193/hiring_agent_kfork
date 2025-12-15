"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Music,
  Video,
  File,
  Trash2,
  Download,
  Plus,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Attachment } from "@/db/schema";

interface StageAttachmentsProps {
  candidateId: string;
  stage: string;
  initialAttachments: Attachment[];
  attachmentTypes: Array<{ value: string; label: string }>;
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  resume: FileText,
  recording: Music,
  transcript: FileText,
  homework: FileText,
  note: FileText,
  offer_letter: FileText,
  contract: FileText,
  video: Video,
  other: File,
};

const TYPE_COLORS: Record<string, string> = {
  resume: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  recording: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  transcript: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  homework: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  note: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  offer_letter: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  contract: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  other: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StageAttachments({
  candidateId,
  stage,
  initialAttachments,
  attachmentTypes,
}: StageAttachmentsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedType, setSelectedType] = useState(attachmentTypes[0]?.value || "other");
  const [description, setDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingAttachments, setProcessingAttachments] = useState<Set<string>>(new Set());
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);

  // Poll for processing job status
  const pollProcessingStatus = async (attachmentId: string) => {
    const maxAttempts = 60; // Poll for up to 5 minutes
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/processing/jobs?attachmentId=${attachmentId}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
          const jobs = result.data;
          const pendingOrProcessing = jobs.some(
            (j: { job: { status: string } }) =>
              j.job.status === "pending" || j.job.status === "processing"
          );
          const hasCompleted = jobs.some(
            (j: { job: { status: string } }) => j.job.status === "completed"
          );
          const hasFailed = jobs.some(
            (j: { job: { status: string } }) => j.job.status === "failed"
          );

          if (!pendingOrProcessing) {
            // Processing complete
            setProcessingAttachments((prev) => {
              const next = new Set(prev);
              next.delete(attachmentId);
              return next;
            });

            if (hasCompleted) {
              setProcessingMessage("AI分析完成！正在刷新附件列表...");
              // Refresh attachments list
              setTimeout(() => {
                router.refresh();
                setProcessingMessage(null);
              }, 1500);
            } else if (hasFailed) {
              setProcessingMessage("处理失败，请检查处理任务详情");
              setTimeout(() => setProcessingMessage(null), 3000);
            }
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setProcessingAttachments((prev) => {
            const next = new Set(prev);
            next.delete(attachmentId);
            return next;
          });
        }
      } catch (error) {
        console.error("Error polling processing status:", error);
      }
    };

    poll();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", selectedType);
      formData.append("description", description);

      const response = await fetch(
        `/api/candidates/${candidateId}/stages/${stage}/attachments`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        setAttachments([result.data, ...attachments]);
        setShowUploadForm(false);
        setDescription("");
        setSelectedType(attachmentTypes[0]?.value || "other");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Check if processing jobs were created
        if (result.processingJobs && result.processingJobs.length > 0) {
          setProcessingAttachments((prev) => new Set([...prev, result.data.id]));
          setProcessingMessage("文件已上传，正在进行AI分析...");
          pollProcessingStatus(result.data.id);
        }
      } else {
        alert(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("确定要删除这个附件吗？")) return;

    setDeletingId(attachmentId);

    try {
      const response = await fetch(
        `/api/candidates/${candidateId}/stages/${stage}/attachments/${attachmentId}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (result.success) {
        setAttachments(attachments.filter((a) => a.id !== attachmentId));
      } else {
        alert(result.error || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete attachment");
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeLabel = (type: string) => {
    const found = attachmentTypes.find((t) => t.value === type);
    return found?.label || type;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Upload Button */}
        <div className="mb-4">
          {showUploadForm ? (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">上传附件</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploadForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">附件类型</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                  >
                    {attachmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">描述 (可选)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="添加描述..."
                    className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      选择文件并上传
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowUploadForm(true)}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加附件
            </Button>
          )}
        </div>

        {/* Processing Message */}
        {processingMessage && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {processingMessage}
            </span>
          </div>
        )}

        {/* Attachments List */}
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <File className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>暂无附件</p>
            <p className="text-sm">点击上方按钮上传文件</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => {
              const Icon = TYPE_ICONS[attachment.type] || File;
              const isDeleting = deletingId === attachment.id;
              const isProcessing = processingAttachments.has(attachment.id);

              return (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${TYPE_COLORS[attachment.type] || TYPE_COLORS.other}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {attachment.fileName}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(attachment.type)}
                      </Badge>
                      {isProcessing && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                          <Sparkles className="w-3 h-3 animate-pulse" />
                          AI分析中
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      {attachment.fileSize && (
                        <span>{formatFileSize(attachment.fileSize)}</span>
                      )}
                      <span>
                        {new Date(attachment.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                      {attachment.description && (
                        <span className="truncate max-w-[200px]">
                          {attachment.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <a
                        href={attachment.blobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={attachment.fileName}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
