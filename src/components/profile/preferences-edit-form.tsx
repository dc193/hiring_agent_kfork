"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ValueRanking {
  value: string;
  rank: number;
}

interface PreferencesData {
  valueRanking: ValueRanking[];
  motivation: {
    intrinsic?: string[];
    extrinsic?: string[];
    balance?: string;
  } | null;
  goals: {
    shortTerm?: string;
    midTerm?: string;
    longTerm?: string;
  } | null;
  riskAttitude: string | null;
  cognitiveStyle: {
    analysisVsIntuition?: string;
    abstractVsConcrete?: string;
    globalVsDetail?: string;
  } | null;
  relationshipStyle: {
    depthVsBreadth?: string;
    competitionVsCooperation?: string;
    leadershipPreference?: string;
  } | null;
  growthStyle: {
    learningStyle?: string;
    feedbackReceptivity?: string;
    failureAttitude?: string;
  } | null;
  boundaries: {
    moralBoundaries?: string;
    professionalPrinciples?: string;
    nonNegotiables?: string[];
    triggers?: string[];
  } | null;
  preferenceSummary: string | null;
}

interface PreferencesEditFormProps {
  candidateId: string;
  initialData: PreferencesData | null;
  onCancel: () => void;
}

const VALUE_OPTIONS = [
  { value: "money", label: "金钱" },
  { value: "freedom", label: "自由" },
  { value: "recognition", label: "认可" },
  { value: "security", label: "安全" },
  { value: "meaning", label: "意义" },
  { value: "relationship", label: "关系" },
  { value: "growth", label: "成长" },
  { value: "power", label: "权力" },
];

const RISK_ATTITUDES = [
  { value: "aggressive", label: "激进" },
  { value: "moderate", label: "稳健" },
  { value: "conservative", label: "保守" },
];

