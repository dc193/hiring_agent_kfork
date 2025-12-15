import Link from "next/link";
import { Users, Upload } from "lucide-react";
import { db, candidates } from "@/db";
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

  // Build query based on status filter
  let allCandidates;
  if (statusFilter === "all") {
    allCandidates = await db
      .select()
      .from(candidates)
      .orderBy(desc(candidates.createdAt));
  } else {
    allCandidates = await db
      .select()
      .from(candidates)
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
