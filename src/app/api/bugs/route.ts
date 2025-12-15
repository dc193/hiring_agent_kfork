import { NextRequest, NextResponse } from "next/server";
import { db, bugReports, BUG_STATUSES, BUG_PRIORITIES } from "@/db";
import { desc } from "drizzle-orm";

// GET /api/bugs - List all bug reports
export async function GET() {
  try {
    const bugs = await db
      .select()
      .from(bugReports)
      .orderBy(desc(bugReports.createdAt));

    return NextResponse.json({ success: true, data: bugs });
  } catch (error) {
    console.error("Failed to fetch bugs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bugs" },
      { status: 500 }
    );
  }
}

// POST /api/bugs - Create a new bug report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      priority,
      reportedBy,
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority && !BUG_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { success: false, error: `Invalid priority. Must be one of: ${BUG_PRIORITIES.join(", ")}` },
        { status: 400 }
      );
    }

    const [newBug] = await db
      .insert(bugReports)
      .values({
        title,
        description,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        priority: priority || "medium",
        reportedBy,
        status: "open",
      })
      .returning();

    return NextResponse.json({ success: true, data: newBug }, { status: 201 });
  } catch (error) {
    console.error("Failed to create bug:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create bug report" },
      { status: 500 }
    );
  }
}
