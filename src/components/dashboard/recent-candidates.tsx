import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STAGE_LABELS: Record<string, string> = {
  resume_review: "简历筛选",
  phone_screen: "电话面试",
  homework: "作业",
  team_interview: "Team 面试",
  final_interview: "终面",
  offer: "Offer",
};

interface Candidate {
  id: string;
  name: string;
  pipelineStage: string;
  createdAt: Date;
}

interface RecentCandidatesProps {
  candidates: Candidate[];
}

export function RecentCandidates({ candidates }: RecentCandidatesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Recent Candidates</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/candidates" className="flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {candidates.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm py-4 text-center">
            No candidates yet. Upload a resume to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {candidates.map((candidate) => (
              <Link
                key={candidate.id}
                href={`/candidates/${candidate.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {candidate.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(candidate.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">
                  {STAGE_LABELS[candidate.pipelineStage] || candidate.pipelineStage}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
