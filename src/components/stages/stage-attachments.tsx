"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Music,
  Video,
  File,
  Trash2,
  Download,
  X,
  Loader2,
  Sparkles,
  MessageSquare,
  Send,
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

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
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

// Infer file type from mime type
function inferFileType(mimeType: string): string {
  if (mimeType.startsWith("audio/") || mimeType.startsWith("video/")) return "recording";
  if (mimeType === "application/pdf") return "resume";
  if (mimeType.startsWith("text/")) return "note";
  return "other";
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Check if a type supports text input
const TEXT_INPUT_TYPES = ["note", "transcript", "评审意见", "转录文本", "面试笔记"];

export function StageAttachments({
  candidateId,
  stage,
  initialAttachments,
  attachmentTypes,
}: StageAttachmentsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedType, setSelectedType] = useState(attachmentTypes[0]?.value || "other");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingAttachments, setProcessingAttachments] = useState<Set<string>>(new Set());
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textNoteContent, setTextNoteContent] = useState("");
  const [textNoteTitle, setTextNoteTitle] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Check if selected type supports text input
  const supportsTextInput = TEXT_INPUT_TYPES.includes(selectedType) ||
    attachmentTypes.some(t => t.value === selectedType && TEXT_INPUT_TYPES.includes(t.label));

  // Poll for processing job status
  const pollProcessingStatus = useCallback(async (attachmentId: string) => {
    const maxAttempts = 60;
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
            setProcessingAttachments((prev) => {
              const next = new Set(prev);
              next.delete(attachmentId);
              return next;
            });

            if (hasCompleted) {
              setProcessingMessage("AI分析完成！正在刷新附件列表...");
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
          setTimeout(poll, 5000);
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
  }, [router]);

  // Upload a single file
  const uploadFile = useCallback(async (file: File, fileType: string): Promise<Attachment | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", fileType);

    try {
      const response = await fetch(
        `/api/candidates/${candidateId}/stages/${stage}/attachments`,
        { method: "POST", body: formData }
      );

      const result = await response.json();

      if (result.success) {
        // Check if processing jobs were created
        if (result.processingJobs && result.processingJobs.length > 0) {
          setProcessingAttachments((prev) => new Set([...prev, result.data.id]));
          pollProcessingStatus(result.data.id);
        }
        return result.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [candidateId, stage, pollProcessingStatus]);

  // Handle multiple files upload
  const handleFilesUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Create uploading file entries
    const newUploadingFiles: UploadingFile[] = fileArray.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: "pending" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // Show processing message for batch upload
    if (fileArray.length > 1) {
      setProcessingMessage(`正在上传 ${fileArray.length} 个文件...`);
    }

    // Upload files sequentially
    const uploadedAttachments: Attachment[] = [];

    for (let i = 0; i < newUploadingFiles.length; i++) {
      const uploadingFile = newUploadingFiles[i];
      const file = uploadingFile.file;

      // Update status to uploading
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === uploadingFile.id ? { ...f, status: "uploading" as const, progress: 50 } : f
        )
      );

      // Infer file type or use selected type
      const fileType = selectedType === "other" ? inferFileType(file.type) : selectedType;
      const result = await uploadFile(file, fileType);

      if (result) {
        uploadedAttachments.push(result);
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id ? { ...f, status: "done" as const, progress: 100 } : f
          )
        );
      } else {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? { ...f, status: "error" as const, error: "上传失败" }
              : f
          )
        );
      }
    }

    // Add uploaded attachments to list
    if (uploadedAttachments.length > 0) {
      setAttachments((prev) => [...uploadedAttachments.reverse(), ...prev]);
    }

    // Clear completed uploads after delay
    setTimeout(() => {
      setUploadingFiles((prev) => prev.filter((f) => f.status !== "done"));
      if (fileArray.length > 1) {
        setProcessingMessage(
          uploadedAttachments.length === fileArray.length
            ? `成功上传 ${uploadedAttachments.length} 个文件`
            : `上传完成: ${uploadedAttachments.length}/${fileArray.length} 成功`
        );
        setTimeout(() => setProcessingMessage(null), 3000);
      }
    }, 1500);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [selectedType, uploadFile]);

  // Handle file input change
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
  }, [handleFilesUpload]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
  }, [handleFilesUpload]);

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

  // Submit text note
  const handleSubmitTextNote = useCallback(async () => {
    if (!textNoteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      const response = await fetch(
        `/api/candidates/${candidateId}/stages/${stage}/attachments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: textNoteContent,
            title: textNoteTitle || undefined,
            type: selectedType,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setAttachments((prev) => [result.data, ...prev]);
        setTextNoteContent("");
        setTextNoteTitle("");
        setShowTextInput(false);
        setProcessingMessage("评审意见已保存");
        setTimeout(() => setProcessingMessage(null), 2000);
      } else {
        setProcessingMessage("保存失败: " + (result.error || "未知错误"));
        setTimeout(() => setProcessingMessage(null), 3000);
      }
    } catch (error) {
      console.error("Failed to submit text note:", error);
      setProcessingMessage("保存失败，请重试");
      setTimeout(() => setProcessingMessage(null), 3000);
    } finally {
      setIsSubmittingNote(false);
    }
  }, [candidateId, stage, selectedType, textNoteContent, textNoteTitle]);

  const isUploading = uploadingFiles.some((f) => f.status === "uploading" || f.status === "pending");

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Type selector and mode toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setShowTextInput(false);
              }}
              className="px-3 py-1.5 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              {attachmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {supportsTextInput && (
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                <Button
                  variant={!showTextInput ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowTextInput(false)}
                  className="h-7 px-2"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  文件
                </Button>
                <Button
                  variant={showTextInput ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowTextInput(true)}
                  className="h-7 px-2"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  文字
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Text Input Mode */}
        {showTextInput ? (
          <div className="mb-4 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            <input
              type="text"
              placeholder="标题 (可选)"
              value={textNoteTitle}
              onChange={(e) => setTextNoteTitle(e.target.value)}
              className="w-full px-3 py-2 mb-3 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
            <textarea
              placeholder="请输入评审意见..."
              value={textNoteContent}
              onChange={(e) => setTextNoteContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 resize-none"
            />
            <div className="flex justify-end mt-3">
              <Button
                onClick={handleSubmitTextNote}
                disabled={isSubmittingNote || !textNoteContent.trim()}
                size="sm"
              >
                {isSubmittingNote ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    提交评审意见
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Drop Zone for File Upload */
          <div
            className={`relative mb-4 border-2 border-dashed rounded-lg transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="p-6 text-center">
              <Upload
                className={`w-10 h-10 mx-auto mb-3 ${
                  isDragging ? "text-blue-500" : "text-zinc-400"
                }`}
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                {isDragging ? "松开鼠标上传文件" : "拖拽文件到此处，或"}
              </p>

              <div className="flex items-center justify-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    "选择文件"
                  )}
                </Button>
              </div>

              <p className="text-xs text-zinc-500 mt-2">
                支持批量上传多个文件
              </p>
            </div>
          </div>
        )}

        {/* Uploading Files Progress */}
        {uploadingFiles.length > 0 && (
          <div className="mb-4 space-y-2">
            {uploadingFiles.map((uploadingFile) => (
              <div
                key={uploadingFile.id}
                className="flex items-center gap-3 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {uploadingFile.status === "uploading" || uploadingFile.status === "pending" ? (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : uploadingFile.status === "done" ? (
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                    {uploadingFile.file.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatFileSize(uploadingFile.file.size)}
                    {uploadingFile.error && (
                      <span className="text-red-500 ml-2">{uploadingFile.error}</span>
                    )}
                  </p>
                </div>
                {(uploadingFile.status === "uploading" || uploadingFile.status === "pending") && (
                  <div className="w-20 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

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
        {attachments.length === 0 && uploadingFiles.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <File className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>暂无附件</p>
            <p className="text-sm">拖拽文件到上方区域或点击选择文件</p>
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
