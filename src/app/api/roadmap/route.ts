import { NextRequest, NextResponse } from "next/server";
import { db, roadmapItems } from "@/db";
import { asc } from "drizzle-orm";

// GET /api/roadmap - List all roadmap items
export async function GET() {
  try {
    const items = await db
      .select()
      .from(roadmapItems)
      .orderBy(asc(roadmapItems.version));

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Failed to fetch roadmap:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roadmap" },
      { status: 500 }
    );
  }
}

// POST /api/roadmap - Create a new roadmap item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { version, title, description, features, targetDate, status } = body;

    // Validate required fields
    if (!version || !title) {
      return NextResponse.json(
        { success: false, error: "Version and title are required" },
        { status: 400 }
      );
    }

    const [newItem] = await db
      .insert(roadmapItems)
      .values({
        version,
        title,
        description,
        features: features || [],
        targetDate: targetDate ? new Date(targetDate) : null,
        status: status || "planned",
      })
      .returning();

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error) {
    console.error("Failed to create roadmap item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create roadmap item" },
      { status: 500 }
    );
  }
}
