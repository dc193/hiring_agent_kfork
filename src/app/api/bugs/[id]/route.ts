import { NextRequest, NextResponse } from "next/server";
import { db, bugReports, BUG_STATUSES } from "@/db";
import { eq } from "drizzle-orm";

// GET /api/bugs/[id] - Get a single bug report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [bug] = await db
      .select()
      .from(bugReports)
      .where(eq(bugReports.id, id));

    if (!bug) {
      return NextResponse.json(
        { success: false, error: "Bug not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bug });
  } catch (error) {
    console.error("Failed to fetch bug:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bug" },
      { status: 500 }
    );
  }
}

// PATCH /api/bugs/[id] - Update bug status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, aiAnalysis, aiSuggestedFix, relatedFiles } = body;

    // Validate status if provided
    if (status && !BUG_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${BUG_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if bug exists
    const [existing] = await db
      .select()
      .from(bugReports)
      .where(eq(bugReports.id, id));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Bug not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (aiAnalysis !== undefined) updates.aiAnalysis = aiAnalysis;
    if (aiSuggestedFix !== undefined) updates.aiSuggestedFix = aiSuggestedFix;
    if (relatedFiles !== undefined) updates.relatedFiles = relatedFiles;

    const [updated] = await db
      .update(bugReports)
      .set(updates)
      .where(eq(bugReports.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update bug:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update bug" },
      { status: 500 }
    );
  }
}
