import { db, candidates, bugReports, featureRequests, roadmapItems } from "@/db";
import { desc, eq, gte } from "drizzle-orm";
import { PageLayout } from "@/components/ui";
import {
  StatsCards,
  RecentCandidates,
  QuickUpload,
  CurrentFeatures,
  RoadmapSection,
  BugReportSection,
  FeatureRequestSection,
} from "@/components/dashboard";

export default async function Home() {
  // Fetch all data in parallel
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [
    allCandidates,
    recentCandidates,
    thisWeekCandidates,
    pendingCandidates,
    bugs,
    features,
    roadmap,
  ] = await Promise.all([
    db.select().from(candidates).where(eq(candidates.status, "active")),
    db
      .select()
      .from(candidates)
      .where(eq(candidates.status, "active"))
      .orderBy(desc(candidates.createdAt))
      .limit(5),
    db
      .select()
      .from(candidates)
      .where(gte(candidates.createdAt, oneWeekAgo)),
    db
      .select()
      .from(candidates)
      .where(eq(candidates.pipelineStage, "phone_screen")),
    db.select().from(bugReports).orderBy(desc(bugReports.createdAt)),
    db
      .select()
      .from(featureRequests)
      .orderBy(desc(featureRequests.votes), desc(featureRequests.createdAt)),
    db.select().from(roadmapItems).orderBy(roadmapItems.version),
  ]);

  return (
    <PageLayout>
      {/* User Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
          🎯 Dashboard
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <StatsCards
              totalCandidates={allCandidates.length}
              thisWeekCount={thisWeekCandidates.length}
              pendingInterviews={pendingCandidates.length}
            />
          </div>
          <div>
            <QuickUpload />
          </div>
        </div>

        <RecentCandidates candidates={recentCandidates} />
      </section>

      {/* Divider */}
      <div className="relative my-12">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-zinc-50 dark:bg-zinc-950 px-4 text-sm text-zinc-500 dark:text-zinc-400">
            ↓ Developer Zone ↓
          </span>
        </div>
      </div>

      {/* Developer Section */}
      <section>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
          🛠️ Development
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CurrentFeatures />
          <RoadmapSection items={roadmap} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BugReportSection bugs={bugs} />
          <FeatureRequestSection features={features} />
        </div>
      </section>
    </PageLayout>
  );
}
