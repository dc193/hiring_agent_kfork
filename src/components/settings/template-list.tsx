"use client";

import { useState } from "react";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, AlertTriangle, X } from "lucide-react";
import { TemplateEditor } from "./template-editor";
import type { PipelineTemplate, TemplateStage, StagePrompt, ContextSource } from "@/db/schema";

interface StageWithPrompts {
  id?: string;
  name: string;
  displayName: string;
  description?: string | null;
  orderIndex: number;
  prompts: {
    id?: string;
    name: string;
    instructions: string;
    contextSources?: ContextSource[] | null;
    orderIndex?: number;
  }[];
}

interface TemplateData {
  id?: string;
  name: string;
  description?: string | null;
  isDefault?: string | null;
  stages: StageWithPrompts[];
}

// Full template type from API includes timestamps
interface TemplateWithDetails extends TemplateData {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TemplateListProps {
  initialTemplates: TemplateWithDetails[];
}

export function TemplateList({ initialTemplates }: TemplateListProps) {
  const [templates, setTemplates] = useState<TemplateWithDetails[]>(initialTemplates);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithDetails | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedTemplates);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTemplates(newExpanded);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/templates/${deletingTemplate.id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates(templates.filter((t) => t.id !== deletingTemplate.id));
        setDeletingTemplate(null);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (template: TemplateData) => {
    try {
      if (template.id) {
        // Update existing
        const res = await fetch(`/api/templates/${template.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(template),
        });
        if (res.ok) {
          // Refetch to get full data
          const updatedRes = await fetch(`/api/templates/${template.id}`);
          const updated = await updatedRes.json();
          setTemplates(templates.map((t) => (t.id === template.id ? updated : t)));
        }
      } else {
        // Create new
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(template),
        });
        if (res.ok) {
          const created = await res.json();
          // Refetch to get full data with stages
          const fullRes = await fetch(`/api/templates/${created.id}`);
          const full = await fullRes.json();
          setTemplates([...templates, full]);
        }
      }
    } catch (error) {
      console.error("Save failed:", error);
    }

    setEditingTemplate(null);
    setIsCreating(false);
  };

  if (isCreating || editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate || undefined}
        onSave={handleSave}
        onCancel={() => {
          setEditingTemplate(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {templates.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p className="mb-4">还没有创建任何流程模板</p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            创建第一个模板
          </Button>
        </div>
      ) : (
        <>
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 cursor-pointer flex-1"
                    onClick={() => toggleExpand(template.id)}
                  >
                    {expandedTemplates.has(template.id) ? (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    )}
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {template.name}
                    </h3>
                    <Badge variant="secondary">
                      {template.stages.length} 个阶段
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingTemplate(template)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {template.description && (
                  <p className="text-sm text-zinc-500 mt-2 ml-6">
                    {template.description}
                  </p>
                )}

                {expandedTemplates.has(template.id) && (
                  <div className="mt-4 ml-6 space-y-3">
                    {template.stages.map((stage, idx) => (
                      <div
                        key={stage.id}
                        className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400 font-mono">
                            {idx + 1}.
                          </span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {stage.displayName}
                          </span>
                          {stage.prompts.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {stage.prompts.length} 个 Prompt
                            </Badge>
                          )}
                        </div>
                        {stage.description && (
                          <p className="text-xs text-zinc-500 mt-1 ml-5">
                            {stage.description}
                          </p>
                        )}
                        {stage.prompts.length > 0 && (
                          <div className="mt-2 ml-5 space-y-1">
                            {stage.prompts.map((prompt) => (
                              <div
                                key={prompt.id}
                                className="text-xs text-zinc-600 dark:text-zinc-400"
                              >
                                <span>📝 {prompt.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button onClick={() => setIsCreating(true)} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            新建模板
          </Button>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-lg font-semibold">确认删除</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDeletingTemplate(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-zinc-600 dark:text-zinc-400">
                确定要删除模板 <span className="font-semibold text-zinc-900 dark:text-zinc-100">{deletingTemplate.name}</span> 吗？
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>注意：</strong>删除模板后，使用此模板的候选人将失去模板关联，附件的阶段信息将显示警告。
                </p>
              </div>
              <p className="text-sm text-zinc-500">
                此模板包含 {deletingTemplate.stages.length} 个阶段
                {deletingTemplate.stages.reduce((sum, s) => sum + s.prompts.length, 0) > 0 && (
                  <> 和 {deletingTemplate.stages.reduce((sum, s) => sum + s.prompts.length, 0)} 个 Prompt</>
                )}
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setDeletingTemplate(null)} disabled={isDeleting}>
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
