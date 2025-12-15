"use client";

import { useState } from "react";
import { CheckCircle, Zap, Database } from "lucide-react";
import { PageLayout } from "@/components/ui";
import { FeatureCard } from "@/components/home";
import ResumeUploader from "@/components/ResumeUploader";
import ResumeDisplay from "@/components/ResumeDisplay";
import { ParsedResume } from "@/types/resume";

const FEATURES = [
  {
    icon: CheckCircle,
    title: "Accurate Extraction",
    description: "Powered by Claude AI for precise resume parsing",
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Parse resumes in seconds, not minutes",
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: Database,
    title: "Structured Data",
    description: "Get organized data ready for your database",
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
];

export default function Home() {
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);

  return (
    <PageLayout>
      {!parsedResume ? (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              Parse Resume
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Upload a resume to extract structured information using AI
            </p>
          </div>
          <ResumeUploader onParsed={setParsedResume} />

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      ) : (
        <ResumeDisplay resume={parsedResume} onReset={() => setParsedResume(null)} />
      )}
    </PageLayout>
  );
}
