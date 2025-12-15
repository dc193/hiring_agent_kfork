"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidateActionsProps {
  candidateId: string;
  currentStatus: string;
}

export function CandidateActions({ candidateId, currentStatus }: CandidateActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

    const confirmMessage = "Are you sure you want to DELETE this candidate?\n\nThis will permanently remove:\n- All candidate information\n- Work experiences\n- Education records\n- Projects\n- Profile & Preferences\n- Interview sessions\n- Pipeline history\n\nThis action cannot be undone!";

    if (!confirm(confirmMessage)) return;

    // Double confirm for safety
    if (!confirm("This is your final confirmation. Delete this candidate permanently?")) return;

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
        onClick={handleDelete}
        disabled={isLoading || isDeleting}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Trash2 className="w-4 h-4" />
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
