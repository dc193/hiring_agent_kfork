"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui";
import { Save, X, FileText, Upload, Trash2, Loader2, File } from "lucide-react";

interface ReferenceFile {
  id: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  blobUrl: string;
}

// Pending file for new prompts (not yet uploaded)
interface PendingFile {
  id: string; // temporary client-side ID
  file: File;
  fileName: string;
  fileSize: number;
}

interface PromptData {
  id?: string;
  name: string;
  instructions: string;
  referenceContent?: string;
}

interface PromptEditorProps {
  prompt?: PromptData;
  onSave: (prompt: PromptData, pendingFiles?: File[]) => void;
  onCancel: () => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PromptEditor({ prompt, onSave, onCancel }: PromptEditorProps) {
  const [name, setName] = useState(prompt?.name || "");
  const [instructions, setInstructions] = useState(prompt?.instructions || "");
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]); // For new prompts
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const promptId = prompt?.id;
  const isNewPrompt = !promptId;

  // Fetch existing reference files when editing a prompt
  const fetchReferenceFiles = useCallback(async () => {
    if (!promptId) return;

    setIsLoadingFiles(true);
    try {
      const response = await fetch(`/api/prompts/${promptId}/reference-files`);
      const result = await response.json();
      if (result.success) {
        setReferenceFiles(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch reference files:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [promptId]);

  useEffect(() => {
    fetchReferenceFiles();
  }, [fetchReferenceFiles]);

  // Add pending files for new prompts
  const addPendingFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPendingFiles: PendingFile[] = Array.from(files).map((file) => ({
      id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      fileName: file.name,
      fileSize: file.size,
    }));

    setPendingFiles((prev) => [...prev, ...newPendingFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove pending file
  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Upload files for existing prompts
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !promptId) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`/api/prompts/${promptId}/reference-files`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          setReferenceFiles((prev) => [...prev, result.data]);
        }
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle file selection (either pending or immediate upload)
  const handleFileSelect = (files: FileList | null) => {
    if (isNewPrompt) {
      addPendingFiles(files);
    } else {
      handleFileUpload(files);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!promptId) return;

    setDeletingFileId(fileId);
    try {
      const response = await fetch(`/api/prompts/${promptId}/reference-files/${fileId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        setReferenceFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
    } finally {
      setDeletingFileId(null);
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

    // Pass pending files to parent for upload after prompt creation
    const filesToUpload = pendingFiles.length > 0 ? pendingFiles.map((pf) => pf.file) : undefined;
    onSave({ id: promptId, name, instructions }, filesToUpload);
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

      {/* Reference Files */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          <FileText className="w-4 h-4 inline mr-1" />
          参考资料文件
        </label>
        <p className="text-xs text-zinc-500 mb-3">
          上传模板级别的参考资料文件（如评分标准.md、问题库.txt等）。这些文件会在执行 AI 分析时作为固定参考传递给 AI，适用于所有候选人。
        </p>

        {/* Upload area with drag & drop */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center mb-4 transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-zinc-300 dark:border-zinc-700"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            accept=".md,.txt,.json,.csv,.pdf"
          />
          <Upload className={`w-6 h-6 mx-auto mb-2 ${isDragging ? "text-blue-500" : "text-zinc-400"}`} />
          <p className="text-sm text-zinc-500 mb-2">
            拖拽文件到此处，或
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                上传中...
              </>
            ) : (
              "选择文件"
            )}
          </Button>
          <p className="text-xs text-zinc-500 mt-2">
            支持 .md, .txt, .json, .csv, .pdf 格式
          </p>
        </div>

        {/* Pending files for new prompts */}
        {isNewPrompt && pendingFiles.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              以下文件将在保存 Prompt 后自动上传：
            </p>
            {pendingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <File className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate block">
                      {file.fileName}
                    </span>
                    <p className="text-xs text-zinc-500">
                      {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePendingFile(file.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Existing file list for saved prompts */}
        {!isNewPrompt && (
          <>
            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              </div>
            ) : referenceFiles.length === 0 ? (
              <div className="text-center py-4 text-zinc-400 text-sm">
                暂无参考资料文件
              </div>
            ) : (
              <div className="space-y-2">
                {referenceFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <File className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <a
                          href={file.blobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 truncate block"
                        >
                          {file.fileName}
                        </a>
                        <p className="text-xs text-zinc-500">
                          {formatFileSize(file.fileSize)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={deletingFileId === file.id}
                      className="text-red-500 hover:text-red-600"
                    >
                      {deletingFileId === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
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
