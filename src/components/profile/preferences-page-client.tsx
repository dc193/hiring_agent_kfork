"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreferencesEditForm } from "./preferences-edit-form";

interface PreferencesPageClientProps {
  candidateId: string;
  preferencesData: {
    valueRanking: Array<{ value: string; rank: number }> | null;
    motivation: { intrinsic?: string[]; extrinsic?: string[]; balance?: string } | null;
    goals: { shortTerm?: string; midTerm?: string; longTerm?: string } | null;
    riskAttitude: string | null;
    cognitiveStyle: Record<string, string> | null;
    relationshipStyle: Record<string, string> | null;
    growthStyle: Record<string, string> | null;
    boundaries: { moralBoundaries?: string; professionalPrinciples?: string; nonNegotiables?: string[]; triggers?: string[] } | null;
    preferenceSummary: string | null;
  } | null;
  children: React.ReactNode;
}

export function PreferencesPageClient({ candidateId, preferencesData, children }: PreferencesPageClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <PreferencesEditForm
        candidateId={candidateId}
        initialData={preferencesData ? {
          ...preferencesData,
          valueRanking: preferencesData.valueRanking || [],
        } : null}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={() => setIsEditing(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Preferences
        </Button>
      </div>
      {children}
    </div>
  );
}
