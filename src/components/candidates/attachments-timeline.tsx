"use client";

import { FileText, File, Music, Video, Image, Download, Eye, Bot } from "lucide-react";
import { Button, Badge, Card, CardContent } from "@/components/ui";

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
      <div className="text-center py-8 text-zinc-500">
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
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, dayAttachments]) => (
        <div key={date}>
          <div className="text-sm font-medium text-zinc-500 mb-3">{date}</div>
          <div className="space-y-3">
            {dayAttachments.map((attachment) => (
              <Card key={attachment.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getFileIcon(attachment.mimeType, attachment.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {attachment.fileName}
                        </span>
                        {getTypeBadge(attachment.type)}
                        {attachment.pipelineStage && (
                          <Badge variant="outline" className="text-xs">
                            {attachment.pipelineStage}
                          </Badge>
                        )}
                      </div>
                      {attachment.description && (
                        <p className="text-sm text-zinc-500 mt-1 truncate">
                          {attachment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                        <span>{formatDate(attachment.createdAt)}</span>
                        {attachment.fileSize && (
                          <span>{formatFileSize(attachment.fileSize)}</span>
                        )}
                        {attachment.tags && attachment.tags.length > 0 && (
                          <div className="flex gap-1">
                            {attachment.tags.map((tag, i) => (
                              <span key={i} className="bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(attachment.mimeType?.includes("pdf") ||
                        attachment.mimeType?.startsWith("text/") ||
                        attachment.mimeType?.startsWith("image/")) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={attachment.blobUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={attachment.blobUrl} download={attachment.fileName}>
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
