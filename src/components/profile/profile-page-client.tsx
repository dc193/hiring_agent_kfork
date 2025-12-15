"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileEditForm } from "./profile-edit-form";

interface ProfilePageClientProps {
  candidateId: string;
  profileData: {
    careerStage: string | null;
    yearsOfExperience: number | null;
    hardSkills: Array<{ name: string; level: number }> | null;
    softSkills: Array<{ name: string; level: number }> | null;
    certifications: string[] | null;
    behaviorPatterns: Record<string, string> | null;
    socialPosition: Record<string, string> | null;
    resources: Record<string, string> | null;
    profileSummary: string | null;
  } | null;
  children: React.ReactNode;
}

export function ProfilePageClient({ candidateId, profileData, children }: ProfilePageClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ProfileEditForm
        candidateId={candidateId}
        initialData={profileData ? {
          ...profileData,
          hardSkills: profileData.hardSkills || [],
          softSkills: profileData.softSkills || [],
          certifications: profileData.certifications || [],
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
          Edit Profile
        </Button>
      </div>
      {children}
    </div>
  );
}
