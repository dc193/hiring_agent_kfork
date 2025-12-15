import { NextRequest, NextResponse } from "next/server";
import { db, candidatePreferences } from "@/db";
import { eq } from "drizzle-orm";

// GET /api/candidates/[id]/preferences - Get preferences
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [preferences] = await db
      .select()
      .from(candidatePreferences)
      .where(eq(candidatePreferences.candidateId, id));

    return NextResponse.json({ success: true, data: preferences || null });
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PUT /api/candidates/[id]/preferences - Update or create preferences
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if preferences exist
    const [existing] = await db
      .select()
      .from(candidatePreferences)
      .where(eq(candidatePreferences.candidateId, id));

    const preferencesData = {
      valueRanking: body.valueRanking || [],
      motivation: body.motivation || null,
      goals: body.goals || null,
      riskAttitude: body.riskAttitude || null,
      riskDetails: body.riskDetails || null,
      cognitiveStyle: body.cognitiveStyle || null,
      relationshipStyle: body.relationshipStyle || null,
      growthStyle: body.growthStyle || null,
      boundaries: body.boundaries || null,
      preferenceSummary: body.preferenceSummary || null,
      updatedAt: new Date(),
    };

    let result;
    if (existing) {
      // Update existing preferences
      [result] = await db
        .update(candidatePreferences)
        .set(preferencesData)
        .where(eq(candidatePreferences.candidateId, id))
        .returning();
    } else {
      // Create new preferences
      [result] = await db
        .insert(candidatePreferences)
        .values({
          candidateId: id,
          ...preferencesData,
        })
        .returning();
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
