import { NextRequest, NextResponse } from "next/server";
import { db, interviewSessions, candidates, sessionQuestions, interviewEvaluations } from "@/db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

// GET /api/interviews - Get all interviews with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const stage = searchParams.get("stage");
    const candidateId = searchParams.get("candidateId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Build query conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(interviewSessions.status, status));
    }
    if (stage) {
      conditions.push(eq(interviewSessions.pipelineStage, stage));
    }
    if (candidateId) {
      conditions.push(eq(interviewSessions.candidateId, candidateId));
    }
    if (fromDate) {
      conditions.push(gte(interviewSessions.scheduledAt, new Date(fromDate)));
    }
    if (toDate) {
      conditions.push(lte(interviewSessions.scheduledAt, new Date(toDate)));
    }

    // Query interviews with candidate info
    const interviews = await db
      .select({
        interview: interviewSessions,
        candidate: {
          id: candidates.id,
          name: candidates.name,
          email: candidates.email,
          pipelineStage: candidates.pipelineStage,
          status: candidates.status,
        },
      })
      .from(interviewSessions)
      .leftJoin(candidates, eq(interviewSessions.candidateId, candidates.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(interviewSessions.scheduledAt));

    return NextResponse.json({
      success: true,
      data: interviews.map((row) => ({
        ...row.interview,
        candidate: row.candidate,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch interviews:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}

// POST /api/interviews - Create a new interview
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify candidate exists
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, body.candidateId));

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    const [newSession] = await db
      .insert(interviewSessions)
      .values({
        candidateId: body.candidateId,
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
