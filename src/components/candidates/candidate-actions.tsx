"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw, Trash2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidateActionsProps {
  candidateId: string;
  currentStatus: string;
  candidateName?: string;
}

export function CandidateActions({ candidateId, currentStatus, candidateName }: CandidateActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

  const CONFIRM_TEXT = "确认删除";

  const handleStatusChange = async (newStatus: string) => {
    if (isLoading) return;

    const confirmMessage = newStatus === "archived"
      ? "Are you sure you want to archive this candidate?"
      : "Are you sure you want to restore this candidate?";

    if (!confirm(confirmMessage)) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update status");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    if (deleteConfirmInput !== CONFIRM_TEXT) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to delete candidate");
      }

      // Redirect to candidates list after deletion
      router.push("/candidates");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete candidate");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {currentStatus === "archived" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("active")}
            disabled={isLoading || isDeleting}
          >
            <RotateCcw className="w-4 h-4" />
            {isLoading ? "Restoring..." : "Restore"}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("archived")}
            disabled={isLoading || isDeleting}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
          >
            <Archive className="w-4 h-4" />
            {isLoading ? "Archiving..." : "Archive"}
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          disabled={isLoading || isDeleting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-lg font-semibold">删除候选人</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmInput("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {candidateName && (
                  <p className="mb-2">
                    即将删除: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{candidateName}</span>
                  </p>
                )}
                <p className="mb-2">此操作将永久删除：</p>
                <ul className="list-disc list-inside text-xs space-y-1 text-zinc-500">
                  <li>所有候选人信息</li>
                  <li>工作经历、教育记录、项目</li>
                  <li>Profile & Preferences</li>
                  <li>面试记录</li>
                  <li>所有附件和AI分析文档</li>
                </ul>
                <p className="mt-3 text-red-600 font-medium">此操作不可撤销！</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  请输入 <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{CONFIRM_TEXT}</span> 确认删除：
                </label>
                <input
                  type="text"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  placeholder={CONFIRM_TEXT}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmInput("");
                }}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteConfirmInput !== CONFIRM_TEXT || isDeleting}
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
