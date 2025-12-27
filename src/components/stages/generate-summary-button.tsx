"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerateSummaryButtonProps {
  candidateId: string;
  stage: string;
  stageLabel: string;
}

export function GenerateSummaryButton({
  candidateId,
  stage,
  stageLabel,
}: GenerateSummaryButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/candidates/${candidateId}/stages/${stage}/summary`,
        { method: "POST" }
      );

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: "阶段总结已生成！" });
        router.refresh();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error || "生成失败" });
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
      setMessage({ type: "error", text: "生成失败，请重试" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        variant="outline"
        className="gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            正在生成...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            生成{stageLabel}总结
          </>
        )}
      </Button>

      {message && (
        <span
          className={`text-sm ${
            message.type === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
