"use client";

import { useState } from "react";
import { CheckCircle, Zap, Database } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import ResumeUploader from "@/components/ResumeUploader";
import ResumeDisplay from "@/components/ResumeDisplay";
import { ParsedResume } from "@/types/resume";

const features = [
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-12 flex-1">
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
              {features.map((feature) => (
                <Card key={feature.title} className="border-0 shadow-none bg-transparent">
                  <CardContent className="text-center p-6">
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <ResumeDisplay resume={parsedResume} onReset={() => setParsedResume(null)} />
        )}
      </main>

      <Footer />
    </div>
  );
}
