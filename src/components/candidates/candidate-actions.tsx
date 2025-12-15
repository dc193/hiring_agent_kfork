"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidateActionsProps {
  candidateId: string;
  currentStatus: string;
}

export function CandidateActions({ candidateId, currentStatus }: CandidateActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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

  if (currentStatus === "archived") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleStatusChange("active")}
        disabled={isLoading}
      >
        <RotateCcw className="w-4 h-4" />
        {isLoading ? "Restoring..." : "Restore"}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleStatusChange("archived")}
      disabled={isLoading}
      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
    >
      <Archive className="w-4 h-4" />
      {isLoading ? "Archiving..." : "Archive"}
    </Button>
  );
}
