import { NextRequest, NextResponse } from "next/server";
import { db, interviewSessions, candidates, sessionQuestions, interviewEvaluations, interviewTranscripts } from "@/db";
import { eq, asc } from "drizzle-orm";

// GET /api/interviews/[id] - Get interview with all details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [session] = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.id, id));

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      );
    }

    // Get candidate info
    const [candidate] = await db
      .select({
        id: candidates.id,
        name: candidates.name,
        email: candidates.email,
        phone: candidates.phone,
        pipelineStage: candidates.pipelineStage,
        status: candidates.status,
      })
      .from(candidates)
      .where(eq(candidates.id, session.candidateId));

    // Get related data
    const [questions, evaluations, transcripts] = await Promise.all([
      db.select().from(sessionQuestions).where(eq(sessionQuestions.sessionId, id)).orderBy(asc(sessionQuestions.orderIndex)),
      db.select().from(interviewEvaluations).where(eq(interviewEvaluations.sessionId, id)),
      db.select().from(interviewTranscripts).where(eq(interviewTranscripts.sessionId, id)),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...session,
        candidate,
        questions,
        evaluations,
        transcripts,
      },
    });
  } catch (error) {
    console.error("Failed to fetch interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch interview" },
      { status: 500 }
    );
  }
}

// PUT /api/interviews/[id] - Update interview
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(interviewSessions)
      .set({
        title: body.title,
        interviewType: body.interviewType,
        pipelineStage: body.pipelineStage,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
        endedAt: body.endedAt ? new Date(body.endedAt) : undefined,
        duration: body.duration,
        interviewers: body.interviewers,
        status: body.status,
        location: body.location,
        meetingLink: body.meetingLink,
        notes: body.notes,
        updatedAt: new Date(),
      })
      .where(eq(interviewSessions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update interview" },
      { status: 500 }
    );
  }
}

// DELETE /api/interviews/[id] - Delete interview
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(interviewSessions)
      .where(eq(interviewSessions.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Interview deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete interview" },
      { status: 500 }
    );
  }
}
