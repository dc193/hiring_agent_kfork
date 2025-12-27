"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent } from "@/components/ui";
import { FileText, ChevronRight } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  stages: { id: string; name: string; displayName: string }[];
}

interface TemplateSelectorProps {
  candidateId: string;
  candidateName: string;
}

export function TemplateSelector({ candidateId, candidateName }: TemplateSelectorProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load templates:", err);
        setLoading(false);
      });
  }, []);

  const selectTemplate = async (templateId: string) => {
    setSelecting(true);
    try {
      // Get the first stage of the template (use name for internal routing, not displayName)
      const template = templates.find((t) => t.id === templateId);
      const firstStageName = template?.stages[0]?.name || "initial";

      // Update candidate with template and set to first stage
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          pipelineStage: firstStageName,
          updateInitialAttachments: true, // Also update attachments with "initial" stage
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to select template:", error);
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-zinc-500">加载模板中...</p>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
          <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            暂无面试流程模板
          </h3>
          <p className="text-zinc-500 mb-4">
            请先在设置页面创建一个面试流程模板
          </p>
          <Button asChild>
            <a href="/settings">前往设置</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-6">
        <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-4">
          为 {candidateName} 选择面试流程
        </h3>
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => !selecting && selectTemplate(template.id)}
            >
              <div className="flex-1">
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                  {template.name}
                </h4>
                {template.description && (
                  <p className="text-sm text-zinc-500 mt-1">{template.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                  {template.stages.map((stage, i) => (
                    <span key={stage.id} className="flex items-center gap-1">
                      {stage.displayName}
                      {i < template.stages.length - 1 && <ChevronRight className="w-3 h-3" />}
                    </span>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                disabled={selecting}
                onClick={(e) => {
                  e.stopPropagation();
                  selectTemplate(template.id);
                }}
              >
                选择
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
