import { NextRequest, NextResponse } from "next/server";
import { db, featureRequests, FEATURE_STATUSES } from "@/db";
import { desc } from "drizzle-orm";

// GET /api/features - List all feature requests
export async function GET() {
  try {
    const features = await db
      .select()
      .from(featureRequests)
      .orderBy(desc(featureRequests.votes), desc(featureRequests.createdAt));

    return NextResponse.json({ success: true, data: features });
  } catch (error) {
    console.error("Failed to fetch features:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}

// POST /api/features - Create a new feature request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, useCase, requestedBy } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 }
      );
    }

    const [newFeature] = await db
      .insert(featureRequests)
      .values({
        title,
        description,
        useCase,
        requestedBy,
        status: "proposed",
        votes: 0,
      })
      .returning();

    return NextResponse.json({ success: true, data: newFeature }, { status: 201 });
  } catch (error) {
    console.error("Failed to create feature:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create feature request" },
      { status: 500 }
    );
  }
}
