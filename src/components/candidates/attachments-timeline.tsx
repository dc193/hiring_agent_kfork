"use client";

import { FileText, File, Music, Video, Image, Download, Eye, Bot } from "lucide-react";
import { Button, Badge } from "@/components/ui";

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
  sourcePromptId: string | null;
  createdAt: Date;
}

interface AttachmentsTimelineProps {
  attachments: Attachment[];
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

export function AttachmentsTimeline({ attachments }: AttachmentsTimelineProps) {
  if (attachments.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-500 text-sm">
        暂无附件
      </div>
    );
  }

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
    <div className="space-y-4">
      {Object.entries(groupedByDate).map(([date, dayAttachments]) => (
        <div key={date}>
          <div className="text-xs font-medium text-zinc-500 mb-2">{date}</div>
          <div className="space-y-2">
            {dayAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
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
                    {attachment.pipelineStage && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {attachment.pipelineStage}
                      </Badge>
                    )}
                    {attachment.description && (
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
                    {(attachment.mimeType?.includes("pdf") ||
                      attachment.mimeType?.startsWith("text/") ||
                      attachment.mimeType?.startsWith("image/")) && (
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
                    )}
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
