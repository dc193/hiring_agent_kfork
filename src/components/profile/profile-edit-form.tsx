"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Skill {
  name: string;
  level: number;
}

interface ProfileData {
  careerStage: string | null;
  yearsOfExperience: number | null;
  hardSkills: Skill[];
  softSkills: Skill[];
  certifications: string[];
  behaviorPatterns: {
    communicationStyle?: string;
    decisionStyle?: string;
    collaborationStyle?: string;
    pressureResponse?: string;
    conflictHandling?: string;
  } | null;
  socialPosition: {
    industryInfluence?: string;
    networkQuality?: string;
    reputation?: string;
  } | null;
  resources: {
    availableTime?: string;
    currentCommitments?: string;
    constraints?: string;
  } | null;
  profileSummary: string | null;
}

interface ProfileEditFormProps {
  candidateId: string;
  initialData: ProfileData | null;
  onCancel: () => void;
}

const CAREER_STAGES = [
  { value: "junior", label: "新手期 (0-2年)" },
  { value: "growth", label: "成长期 (2-5年)" },
  { value: "senior", label: "成熟期 (5-10年)" },
  { value: "transition", label: "转型期" },
];

export function ProfileEditForm({ candidateId, initialData, onCancel }: ProfileEditFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    careerStage: initialData?.careerStage || null,
    yearsOfExperience: initialData?.yearsOfExperience || null,
    hardSkills: initialData?.hardSkills || [],
    softSkills: initialData?.softSkills || [],
    certifications: initialData?.certifications || [],
    behaviorPatterns: initialData?.behaviorPatterns || null,
    socialPosition: initialData?.socialPosition || null,
    resources: initialData?.resources || null,
    profileSummary: initialData?.profileSummary || null,
  });

  const [newHardSkill, setNewHardSkill] = useState({ name: "", level: 3 });
  const [newSoftSkill, setNewSoftSkill] = useState({ name: "", level: 3 });
  const [newCert, setNewCert] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/candidates/${candidateId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.refresh();
        onCancel();
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addHardSkill = () => {
    if (newHardSkill.name.trim()) {
      setFormData({
        ...formData,
        hardSkills: [...formData.hardSkills, { ...newHardSkill }],
      });
      setNewHardSkill({ name: "", level: 3 });
    }
  };

  const removeHardSkill = (index: number) => {
    setFormData({
      ...formData,
      hardSkills: formData.hardSkills.filter((_, i) => i !== index),
    });
  };

  const addSoftSkill = () => {
    if (newSoftSkill.name.trim()) {
      setFormData({
        ...formData,
        softSkills: [...formData.softSkills, { ...newSoftSkill }],
      });
      setNewSoftSkill({ name: "", level: 3 });
    }
  };

  const removeSoftSkill = (index: number) => {
    setFormData({
      ...formData,
      softSkills: formData.softSkills.filter((_, i) => i !== index),
    });
  };

  const addCertification = () => {
    if (newCert.trim()) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCert.trim()],
      });
      setNewCert("");
    }
  };

  const removeCertification = (index: number) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-500 uppercase">基础属性</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-500 mb-1">Career Stage</label>
              <select
                value={formData.careerStage || ""}
                onChange={(e) => setFormData({ ...formData, careerStage: e.target.value || null })}
                className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              >
                <option value="">Select...</option>
                {CAREER_STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-1">Years of Experience</label>
              <input
                type="number"
                value={formData.yearsOfExperience || ""}
                onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                min="0"
                max="50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hard Skills */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-500 uppercase">Hard Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.hardSkills.map((skill, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex-1 text-sm">{skill.name}</span>
              <input
                type="range"
                min="1"
                max="5"
                value={skill.level}
                onChange={(e) => {
                  const newSkills = [...formData.hardSkills];
                  newSkills[index].level = parseInt(e.target.value);
                  setFormData({ ...formData, hardSkills: newSkills });
                }}
                className="w-24"
              />
              <span className="text-sm w-8">{skill.level}/5</span>
              <Button variant="ghost" size="sm" onClick={() => removeHardSkill(index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2 border-t">
            <input
              type="text"
              placeholder="New skill name"
              value={newHardSkill.name}
              onChange={(e) => setNewHardSkill({ ...newHardSkill, name: e.target.value })}
              className="flex-1 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
            <input
              type="range"
              min="1"
              max="5"
              value={newHardSkill.level}
              onChange={(e) => setNewHardSkill({ ...newHardSkill, level: parseInt(e.target.value) })}
              className="w-24"
            />
            <span className="text-sm w-8">{newHardSkill.level}/5</span>
            <Button variant="outline" size="sm" onClick={addHardSkill}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Soft Skills */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-500 uppercase">Soft Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.softSkills.map((skill, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex-1 text-sm">{skill.name}</span>
              <input
                type="range"
                min="1"
                max="5"
                value={skill.level}
                onChange={(e) => {
                  const newSkills = [...formData.softSkills];
                  newSkills[index].level = parseInt(e.target.value);
                  setFormData({ ...formData, softSkills: newSkills });
                }}
                className="w-24"
              />
              <span className="text-sm w-8">{skill.level}/5</span>
              <Button variant="ghost" size="sm" onClick={() => removeSoftSkill(index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2 border-t">
            <input
              type="text"
              placeholder="New skill name"
              value={newSoftSkill.name}
              onChange={(e) => setNewSoftSkill({ ...newSoftSkill, name: e.target.value })}
              className="flex-1 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
            <input
              type="range"
              min="1"
              max="5"
              value={newSoftSkill.level}
              onChange={(e) => setNewSoftSkill({ ...newSoftSkill, level: parseInt(e.target.value) })}
              className="w-24"
            />
            <span className="text-sm w-8">{newSoftSkill.level}/5</span>
            <Button variant="outline" size="sm" onClick={addSoftSkill}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-500 uppercase">Certifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {formData.certifications.map((cert, index) => (
              <div key={index} className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-sm">
                {cert}
                <button onClick={() => removeCertification(index)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="New certification"
              value={newCert}
              onChange={(e) => setNewCert(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCertification()}
              className="flex-1 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
            <Button variant="outline" size="sm" onClick={addCertification}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-500 uppercase">AI Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={formData.profileSummary || ""}
            onChange={(e) => setFormData({ ...formData, profileSummary: e.target.value || null })}
            className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-24"
            placeholder="Profile summary..."
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
