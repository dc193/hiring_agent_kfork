"use client";

import { useState } from "react";
import ResumeUploader from "@/components/ResumeUploader";
import ResumeDisplay from "@/components/ResumeDisplay";
import { ParsedResume } from "@/types/resume";

export default function Home() {
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Hiring Agent
              </h1>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <a href="#" className="text-blue-500 font-medium">Resume Parser</a>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Candidates</a>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Interviews</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
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

            {/* Features */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Accurate Extraction
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Powered by Claude AI for precise resume parsing
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Fast Processing
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Parse resumes in seconds, not minutes
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Structured Data
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Get organized data ready for your database
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ResumeDisplay resume={parsedResume} onReset={() => setParsedResume(null)} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Hiring Agent - Resume Parsing powered by Claude AI
          </p>
        </div>
      </footer>
    </div>
  );
}
