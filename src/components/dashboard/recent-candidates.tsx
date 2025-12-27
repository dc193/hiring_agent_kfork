import Link from "next/link";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Candidate {
  id: string;
  name: string;
  pipelineStage: string;
  createdAt: Date;
  templateId: string | null;
  templateName: string | null;
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
            {candidates.map((candidate) => {
              const hasNoTemplate = !candidate.templateId;

              return (
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
                  <div className="flex flex-col items-end gap-1">
                    {candidate.templateName ? (
                      <Badge variant="outline" className="text-xs">
                        {candidate.templateName}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-amber-400 text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        无模板
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {candidate.pipelineStage}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
