import { NextRequest, NextResponse } from "next/server";
import { db, candidates, workExperiences, educations, projects, candidateProfiles, candidatePreferences } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch candidate with all related data
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, id));

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Fetch related data in parallel
    const [work, education, project, profile, preference] = await Promise.all([
      db.select().from(workExperiences).where(eq(workExperiences.candidateId, id)),
      db.select().from(educations).where(eq(educations.candidateId, id)),
      db.select().from(projects).where(eq(projects.candidateId, id)),
      db.select().from(candidateProfiles).where(eq(candidateProfiles.candidateId, id)),
      db.select().from(candidatePreferences).where(eq(candidatePreferences.candidateId, id)),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...candidate,
        workExperiences: work,
        educations: education,
        projects: project,
        profile: profile[0] || null,
        preferences: preference[0] || null,
      },
    });
  } catch (error) {
    console.error("Failed to fetch candidate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch candidate" },
      { status: 500 }
    );
  }
}
