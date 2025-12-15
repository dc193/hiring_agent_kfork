import { NextRequest, NextResponse } from "next/server";
import { db, interviewSessions, candidates } from "@/db";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sessions = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.candidateId, id))
      .orderBy(desc(interviewSessions.scheduledAt));

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("Failed to fetch interviews:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify candidate exists
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

    const [newSession] = await db
      .insert(interviewSessions)
      .values({
        candidateId: id,
        pipelineStage: body.pipelineStage || candidate.pipelineStage,
        interviewType: body.interviewType,
        title: body.title,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        interviewers: body.interviewers || [],
        status: body.status || "scheduled",
        location: body.location || null,
        meetingLink: body.meetingLink || null,
        notes: body.notes || null,
      })
      .returning();

    return NextResponse.json({ success: true, data: newSession });
  } catch (error) {
    console.error("Failed to create interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create interview" },
      { status: 500 }
    );
  }
}
