import { NextRequest, NextResponse } from "next/server";
import { db, candidates, workExperiences, educations, projects, candidateProfiles, candidatePreferences, pipelineHistory, CANDIDATE_STATUSES, PIPELINE_STAGES } from "@/db";
import { eq } from "drizzle-orm";

// GET /api/candidates/[id] - Get a single candidate
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

// PATCH /api/candidates/[id] - Update candidate status and/or pipeline stage
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, pipelineStage, changedBy, note } = body;

    // Check if candidate exists
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

    const updates: { status?: string; pipelineStage?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    // Validate and set status if provided
    if (status !== undefined) {
      if (!CANDIDATE_STATUSES.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${CANDIDATE_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    // Validate and set pipeline stage if provided
    if (pipelineStage !== undefined) {
      if (!PIPELINE_STAGES.includes(pipelineStage)) {
        return NextResponse.json(
          { success: false, error: `Invalid pipeline stage. Must be one of: ${PIPELINE_STAGES.join(", ")}` },
          { status: 400 }
        );
      }
      updates.pipelineStage = pipelineStage;

      // Record pipeline history
      await db.insert(pipelineHistory).values({
        candidateId: id,
        fromStage: candidate.pipelineStage,
        toStage: pipelineStage,
        changedBy: changedBy || null,
        note: note || null,
      });
    }

    // Update candidate
    const [updated] = await db
      .update(candidates)
      .set(updates)
      .where(eq(candidates.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Failed to update candidate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update candidate" },
      { status: 500 }
    );
  }
}
