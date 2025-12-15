import { NextRequest, NextResponse } from "next/server";
import { db, interviewSessions, sessionQuestions, interviewEvaluations, interviewTranscripts } from "@/db";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const [session] = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.id, sessionId));

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Interview session not found" },
        { status: 404 }
      );
    }

    // Fetch related data
    const [questions, evaluations, transcripts] = await Promise.all([
      db.select().from(sessionQuestions).where(eq(sessionQuestions.sessionId, sessionId)),
      db.select().from(interviewEvaluations).where(eq(interviewEvaluations.sessionId, sessionId)),
      db.select().from(interviewTranscripts).where(eq(interviewTranscripts.sessionId, sessionId)),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        session,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
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
      .where(eq(interviewSessions.id, sessionId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Interview session not found" },
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    await db
      .delete(interviewSessions)
      .where(eq(interviewSessions.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete interview" },
      { status: 500 }
    );
  }
}
