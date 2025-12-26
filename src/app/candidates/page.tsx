import Link from "next/link";
import { Users, Upload } from "lucide-react";
import { db, candidates, pipelineTemplates } from "@/db";
import { desc, eq } from "drizzle-orm";
import {
  PageLayout,
  PageHeader,
  EmptyState,
  Card,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  StatusFilter,
  StatusBadge,
  StageBadge,
  SkillsList,
} from "@/components/candidates";

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status || "active";

  // Build query based on status filter with template join
  let allCandidates;
  const baseQuery = db
    .select({
      id: candidates.id,
      name: candidates.name,
      email: candidates.email,
      status: candidates.status,
      pipelineStage: candidates.pipelineStage,
      skills: candidates.skills,
      createdAt: candidates.createdAt,
      templateId: candidates.templateId,
      templateName: pipelineTemplates.name,
    })
    .from(candidates)
    .leftJoin(pipelineTemplates, eq(candidates.templateId, pipelineTemplates.id));

  if (statusFilter === "all") {
    allCandidates = await baseQuery.orderBy(desc(candidates.createdAt));
  } else {
    allCandidates = await baseQuery
      .where(eq(candidates.status, statusFilter))
      .orderBy(desc(candidates.createdAt));
  }

  return (
    <PageLayout>
      <PageHeader title="Candidates" count={allCandidates.length}>
        <Button asChild>
          <Link href="/">
            <Upload className="w-4 h-4" />
            Upload Resume
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-6">
        <StatusFilter />
      </div>

      {allCandidates.length === 0 ? (
        <EmptyState
          icon={Users}
          message={statusFilter === "all" ? "No candidates yet" : `No ${statusFilter} candidates`}
        >
          {statusFilter === "active" && (
            <Link href="/" className="text-blue-500 hover:underline">
              Upload your first resume
            </Link>
          )}
        </EmptyState>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allCandidates.map((candidate) => (
                <TableRow
                  key={candidate.id}
                  className={candidate.status === "archived" ? "opacity-60" : ""}
                >
                  <TableCell>
                    <CandidateCell name={candidate.name} email={candidate.email} />
                  </TableCell>
                  <TableCell>
                    {candidate.templateName ? (
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {candidate.templateName}
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-400 dark:text-zinc-500">
                        未选择
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={candidate.status} />
                  </TableCell>
                  <TableCell>
                    <StageBadge stage={candidate.pipelineStage} />
                  </TableCell>
                  <TableCell>
                    <SkillsList
                      skills={(candidate.skills as string[]) || []}
                      maxDisplay={3}
                      variant="compact"
                    />
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
    </PageLayout>
  );
}

function CandidateCell({ name, email }: { name: string; email: string | null }) {
  return (
    <div>
      <div className="font-medium text-zinc-900 dark:text-zinc-100">{name}</div>
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        {email || "No email"}
      </div>
    </div>
  );
}
