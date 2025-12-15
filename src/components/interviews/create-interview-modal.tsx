"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INTERVIEW_TYPES, PIPELINE_STAGES } from "@/db/schema";

interface Candidate {
  id: string;
  name: string;
  pipelineStage: string;
}

interface CreateInterviewModalProps {
  candidates: Candidate[];
}

const TYPE_LABELS: Record<string, string> = {
  phone_screen: "电话面试",
  video: "视频面试",
  in_person: "现场面试",
  panel: "群面",
  technical: "技术面试",
  behavioral: "行为面试",
  case_study: "案例分析",
};

const STAGE_LABELS: Record<string, string> = {
  resume_review: "简历筛选",
  phone_screen: "电话面试",
  homework: "作业",
  team_interview: "Team 面试",
  final_interview: "终面",
  offer: "Offer",
};

export function CreateInterviewModal({ candidates }: CreateInterviewModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    candidateId: "",
    title: "",
    interviewType: "video",
    pipelineStage: "",
    scheduledAt: "",
    interviewerName: "",
    interviewerRole: "",
    meetingLink: "",
    notes: "",
  });

  const selectedCandidate = candidates.find(c => c.id === formData.candidateId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.candidateId || !formData.title) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: formData.candidateId,
          title: formData.title,
          interviewType: formData.interviewType,
          pipelineStage: formData.pipelineStage || selectedCandidate?.pipelineStage,
          scheduledAt: formData.scheduledAt || null,
          interviewers: formData.interviewerName
            ? [{ name: formData.interviewerName, role: formData.interviewerRole }]
            : [],
          meetingLink: formData.meetingLink || null,
          notes: formData.notes || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsOpen(false);
        setFormData({
          candidateId: "",
          title: "",
          interviewType: "video",
          pipelineStage: "",
          scheduledAt: "",
          interviewerName: "",
          interviewerRole: "",
          meetingLink: "",
          notes: "",
        });
        router.refresh();
        // Navigate to the new interview
        router.push(`/interviews/${result.data.id}`);
      } else {
        alert(result.error || "Failed to create interview");
      }
    } catch (error) {
      console.error("Failed to create interview:", error);
      alert("Failed to create interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        新建面试
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold">新建面试</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Candidate Selection */}
              <div>
                <label className="block text-sm font-medium mb-1">候选人 *</label>
                <select
                  value={formData.candidateId}
                  onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  required
                >
                  <option value="">选择候选人...</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({STAGE_LABELS[c.pipelineStage]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">面试标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：第一轮技术面试"
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Interview Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">面试类型</label>
                  <select
                    value={formData.interviewType}
                    onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  >
                    {INTERVIEW_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pipeline Stage */}
                <div>
                  <label className="block text-sm font-medium mb-1">Pipeline 阶段</label>
                  <select
                    value={formData.pipelineStage}
                    onChange={(e) => setFormData({ ...formData, pipelineStage: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  >
                    <option value="">使用候选人当前阶段</option>
                    {PIPELINE_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {STAGE_LABELS[stage]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium mb-1">安排时间</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Interviewer Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">面试官</label>
                  <input
                    type="text"
                    value={formData.interviewerName}
                    onChange={(e) => setFormData({ ...formData, interviewerName: e.target.value })}
                    placeholder="姓名"
                    className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  />
                </div>

                {/* Interviewer Role */}
                <div>
                  <label className="block text-sm font-medium mb-1">面试官职位</label>
                  <input
                    type="text"
                    value={formData.interviewerRole}
                    onChange={(e) => setFormData({ ...formData, interviewerRole: e.target.value })}
                    placeholder="例如：技术总监"
                    className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  />
                </div>
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-medium mb-1">会议链接</label>
                <input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">备注</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="面试前准备说明..."
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm h-20"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    "创建面试"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  取消
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
