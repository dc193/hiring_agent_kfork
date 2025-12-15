"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

export function StatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "active";

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/candidates?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      {STATUS_OPTIONS.map((option) => {
        const isActive = option.value === "all"
          ? !searchParams.get("status") || currentStatus === "all"
          : currentStatus === option.value;

        return (
          <Button
            key={option.value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