export function PreferencesEditForm({ candidateId, initialData, onCancel }: PreferencesEditFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<PreferencesData>({
    valueRanking: initialData?.valueRanking || [],
    motivation: initialData?.motivation || { intrinsic: [], extrinsic: [] },
    goals: initialData?.goals || {},
    riskAttitude: initialData?.riskAttitude || null,
    cognitiveStyle: initialData?.cognitiveStyle || {},
    relationshipStyle: initialData?.relationshipStyle || {},
    growthStyle: initialData?.growthStyle || {},
    boundaries: initialData?.boundaries || { nonNegotiables: [], triggers: [] },
    preferenceSummary: initialData?.preferenceSummary || null,
  });

  const [newIntrinsic, setNewIntrinsic] = useState("");
  const [newExtrinsic, setNewExtrinsic] = useState("");
  const [newNonNeg, setNewNonNeg] = useState("");
  const [newTrigger, setNewTrigger] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/candidates/${candidateId}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.refresh();
        onCancel();
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addValueRanking = (value: string) => {
    if (!formData.valueRanking.find((v) => v.value === value)) {
      setFormData({
        ...formData,
        valueRanking: [...formData.valueRanking, { value, rank: formData.valueRanking.length + 1 }],
      });
    }
  };

  const removeValueRanking = (value: string) => {
    const newRanking = formData.valueRanking
      .filter((v) => v.value !== value)
      .map((v, i) => ({ ...v, rank: i + 1 }));
    setFormData({ ...formData, valueRanking: newRanking });
  };

  const moveValue = (index: number, direction: "up" | "down") => {
    const newRanking = [...formData.valueRanking];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newRanking.length) {
      [newRanking[index], newRanking[newIndex]] = [newRanking[newIndex], newRanking[index]];
      newRanking.forEach((v, i) => (v.rank = i + 1));
      setFormData({ ...formData, valueRanking: newRanking });
    }
  };

  return (
    <div className="space-y-6">
      {/* Value Ranking */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-500 uppercase">价值排序 (拖拽排序)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.valueRanking.map((item, index) => (
            <div key={item.value} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
              <GripVertical className="w-4 h-4 text-zinc-400" />
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">
                {item.rank}
              </span>
              <span className="flex-1 text-sm">
                {VALUE_OPTIONS.find((v) => v.value === item.value)?.label || item.value}
              </span>
              <Button variant="ghost" size="sm" onClick={() => moveValue(index, "up")} disabled={index === 0}>
                ↑
              </Button>
              <Button variant="ghost" size="sm" onClick={() => moveValue(index, "down")} disabled={index === formData.valueRanking.length - 1}>
                ↓
              </Button>
              <Button variant="ghost" size="sm" onClick={() => removeValueRanking(item.value)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {VALUE_OPTIONS.filter((v) => !formData.valueRanking.find((r) => r.value === v.value)).map((value) => (
              <Button key={value.value} variant="outline" size="sm" onClick={() => addValueRanking(value.value)}>
                <Plus className="w-3 h-3 mr-1" />
                {value.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motivation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-500 uppercase">动机结构</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-2">内驱动因</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.motivation?.intrinsic || []).map((item, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-sm">
                  {item}
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        motivation: {
                          ...formData.motivation,
                          intrinsic: formData.motivation?.intrinsic?.filter((_, idx) => idx !== i),
                        },
                      })
                    }
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="如: 好奇心、掌控感、成长欲"
                value={newIntrinsic}
                onChange={(e) => setNewIntrinsic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newIntrinsic.trim()) {
                    setFormData({
                      ...formData,
                      motivation: {
                        ...formData.motivation,
                        intrinsic: [...(formData.motivation?.intrinsic || []), newIntrinsic.trim()],
                      },
                    });
                    setNewIntrinsic("");
                  }
                }}
                className="flex-1 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newIntrinsic.trim()) {
                    setFormData({
                      ...formData,
                      motivation: {
                        ...formData.motivation,
                        intrinsic: [...(formData.motivation?.intrinsic || []), newIntrinsic.trim()],
                      },
                    });
                    setNewIntrinsic("");
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-500 mb-2">外驱动因</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.motivation?.extrinsic || []).map((item, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-sm">
                  {item}
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        motivation: {
                          ...formData.motivation,
                          extrinsic: formData.motivation?.extrinsic?.filter((_, idx) => idx !== i),
                        },
                      })
                    }
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="如: 物质奖励、社会认可"
                value={newExtrinsic}
                onChange={(e) => setNewExtrinsic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newExtrinsic.trim()) {
                    setFormData({
                      ...formData,
                      motivation: {
                        ...formData.motivation,
                        extrinsic: [...(formData.motivation?.extrinsic || []), newExtrinsic.trim()],
                      },
                    });
                    setNewExtrinsic("");
                  }
                }}
                className="flex-1 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newExtrinsic.trim()) {
                    setFormData({
                      ...formData,
                      motivation: {
                        ...formData.motivation,
                        extrinsic: [...(formData.motivation?.extrinsic || []), newExtrinsic.trim()],
                      },
                    });
                    setNewExtrinsic("");
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-500 uppercase">目标图景</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">短期目标 (1年内)</label>
            <input
              type="text"
              value={formData.goals?.shortTerm || ""}
              onChange={(e) => setFormData({ ...formData, goals: { ...formData.goals, shortTerm: e.target.value } })}
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">中期目标 (3-5年)</label>
            <input
              type="text"
              value={formData.goals?.midTerm || ""}
              onChange={(e) => setFormData({ ...formData, goals: { ...formData.goals, midTerm: e.target.value } })}
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">长期目标 (10年+)</label>
            <input
              type="text"
              value={formData.goals?.longTerm || ""}
              onChange={(e) => setFormData({ ...formData, goals: { ...formData.goals, longTerm: e.target.value } })}
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Risk Attitude */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-500 uppercase">风险态度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {RISK_ATTITUDES.map((attitude) => (
              <Button
                key={attitude.value}
                variant={formData.riskAttitude === attitude.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData({ ...formData, riskAttitude: attitude.value })}
              >
                {attitude.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Boundaries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-500 uppercase">边界与底线</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-2">不可谈判条件</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.boundaries?.nonNegotiables || []).map((item, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded text-sm">
                  {item}
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        boundaries: {
                          ...formData.boundaries,
                          nonNegotiables: formData.boundaries?.nonNegotiables?.filter((_, idx) => idx !== i),
                        },
                      })
                    }
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="添加不可谈判条件"
                value={newNonNeg}
                onChange={(e) => setNewNonNeg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newNonNeg.trim()) {
                    setFormData({
                      ...formData,
                      boundaries: {
                        ...formData.boundaries,
                        nonNegotiables: [...(formData.boundaries?.nonNegotiables || []), newNonNeg.trim()],
                      },
                    });
                    setNewNonNeg("");
                  }
                }}
                className="flex-1 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newNonNeg.trim()) {
                    setFormData({
                      ...formData,
                      boundaries: {
                        ...formData.boundaries,
                        nonNegotiables: [...(formData.boundaries?.nonNegotiables || []), newNonNeg.trim()],
                      },
                    });
                    setNewNonNeg("");
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-500 mb-2">触发负面反应</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.boundaries?.triggers || []).map((item, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded text-sm">
                  {item}
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        boundaries: {
                          ...formData.boundaries,
                          triggers: formData.boundaries?.triggers?.filter((_, idx) => idx !== i),
                        },
                      })
                    }
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="添加触发点"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTrigger.trim()) {
                    setFormData({
                      ...formData,
                      boundaries: {
                        ...formData.boundaries,
                        triggers: [...(formData.boundaries?.triggers || []), newTrigger.trim()],
                      },
                    });
                    setNewTrigger("");
                  }
                }}
                className="flex-1 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newTrigger.trim()) {
                    setFormData({
                      ...formData,
                      boundaries: {
                        ...formData.boundaries,
                        triggers: [...(formData.boundaries?.triggers || []), newTrigger.trim()],
                      },
                    });
                    setNewTrigger("");
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-500 uppercase">AI Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={formData.preferenceSummary || ""}
            onChange={(e) => setFormData({ ...formData, preferenceSummary: e.target.value || null })}
            className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-24"
            placeholder="Preference summary..."
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
