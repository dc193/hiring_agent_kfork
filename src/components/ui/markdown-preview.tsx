"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, FileText, Loader2 } from "lucide-react";
import { Button } from "./button";

interface MarkdownPreviewProps {
  url: string;
  fileName: string;
  initialExpanded?: boolean;
  maxPreviewLines?: number;
}

export function MarkdownPreview({
  url,
  fileName,
  initialExpanded = false,
  maxPreviewLines = 10,
}: MarkdownPreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [error, setError] = useState<string | null>(null);

  // Fetch content when expanded or on mount if initialExpanded
  useEffect(() => {
    if (isExpanded && content === null && !isLoading) {
      setIsLoading(true);
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.text();
        })
        .then((text) => {
          setContent(text);
          setError(null);
        })
        .catch(() => {
          setError("无法加载文件内容");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isExpanded, content, url, isLoading]);

  const lines = content?.split("\n") || [];
  const isLongContent = lines.length > maxPreviewLines;
  const displayContent = isLongContent && !isExpanded
    ? lines.slice(0, maxPreviewLines).join("\n") + "\n..."
    : content;

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-600 dark:text-zinc-400">
            {isExpanded ? "收起预览" : "展开预览"}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-zinc-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              加载中...
            </div>
          )}
          {error && (
            <div className="text-sm text-red-500 py-2">{error}</div>
          )}
          {content !== null && !isLoading && (
            <div className="relative">
              <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg overflow-x-auto font-mono">
                {displayContent}
              </pre>
              {isLongContent && (
                <div className="mt-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle between showing all and preview
                      setIsExpanded(true);
                    }}
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 text-xs"
                    >
                      在新标签页查看完整内容 ({lines.length} 行)
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
