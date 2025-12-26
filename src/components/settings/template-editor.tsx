"use client";

import { useState } from "react";
import { Button, Card, CardContent } from "@/components/ui";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Save, X } from "lucide-react";
import { PromptEditor } from "./prompt-editor";
import type { PipelineTemplate, TemplateStage, StagePrompt, ContextSource } from "@/db";

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

interface TemplateEditorProps {
  template?: TemplateData;
  onSave: (template: TemplateData) => void;
  onCancel: () => void;
}

const EMPTY_STAGE: StageWithPrompts = {
  name: "",
  displayName: "",
  description: "",
  orderIndex: 0,
  prompts: [],
};

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [stages, setStages] = useState<StageWithPrompts[]>(
    template?.stages || []
  );
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set([0]));
  const [editingPrompt, setEditingPrompt] = useState<{
    stageIndex: number;
    promptIndex: number | null;
  } | null>(null);

  const toggleStageExpand = (index: number) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedStages(newExpanded);
  };

  const addStage = () => {
    setStages([
      ...stages,
      { ...EMPTY_STAGE, orderIndex: stages.length },
    ]);
    setExpandedStages(new Set([...expandedStages, stages.length]));
  };

  const removeStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const updateStage = (index: number, field: string, value: string) => {
    setStages(
      stages.map((stage, i) =>
        i === index ? { ...stage, [field]: value } : stage
      )
    );
  };

  const addPrompt = (stageIndex: number) => {
    setEditingPrompt({ stageIndex, promptIndex: null });
  };

  const editPrompt = (stageIndex: number, promptIndex: number) => {
    setEditingPrompt({ stageIndex, promptIndex });
  };

  const removePrompt = (stageIndex: number, promptIndex: number) => {
    setStages(
      stages.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              prompts: stage.prompts.filter((_, j) => j !== promptIndex),
            }
          : stage
      )
    );
  };

  const handlePromptSave = (prompt: {
    name: string;
    instructions: string;
    contextSources: ContextSource[];
  }) => {
    if (!editingPrompt) return;

    const { stageIndex, promptIndex } = editingPrompt;

    setStages(
      stages.map((stage, i) => {
        if (i !== stageIndex) return stage;

        if (promptIndex === null) {
          // Adding new prompt
          return {
            ...stage,
            prompts: [...stage.prompts, { ...prompt, orderIndex: stage.prompts.length }],
          };
        } else {
          // Editing existing prompt
          return {
            ...stage,
            prompts: stage.prompts.map((p, j) =>
              j === promptIndex ? { ...p, ...prompt } : p
            ),
          };
        }
      })
    );

    setEditingPrompt(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("请输入模板名称");
      return;
    }

    if (stages.length === 0) {
      alert("请至少添加一个阶段");
      return;
    }

    for (const stage of stages) {
      if (!stage.displayName.trim()) {
        alert("请填写所有阶段的名称");
        return;
      }
    }

    onSave({
      id: template?.id || "",
      name,
      description,
      isDefault: template?.isDefault || "false",
      stages: stages.map((s, i) => ({ ...s, orderIndex: i })),
    });
  };

  if (editingPrompt) {
    const stage = stages[editingPrompt.stageIndex];
    const existingPrompt = editingPrompt.promptIndex !== null
      ? stage.prompts[editingPrompt.promptIndex]
      : undefined;

    // Ensure contextSources is always an array
    const promptForEditor = existingPrompt
      ? {
          name: existingPrompt.name,
          instructions: existingPrompt.instructions,
          contextSources: existingPrompt.contextSources || [],
        }
      : undefined;

    return (
      <PromptEditor
        prompt={promptForEditor}
        onSave={handlePromptSave}
        onCancel={() => setEditingPrompt(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {template ? "编辑模板" : "新建模板"}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" />
            取消
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            保存模板
          </Button>
        </div>
      </div>

      {/* Template Info */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              模板名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：开发岗位、运营岗位"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              模板描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述这个模板的用途..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stages */}
      <div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
          流程阶段
        </h3>

        <div className="space-y-3">
          {stages.map((stage, stageIndex) => (
            <Card key={stageIndex}>
              <CardContent className="pt-4">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => toggleStageExpand(stageIndex)}
                >
                  <GripVertical className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-400 font-mono w-6">
                    {stageIndex + 1}.
                  </span>
                  {expandedStages.has(stageIndex) ? (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  )}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 flex-1">
                    {stage.displayName || "(未命名阶段)"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStage(stageIndex);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                {expandedStages.has(stageIndex) && (
                  <div className="mt-4 ml-10 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        阶段名称 *
                      </label>
                      <input
                        type="text"
                        value={stage.displayName}
                        onChange={(e) => {
                          // 同时更新 name 和 displayName，name 用于内部标识
                          updateStage(stageIndex, "displayName", e.target.value);
                          updateStage(stageIndex, "name", e.target.value);
                        }}
                        placeholder="例如：简历筛选、电话面试、终面"
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        阶段描述
                      </label>
                      <input
                        type="text"
                        value={stage.description || ""}
                        onChange={(e) =>
                          updateStage(stageIndex, "description", e.target.value)
                        }
                        placeholder="描述这个阶段的目的..."
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Prompts */}
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Prompt 配置
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addPrompt(stageIndex)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          添加 Prompt
                        </Button>
                      </div>

                      {stage.prompts.length === 0 ? (
                        <p className="text-sm text-zinc-400 text-center py-4">
                          暂无 Prompt，点击上方按钮添加
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {stage.prompts.map((prompt, promptIndex) => (
                            <div
                              key={promptIndex}
                              className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                            >
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => editPrompt(stageIndex, promptIndex)}
                              >
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                  {prompt.name}
                                </span>
                                {prompt.contextSources && prompt.contextSources.length > 0 && (
                                  <span className="text-xs text-zinc-400 ml-2">
                                    (上下文: {prompt.contextSources.length} 项)
                                  </span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePrompt(stageIndex, promptIndex)}
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addStage} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            添加阶段
          </Button>
        </div>
      </div>
    </div>
  );
}
