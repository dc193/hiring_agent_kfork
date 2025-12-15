import { Check, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  { name: "Resume Parsing (AI)", status: "done" },
  { name: "Candidate Management", status: "done" },
  { name: "Pipeline Tracking", status: "done" },
  { name: "Profile (档案画像)", status: "in_progress" },
  { name: "Preferences (偏好画像)", status: "in_progress" },
  { name: "Interview Notes", status: "planned" },
  { name: "Team Collaboration", status: "planned" },
];

export function CurrentFeatures() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span>📋</span> Current Features
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.name}
              className="flex items-center gap-3 py-1"
            >
              {feature.status === "done" ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : feature.status === "in_progress" ? (
                <Clock className="w-4 h-4 text-yellow-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
              )}
              <span
                className={
                  feature.status === "done"
                    ? "text-zinc-600 dark:text-zinc-400"
                    : feature.status === "in_progress"
                    ? "text-zinc-900 dark:text-zinc-100 font-medium"
                    : "text-zinc-400 dark:text-zinc-500"
                }
              >
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
