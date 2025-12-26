"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Check, X, Archive, RotateCcw, AlertCircle, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CANDIDATE_STATUSES } from "@/db/schema";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  archived: "Archived",
  rejected: "Rejected",
  hired: "Hired",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  archived: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  hired: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

interface StageInfo {
  name: string;
  displayName: string;
}

interface PipelineControlsProps {
  candidateId: string;
  currentStage: string;
  currentStatus: string;
  stages: StageInfo[];
}

export function PipelineControls({ candidateId, currentStage, currentStatus, stages }: PipelineControlsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveNote, setMoveNote] = useState("");

  const stageNames = stages.map(s => s.name);
  const currentStageIndex = stageNames.indexOf(currentStage);
  const canMoveForward = currentStageIndex < stages.length - 1;
  const canMoveBack = currentStageIndex > 0;

  const updateCandidate = async (updates: { status?: string; pipelineStage?: string; note?: string }) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update candidate:", error);
    } finally {
      setIsUpdating(false);
      setShowStatusMenu(false);
      setShowMoveDialog(false);
      setMoveNote("");
    }
  };

  const moveToStage = (direction: "forward" | "back") => {
    const newIndex = direction === "forward" ? currentStageIndex + 1 : currentStageIndex - 1;
    if (newIndex >= 0 && newIndex < stages.length) {
      updateCandidate({
        pipelineStage: stageNames[newIndex],
        note: moveNote || undefined,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Pipeline Progress */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stages.map((stage, index) => (
          <div key={stage.name} className="flex items-center">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (index !== currentStageIndex) {
                    updateCandidate({ pipelineStage: stage.name });
                  }
                }}
                disabled={isUpdating}
                className={`px-3 py-1.5 rounded-l-full text-sm font-medium transition-colors ${
                  index <= currentStageIndex
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {stage.displayName}
              </button>
              <Link
                href={`/candidates/${candidateId}/stages/${stage.name}`}
                className={`p-1.5 rounded-r-full transition-colors ${
                  index <= currentStageIndex
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
                }`}
                title={`查看 ${stage.displayName} 材料`}
              >
                <FolderOpen className="w-4 h-4" />
              </Link>
            </div>
            {index < stages.length - 1 && (
              <div
                className={`w-6 h-0.5 ${
                  index < currentStageIndex
                    ? "bg-blue-500"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Move Back */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => moveToStage("back")}
            disabled={!canMoveBack || isUpdating}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous Stage
          </Button>

          {/* Move Forward */}
          <Button
            variant="default"
            size="sm"
            onClick={() => moveToStage("forward")}
            disabled={!canMoveForward || isUpdating}
          >
            Next Stage
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Status Control */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Status:</span>
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[currentStatus] || STATUS_COLORS.active}`}
            >
              {STATUS_LABELS[currentStatus] || currentStatus}
            </button>
          </div>

          {showStatusMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-10">
              <div className="py-1">
                {CANDIDATE_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateCandidate({ status })}
                    disabled={status === currentStatus || isUpdating}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 ${
                      status === currentStatus ? "opacity-50" : ""
                    }`}
                  >
                    {status === "active" && <Check className="w-4 h-4 text-green-500" />}
                    {status === "archived" && <Archive className="w-4 h-4 text-zinc-500" />}
                    {status === "rejected" && <X className="w-4 h-4 text-red-500" />}
                    {status === "hired" && <Check className="w-4 h-4 text-blue-500" />}
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Status Actions */}
      {currentStatus === "active" && currentStageIndex === stages.length - 1 && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700 dark:text-green-300 flex-1">
            Candidate is at final stage. Ready to mark as hired?
          </span>
          <Button
            size="sm"
            onClick={() => updateCandidate({ status: "hired" })}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            Mark as Hired
          </Button>
        </div>
      )}

      {currentStatus === "rejected" && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <X className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-700 dark:text-red-300 flex-1">
            This candidate has been rejected.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateCandidate({ status: "active" })}
            disabled={isUpdating}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reactivate
          </Button>
        </div>
      )}

      {currentStatus === "archived" && (
        <div className="flex items-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <Archive className="w-5 h-5 text-zinc-500" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400 flex-1">
            This candidate is archived.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateCandidate({ status: "active" })}
            disabled={isUpdating}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Restore
          </Button>
        </div>
      )}

      {currentStatus === "hired" && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Check className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-blue-700 dark:text-blue-300">
            This candidate has been hired!
          </span>
        </div>
      )}
    </div>
  );
}
