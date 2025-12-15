"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, MessageSquare, Star, CheckCircle, AlertTriangle, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui";
import { SessionQuestion, InterviewEvaluation, QUESTION_CATEGORIES } from "@/db/schema";

interface InterviewDetailClientProps {
  candidateId: string;
  sessionId: string;
  sessionStatus: string;
  initialQuestions: SessionQuestion[];
  initialEvaluations: InterviewEvaluation[];
}

const CATEGORY_LABELS: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  situational: "Situational",
  motivational: "Motivational",
  cultural_fit: "Cultural Fit",
  case_study: "Case Study",
  general: "General",
};

const RECOMMENDATION_COLORS: Record<string, string> = {
  strong_yes: "text-green-600 dark:text-green-400",
  yes: "text-green-500 dark:text-green-500",
  maybe: "text-yellow-600 dark:text-yellow-400",
  no: "text-red-500 dark:text-red-500",
  strong_no: "text-red-600 dark:text-red-400",
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  strong_yes: "Strong Yes",
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
  strong_no: "Strong No",
};

export function InterviewDetailClient({
  candidateId,
  sessionId,
  sessionStatus,
  initialQuestions,
  initialEvaluations,
}: InterviewDetailClientProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [questionForm, setQuestionForm] = useState({
    questionText: "",
    category: "general",
    answerText: "",
    answerNotes: "",
    score: 3,
  });

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
    recommendationNotes: "",
    proceedToNext: "pending",
  });

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/candidates/${candidateId}/interviews/${sessionId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...questionForm,
          orderIndex: questions.length + 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions([...questions, data.data]);
        setQuestionForm({
          questionText: "",
          category: "general",
          answerText: "",
          answerNotes: "",
          score: 3,
        });
        setShowQuestionForm(false);
      }
    } catch (error) {
      console.error("Failed to add question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/candidates/${candidateId}/interviews/${sessionId}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...evaluationForm,
          strengths: evaluationForm.strengths.split("\n").filter(Boolean),
          concerns: evaluationForm.concerns.split("\n").filter(Boolean),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEvaluations([...evaluations, data.data]);
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
          recommendationNotes: "",
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

  const renderScoreStars = (score: number | null) => {
    if (!score) return null;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i <= score ? "fill-yellow-400 text-yellow-400" : "text-zinc-300 dark:text-zinc-600"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Questions Section */}
      <Section title="Interview Questions & Answers">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Questions ({questions.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuestionForm(!showQuestionForm)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Q&A
            </Button>
          </CardHeader>
          <CardContent>
            {showQuestionForm && (
              <form onSubmit={handleAddQuestion} className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium mb-1">Question *</label>
                    <textarea
                      value={questionForm.questionText}
                      onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-16"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
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
                  <label className="block text-sm font-medium mb-1">Candidate&apos;s Answer</label>
                  <textarea
                    value={questionForm.answerText}
                    onChange={(e) => setQuestionForm({ ...questionForm, answerText: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-20"
                    placeholder="Record the candidate's response..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={questionForm.answerNotes}
                      onChange={(e) => setQuestionForm({ ...questionForm, answerNotes: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-16"
                      placeholder="Interviewer notes..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Score (1-5)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={questionForm.score}
                        onChange={(e) => setQuestionForm({ ...questionForm, score: Number(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 w-8 text-center">
                        {questionForm.score}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Question"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowQuestionForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {questions.length === 0 ? (
              <p className="text-zinc-500 text-sm py-4 text-center">No questions recorded yet</p>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-500">Q{idx + 1}</span>
                        {q.category && (
                          <Badge variant="secondary">{CATEGORY_LABELS[q.category] || q.category}</Badge>
                        )}
                      </div>
                      {q.score && renderScoreStars(q.score)}
                    </div>
                    <p className="text-zinc-900 dark:text-zinc-100 font-medium mb-2">{q.questionText}</p>
                    {q.answerText && (
                      <div className="mt-3 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{q.answerText}</p>
                      </div>
                    )}
                    {q.answerNotes && (
                      <div className="mt-2 text-xs text-zinc-500 italic">
                        Notes: {q.answerNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Section>

      {/* Evaluations Section */}
      <Section title="Interview Evaluations">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Evaluations ({evaluations.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEvaluationForm(!showEvaluationForm)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Evaluation
            </Button>
          </CardHeader>
          <CardContent>
            {showEvaluationForm && (
              <form onSubmit={handleAddEvaluation} className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Evaluator Name *</label>
                    <input
                      type="text"
                      value={evaluationForm.evaluatorName}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, evaluatorName: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <input
                      type="text"
                      value={evaluationForm.evaluatorRole}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, evaluatorRole: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                      placeholder="e.g., Engineering Manager"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { key: "technicalScore", label: "Technical" },
                    { key: "communicationScore", label: "Communication" },
                    { key: "problemSolvingScore", label: "Problem Solving" },
                    { key: "culturalFitScore", label: "Cultural Fit" },
                    { key: "overallScore", label: "Overall" },
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
                        <span className="text-sm font-bold w-4">
                          {evaluationForm[key as keyof typeof evaluationForm]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Strengths (one per line)</label>
                    <textarea
                      value={evaluationForm.strengths}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, strengths: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-20"
                      placeholder="Strong communication&#10;Technical depth&#10;..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Concerns (one per line)</label>
                    <textarea
                      value={evaluationForm.concerns}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, concerns: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-20"
                      placeholder="Limited experience with X&#10;..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Detailed Feedback</label>
                  <textarea
                    value={evaluationForm.detailedFeedback}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, detailedFeedback: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-24"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Recommendation</label>
                    <select
                      value={evaluationForm.recommendation}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, recommendation: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                    >
                      <option value="strong_yes">Strong Yes</option>
                      <option value="yes">Yes</option>
                      <option value="maybe">Maybe</option>
                      <option value="no">No</option>
                      <option value="strong_no">Strong No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Proceed to Next Stage?</label>
                    <select
                      value={evaluationForm.proceedToNext}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, proceedToNext: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Evaluation"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowEvaluationForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {evaluations.length === 0 ? (
              <p className="text-zinc-500 text-sm py-4 text-center">No evaluations yet</p>
            ) : (
              <div className="space-y-4">
                {evaluations.map((ev) => (
                  <div key={ev.id} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{ev.evaluatorName}</h4>
                        {ev.evaluatorRole && (
                          <p className="text-sm text-zinc-500">{ev.evaluatorRole}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.recommendation && (
                          <span className={`font-medium ${RECOMMENDATION_COLORS[ev.recommendation] || ""}`}>
                            {RECOMMENDATION_LABELS[ev.recommendation] || ev.recommendation}
                          </span>
                        )}
                        {ev.proceedToNext === "yes" && <ThumbsUp className="w-5 h-5 text-green-500" />}
                        {ev.proceedToNext === "no" && <ThumbsDown className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {[
                        { score: ev.technicalScore, label: "Technical" },
                        { score: ev.communicationScore, label: "Communication" },
                        { score: ev.problemSolvingScore, label: "Problem Solving" },
                        { score: ev.culturalFitScore, label: "Cultural Fit" },
                        { score: ev.overallScore, label: "Overall" },
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
                          <CheckCircle className="w-4 h-4" /> Strengths
                        </p>
                        <ul className="list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400">
                          {(ev.strengths as string[]).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {((ev.concerns as string[]) || []).length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Concerns
                        </p>
                        <ul className="list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400">
                          {(ev.concerns as string[]).map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
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
