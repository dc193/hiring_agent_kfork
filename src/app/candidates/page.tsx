import Link from "next/link";
import { Users, Upload } from "lucide-react";
import { db, candidates } from "@/db";
import { desc } from "drizzle-orm";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STAGE_LABELS: Record<string, string> = {
  resume_review: "简历筛选",
  phone_screen: "电话面试",
  homework: "作业",
  team_interview: "Team 面试",
  final_interview: "终面",
  offer: "Offer",
};

type BadgeVariant = "secondary" | "info" | "warning" | "purple" | "destructive" | "success";

const STAGE_VARIANTS: Record<string, BadgeVariant> = {
  resume_review: "secondary",
  phone_screen: "info",
  homework: "warning",
  team_interview: "purple",
  final_interview: "destructive",
  offer: "success",
};

export default async function CandidatesPage() {
  const allCandidates = await db
    .select()
    .from(candidates)
    .orderBy(desc(candidates.createdAt));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Candidates ({allCandidates.length})
          </h2>
          <Button asChild>
            <Link href="/">
              <Upload className="w-4 h-4" />
              Upload Resume
            </Link>
          </Button>
        </div>

        {allCandidates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Users className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500 dark:text-zinc-400 mb-4">No candidates yet</p>
              <Link href="/" className="text-blue-500 hover:underline">
                Upload your first resume
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {candidate.name}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {candidate.email || "No email"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STAGE_VARIANTS[candidate.pipelineStage] || "secondary"}>
                        {STAGE_LABELS[candidate.pipelineStage] || candidate.pipelineStage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {((candidate.skills as string[]) || []).slice(0, 3).map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {((candidate.skills as string[]) || []).length > 3 && (
                          <span className="text-xs text-zinc-400">
                            +{((candidate.skills as string[]) || []).length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(candidate.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/candidates/${candidate.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
