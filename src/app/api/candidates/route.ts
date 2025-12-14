import { NextResponse } from "next/server";
import { db, candidates, workExperiences, educations } from "@/db";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allCandidates = await db
      .select()
      .from(candidates)
      .orderBy(desc(candidates.createdAt));

    return NextResponse.json({ success: true, data: allCandidates });
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}
