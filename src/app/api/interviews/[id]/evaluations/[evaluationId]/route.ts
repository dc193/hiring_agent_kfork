import { NextRequest, NextResponse } from "next/server";
import { db, interviewEvaluations } from "@/db";
import { eq } from "drizzle-orm";

// PUT /api/interviews/[id]/evaluations/[evaluationId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(interviewEvaluations)
      .set({
        evaluatorName: body.evaluatorName,
        evaluatorRole: body.evaluatorRole,
        technicalScore: body.technicalScore,
        communicationScore: body.communicationScore,
        problemSolvingScore: body.problemSolvingScore,
        culturalFitScore: body.culturalFitScore,
        overallScore: body.overallScore,
        strengths: body.strengths,
        concerns: body.concerns,
        detailedFeedback: body.detailedFeedback,
        recommendation: body.recommendation,
        recommendationNotes: body.recommendationNotes,
        proceedToNext: body.proceedToNext,
        updatedAt: new Date(),
      })
      .where(eq(interviewEvaluations.id, evaluationId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Evaluation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update evaluation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update evaluation" },
      { status: 500 }
    );
  }
}

// DELETE /api/interviews/[id]/evaluations/[evaluationId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params;

    await db.delete(interviewEvaluations).where(eq(interviewEvaluations.id, evaluationId));

    return NextResponse.json({ success: true, message: "Evaluation deleted" });
  } catch (error) {
    console.error("Failed to delete evaluation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete evaluation" },
      { status: 500 }
    );
  }
}
