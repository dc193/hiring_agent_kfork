"use client";

import { useState, useCallback, useEffect } from "react";
import { ParsedResume } from "@/types/resume";
import { Button } from "@/components/ui";
import { X } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  stages: { id: string; displayName: string }[];
}

interface ResumeUploaderProps {
  onParsed: (resume: ParsedResume) => void;
}

export default function ResumeUploader({ onParsed }: ResumeUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Load templates when modal opens
  useEffect(() => {
    if (showTemplateModal && templates.length === 0) {
      setLoadingTemplates(true);
      fetch("/api/templates")
        .then((res) => res.json())
        .then((data) => {
          setTemplates(data);
          if (data.length > 0) {
            setSelectedTemplate(data[0].id);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingTemplates(false));
    }
  }, [showTemplateModal, templates.length]);

  const uploadFile = useCallback(async (file: File, templateId: string | null) => {
    setError(null);
    setFileName(file.name);
    setIsLoading(true);
    setShowTemplateModal(false);
    setPendingFile(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (templateId) {
        formData.append("templateId", templateId);
      }

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to parse resume");
      }

      onParsed(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse resume");
    } finally {
      setIsLoading(false);
    }
  }, [onParsed]);

  const handleFile = useCallback(async (file: File) => {
    setPendingFile(file);
    setShowTemplateModal(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-12
          transition-all duration-200 ease-in-out
          ${isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
          }
          ${isLoading ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center text-center">
          {isLoading ? (
            <>
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
                Parsing resume...
              </p>
              {fileName && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  {fileName}
                </p>
              )}
            </>
          ) : (
            <>
              <svg
                className="w-12 h-12 text-zinc-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
                Drop your resume here
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                or click to browse
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-4">
                Supports PDF, DOC, DOCX, TXT
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                选择流程模板
              </h3>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setPendingFile(null);
                }}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-4">
              {pendingFile && (
                <p className="text-sm text-zinc-500 mb-4">
                  文件: <span className="font-medium">{pendingFile.name}</span>
                </p>
              )}

              {loadingTemplates ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">加载模板...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-500 mb-4">还没有创建流程模板</p>
                  <p className="text-sm text-zinc-400">
                    请先在设置页面创建模板，或直接上传（使用默认流程）
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {templates.map((template) => (
                    <label
                      key={template.id}
                      className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTemplate === template.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="template"
                          value={template.id}
                          checked={selectedTemplate === template.id}
                          onChange={() => setSelectedTemplate(template.id)}
                          className="mt-1"
                        />
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {template.name}
                          </span>
                          {template.description && (
                            <p className="text-xs text-zinc-500 mt-1">
                              {template.description}
                            </p>
                          )}
                          <p className="text-xs text-zinc-400 mt-1">
                            {template.stages.length} 个阶段：
                            {template.stages.map((s) => s.displayName).join(" → ")}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-200 dark:border-zinc-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTemplateModal(false);
                  setPendingFile(null);
                }}
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  if (pendingFile) {
                    uploadFile(pendingFile, selectedTemplate);
                  }
                }}
                disabled={templates.length > 0 && !selectedTemplate}
              >
                {templates.length === 0 ? "使用默认流程上传" : "上传"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
