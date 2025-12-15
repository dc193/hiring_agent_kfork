import { NextRequest, NextResponse } from "next/server";
import { db, interviewEvaluations } from "@/db";
import { eq } from "drizzle-orm";

// GET /api/interviews/[id]/evaluations
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const evaluations = await db
      .select()
      .from(interviewEvaluations)
      .where(eq(interviewEvaluations.sessionId, id));

    return NextResponse.json({ success: true, data: evaluations });
  } catch (error) {
    console.error("Failed to fetch evaluations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch evaluations" },
      { status: 500 }
    );
  }
}

// POST /api/interviews/[id]/evaluations
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [evaluation] = await db
      .insert(interviewEvaluations)
      .values({
        sessionId: id,
        evaluatorName: body.evaluatorName,
        evaluatorRole: body.evaluatorRole || null,
        technicalScore: body.technicalScore || null,
        communicationScore: body.communicationScore || null,
        problemSolvingScore: body.problemSolvingScore || null,
        culturalFitScore: body.culturalFitScore || null,
        overallScore: body.overallScore || null,
        strengths: body.strengths || [],
        concerns: body.concerns || [],
        detailedFeedback: body.detailedFeedback || null,
        recommendation: body.recommendation || null,
        recommendationNotes: body.recommendationNotes || null,
        proceedToNext: body.proceedToNext || "pending",
      })
      .returning();

    return NextResponse.json({ success: true, data: evaluation });
  } catch (error) {
    console.error("Failed to create evaluation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create evaluation" },
      { status: 500 }
    );
  }
}
