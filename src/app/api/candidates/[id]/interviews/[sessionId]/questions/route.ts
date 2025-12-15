import { NextRequest, NextResponse } from "next/server";
import { db, sessionQuestions } from "@/db";
import { eq, asc } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();

    const [question] = await db
      .insert(sessionQuestions)
      .values({
        sessionId,
        questionId: body.questionId || null,
        questionText: body.questionText,
        category: body.category || null,
        answerText: body.answerText || null,
        answerNotes: body.answerNotes || null,
        score: body.score || null,
        scoreNotes: body.scoreNotes || null,
        orderIndex: body.orderIndex || null,
        askedAt: body.askedAt ? new Date(body.askedAt) : null,
      })
      .returning();

    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    console.error("Failed to create question:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create question" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const questions = await db
      .select()
      .from(sessionQuestions)
      .where(eq(sessionQuestions.sessionId, sessionId))
      .orderBy(asc(sessionQuestions.orderIndex));

    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
