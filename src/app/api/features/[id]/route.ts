import { NextRequest, NextResponse } from "next/server";
import { db, featureRequests, FEATURE_STATUSES } from "@/db";
import { eq, sql } from "drizzle-orm";

// PATCH /api/features/[id] - Update feature or vote
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, vote, aiAnalysis, aiImplementationPlan } = body;

    // Validate status if provided
    if (status && !FEATURE_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${FEATURE_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if feature exists
    const [existing] = await db
      .select()
      .from(featureRequests)
      .where(eq(featureRequests.id, id));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Feature not found" },
        { status: 404 }
      );
    }

    // Handle voting
    if (vote === "up") {
      const [updated] = await db
        .update(featureRequests)
        .set({
          votes: sql`${featureRequests.votes} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(featureRequests.id, id))
        .returning();

      return NextResponse.json({ success: true, data: updated });
    }

    // Handle other updates
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (aiAnalysis !== undefined) updates.aiAnalysis = aiAnalysis;
    if (aiImplementationPlan !== undefined) updates.aiImplementationPlan = aiImplementationPlan;

    const [updated] = await db
      .update(featureRequests)
      .set(updates)
      .where(eq(featureRequests.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update feature:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update feature" },
      { status: 500 }
    );
  }
}
