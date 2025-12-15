import { NextRequest, NextResponse } from "next/server";
import { db, sessionQuestions } from "@/db";
import { eq } from "drizzle-orm";

// PUT /api/interviews/[id]/questions/[questionId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(sessionQuestions)
      .set({
        questionText: body.questionText,
        category: body.category,
        answerText: body.answerText,
        answerNotes: body.answerNotes,
        score: body.score,
        scoreNotes: body.scoreNotes,
        orderIndex: body.orderIndex,
      })
      .where(eq(sessionQuestions.id, questionId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update question:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE /api/interviews/[id]/questions/[questionId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { questionId } = await params;

    await db.delete(sessionQuestions).where(eq(sessionQuestions.id, questionId));

    return NextResponse.json({ success: true, message: "Question deleted" });
  } catch (error) {
    console.error("Failed to delete question:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
