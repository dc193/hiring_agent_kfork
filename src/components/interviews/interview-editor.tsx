"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  MessageSquare,
  Star,
  CheckCircle,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui";
import {
  InterviewSession,
  SessionQuestion,
  InterviewEvaluation,
  QUESTION_CATEGORIES,
  INTERVIEW_SESSION_STATUSES,
  INTERVIEW_TYPES,
} from "@/db/schema";

interface InterviewEditorProps {
  interviewId: string;
  initialSession: InterviewSession;
  initialQuestions: SessionQuestion[];
  initialEvaluations: InterviewEvaluation[];
}

const CATEGORY_LABELS: Record<string, string> = {
  technical: "技术",
  behavioral: "行为",
  situational: "情景",
  motivational: "动机",
  cultural_fit: "文化匹配",
  case_study: "案例分析",
  general: "通用",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "已安排",
  in_progress: "进行中",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未出席",
};

const TYPE_LABELS: Record<string, string> = {
  phone_screen: "电话面试",
  video: "视频面试",
  in_person: "现场面试",
  panel: "群面",
  technical: "技术面试",
  behavioral: "行为面试",
  case_study: "案例分析",
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  strong_yes: "强烈推荐",
  yes: "推荐",
  maybe: "待定",
  no: "不推荐",
  strong_no: "强烈不推荐",
};

const RECOMMENDATION_COLORS: Record<string, string> = {
  strong_yes: "text-green-600 dark:text-green-400",
  yes: "text-green-500 dark:text-green-500",
  maybe: "text-yellow-600 dark:text-yellow-400",
  no: "text-red-500 dark:text-red-500",
  strong_no: "text-red-600 dark:text-red-400",
};

export function InterviewEditor({
  interviewId,
  initialSession,
  initialQuestions,
  initialEvaluations,
}: InterviewEditorProps) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [questions, setQuestions] = useState(initialQuestions);
  const [evaluations, setEvaluations] = useState(initialEvaluations);

  const [isEditingSession, setIsEditingSession] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Session edit form
  const [sessionForm, setSessionForm] = useState({
    status: session.status,
    interviewType: session.interviewType,
    duration: session.duration || "",
  });

  // Question form
  const [questionForm, setQuestionForm] = useState({
    questionText: "",
    category: "general",
    answerText: "",
    answerNotes: "",
    score: 3,
    scoreNotes: "",
  });

  // Evaluation form
  const [evaluationForm, setEvaluationForm] = useState({
    evaluatorName: "",
    evaluatorRole: "",
    technicalScore: 3,
    communicationScore: 3,
    problemSolvingScore: 3,
    culturalFitScore: 3,
    overallScore: 3,
    strengths: "",
    concerns: "",
    detailedFeedback: "",
    recommendation: "maybe",
    proceedToNext: "pending",
  });

  // Update session status
  const handleUpdateSession = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: sessionForm.status,
          interviewType: sessionForm.interviewType,
          duration: sessionForm.duration ? Number(sessionForm.duration) : null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSession(result.data);
        setIsEditingSession(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete interview
  const handleDeleteInterview = async () => {
    if (!confirm("确定要删除这个面试吗？所有问答记录和评估都会被删除。")) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/interviews");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete interview:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add question
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/interviews/${interviewId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...questionForm,
          orderIndex: questions.length + 1,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setQuestions([...questions, result.data]);
        setQuestionForm({
          questionText: "",
          category: "general",
          answerText: "",
          answerNotes: "",
          score: 3,
          scoreNotes: "",
        });
        setShowQuestionForm(false);
      }
    } catch (error) {
      console.error("Failed to add question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update question
  const handleUpdateQuestion = async (questionId: string) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/interviews/${interviewId}/questions/${questionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionForm),
      });

      if (response.ok) {
        const result = await response.json();
        setQuestions(questions.map(q => q.id === questionId ? result.data : q));
        setEditingQuestionId(null);
        setQuestionForm({
          questionText: "",
          category: "general",
          answerText: "",
          answerNotes: "",
          score: 3,
          scoreNotes: "",
        });
      }
    } catch (error) {
      console.error("Failed to update question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("确定要删除这个问题吗？")) return;

    setDeletingId(questionId);
    try {
      const response = await fetch(`/api/interviews/${interviewId}/questions/${questionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== questionId));
      }
    } catch (error) {
      console.error("Failed to delete question:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // Add evaluation
  const handleAddEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/interviews/${interviewId}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...evaluationForm,
          strengths: evaluationForm.strengths.split("\n").filter(Boolean),
          concerns: evaluationForm.concerns.split("\n").filter(Boolean),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setEvaluations([...evaluations, result.data]);
        setEvaluationForm({
          evaluatorName: "",
          evaluatorRole: "",
          technicalScore: 3,
          communicationScore: 3,
          problemSolvingScore: 3,
          culturalFitScore: 3,
          overallScore: 3,
          strengths: "",
          concerns: "",
          detailedFeedback: "",
          recommendation: "maybe",
          proceedToNext: "pending",
        });
        setShowEvaluationForm(false);
      }
    } catch (error) {
      console.error("Failed to add evaluation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete evaluation
  const handleDeleteEvaluation = async (evaluationId: string) => {
    if (!confirm("确定要删除这个评估吗？")) return;

    setDeletingId(evaluationId);
    try {
      const response = await fetch(`/api/interviews/${interviewId}/evaluations/${evaluationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEvaluations(evaluations.filter(e => e.id !== evaluationId));
      }
    } catch (error) {
      console.error("Failed to delete evaluation:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const renderScoreStars = (score: number | null) => {
    if (!score) return null;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i <= score ? "fill-yellow-400 text-yellow-400" : "text-zinc-300 dark:text-zinc-600"}`}
          />
        ))}
      </div>
    );
  };

  const startEditQuestion = (question: SessionQuestion) => {
    setEditingQuestionId(question.id);
    setQuestionForm({
      questionText: question.questionText,
      category: question.category || "general",
      answerText: question.answerText || "",
      answerNotes: question.answerNotes || "",
      score: question.score || 3,
      scoreNotes: question.scoreNotes || "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Session Controls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            面试设置
          </CardTitle>
          <div className="flex gap-2">
            {!isEditingSession ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditingSession(true)}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteInterview}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  删除面试
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={handleUpdateSession} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  保存
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditingSession(false)}>
                  <X className="w-4 h-4 mr-1" />
                  取消
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        {isEditingSession && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">状态</label>
                <select
                  value={sessionForm.status}
                  onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                >
                  {INTERVIEW_SESSION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">面试类型</label>
                <select
                  value={sessionForm.interviewType}
                  onChange={(e) => setSessionForm({ ...sessionForm, interviewType: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                >
                  {INTERVIEW_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">时长（分钟）</label>
                <input
                  type="number"
                  value={sessionForm.duration}
                  onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })}
                  placeholder="例如：60"
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Questions Section */}
      <Section title="面试问答">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              问题记录 ({questions.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowQuestionForm(!showQuestionForm)}>
              <Plus className="w-4 h-4 mr-1" />
              添加问答
            </Button>
          </CardHeader>
          <CardContent>
            {/* Add Question Form */}
            {showQuestionForm && (
              <form onSubmit={handleAddQuestion} className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium mb-1">问题 *</label>
                    <textarea
                      value={questionForm.questionText}
                      onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-16"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">分类</label>
                    <select
                      value={questionForm.category}
                      onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                    >
                      {QUESTION_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">候选人回答</label>
                  <textarea
                    value={questionForm.answerText}
                    onChange={(e) => setQuestionForm({ ...questionForm, answerText: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-20"
                    placeholder="记录候选人的回答..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">面试官笔记</label>
                    <textarea
                      value={questionForm.answerNotes}
                      onChange={(e) => setQuestionForm({ ...questionForm, answerNotes: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-16"
                      placeholder="你对回答的观察..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">评分 (1-5): {questionForm.score}</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={questionForm.score}
                      onChange={(e) => setQuestionForm({ ...questionForm, score: Number(e.target.value) })}
                      className="w-full mt-2"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "添加中..." : "添加问答"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowQuestionForm(false)}>
                    取消
                  </Button>
                </div>
              </form>
            )}

            {/* Questions List */}
            {questions.length === 0 ? (
              <p className="text-zinc-500 text-sm py-4 text-center">暂无问答记录</p>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    {editingQuestionId === q.id ? (
                      /* Edit Form */
                      <div className="space-y-3">
                        <textarea
                          value={questionForm.questionText}
                          onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                          className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                        />
                        <textarea
                          value={questionForm.answerText}
                          onChange={(e) => setQuestionForm({ ...questionForm, answerText: e.target.value })}
                          placeholder="候选人回答..."
                          className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                        />
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">评分:</span>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              value={questionForm.score}
                              onChange={(e) => setQuestionForm({ ...questionForm, score: Number(e.target.value) })}
                              className="w-24"
                            />
                            <span className="text-sm font-medium">{questionForm.score}</span>
                          </div>
                          <div className="flex gap-2 ml-auto">
                            <Button size="sm" onClick={() => handleUpdateQuestion(q.id)} disabled={isSubmitting}>
                              保存
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingQuestionId(null)}>
                              取消
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Display */
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-500">Q{idx + 1}</span>
                            {q.category && (
                              <Badge variant="secondary">{CATEGORY_LABELS[q.category] || q.category}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {q.score && renderScoreStars(q.score)}
                            <Button variant="ghost" size="sm" onClick={() => startEditQuestion(q)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(q.id)}
                              disabled={deletingId === q.id}
                              className="text-red-600"
                            >
                              {deletingId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <p className="text-zinc-900 dark:text-zinc-100 font-medium mb-2">{q.questionText}</p>
                        {q.answerText && (
                          <div className="mt-3 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{q.answerText}</p>
                          </div>
                        )}
                        {q.answerNotes && (
                          <div className="mt-2 text-xs text-zinc-500 italic">笔记: {q.answerNotes}</div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Section>

      {/* Evaluations Section */}
      <Section title="面试评估">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              评估记录 ({evaluations.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowEvaluationForm(!showEvaluationForm)}>
              <Plus className="w-4 h-4 mr-1" />
              添加评估
            </Button>
          </CardHeader>
          <CardContent>
            {/* Add Evaluation Form */}
            {showEvaluationForm && (
              <form onSubmit={handleAddEvaluation} className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">评估人姓名 *</label>
                    <input
                      type="text"
                      value={evaluationForm.evaluatorName}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, evaluatorName: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">职位</label>
                    <input
                      type="text"
                      value={evaluationForm.evaluatorRole}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, evaluatorRole: e.target.value })}
                      placeholder="例如：技术总监"
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { key: "technicalScore", label: "技术能力" },
                    { key: "communicationScore", label: "沟通能力" },
                    { key: "problemSolvingScore", label: "解决问题" },
                    { key: "culturalFitScore", label: "文化匹配" },
                    { key: "overallScore", label: "综合评分" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium mb-1">{label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={evaluationForm[key as keyof typeof evaluationForm] as number}
                          onChange={(e) => setEvaluationForm({ ...evaluationForm, [key]: Number(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-sm font-bold w-4">{evaluationForm[key as keyof typeof evaluationForm]}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">优点（每行一条）</label>
                    <textarea
                      value={evaluationForm.strengths}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, strengths: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-20"
                      placeholder="沟通能力强&#10;技术扎实&#10;..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">顾虑（每行一条）</label>
                    <textarea
                      value={evaluationForm.concerns}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, concerns: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-20"
                      placeholder="经验不足&#10;..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">详细反馈</label>
                  <textarea
                    value={evaluationForm.detailedFeedback}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, detailedFeedback: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-24"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">推荐意见</label>
                    <select
                      value={evaluationForm.recommendation}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, recommendation: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                    >
                      <option value="strong_yes">强烈推荐</option>
                      <option value="yes">推荐</option>
                      <option value="maybe">待定</option>
                      <option value="no">不推荐</option>
                      <option value="strong_no">强烈不推荐</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">是否进入下一轮？</label>
                    <select
                      value={evaluationForm.proceedToNext}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, proceedToNext: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                    >
                      <option value="pending">待定</option>
                      <option value="yes">是</option>
                      <option value="no">否</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "添加中..." : "添加评估"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowEvaluationForm(false)}>
                    取消
                  </Button>
                </div>
              </form>
            )}

            {/* Evaluations List */}
            {evaluations.length === 0 ? (
              <p className="text-zinc-500 text-sm py-4 text-center">暂无评估记录</p>
            ) : (
              <div className="space-y-4">
                {evaluations.map((ev) => (
                  <div key={ev.id} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{ev.evaluatorName}</h4>
                        {ev.evaluatorRole && <p className="text-sm text-zinc-500">{ev.evaluatorRole}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.recommendation && (
                          <span className={`font-medium ${RECOMMENDATION_COLORS[ev.recommendation] || ""}`}>
                            {RECOMMENDATION_LABELS[ev.recommendation] || ev.recommendation}
                          </span>
                        )}
                        {ev.proceedToNext === "yes" && <ThumbsUp className="w-5 h-5 text-green-500" />}
                        {ev.proceedToNext === "no" && <ThumbsDown className="w-5 h-5 text-red-500" />}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvaluation(ev.id)}
                          disabled={deletingId === ev.id}
                          className="text-red-600"
                        >
                          {deletingId === ev.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {[
                        { score: ev.technicalScore, label: "技术" },
                        { score: ev.communicationScore, label: "沟通" },
                        { score: ev.problemSolvingScore, label: "解决问题" },
                        { score: ev.culturalFitScore, label: "文化" },
                        { score: ev.overallScore, label: "综合" },
                      ].map(({ score, label }) => (
                        score && (
                          <div key={label} className="text-center">
                            <p className="text-xs text-zinc-500 mb-1">{label}</p>
                            <div className="flex justify-center">{renderScoreStars(score)}</div>
                          </div>
                        )
                      ))}
                    </div>

                    {((ev.strengths as string[]) || []).length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> 优点
                        </p>
                        <ul className="list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400">
                          {(ev.strengths as string[]).map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}

                    {((ev.concerns as string[]) || []).length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> 顾虑
                        </p>
                        <ul className="list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400">
                          {(ev.concerns as string[]).map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}

                    {ev.detailedFeedback && (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        {ev.detailedFeedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
