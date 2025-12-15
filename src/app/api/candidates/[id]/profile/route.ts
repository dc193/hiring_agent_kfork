import { NextRequest, NextResponse } from "next/server";
import { db, candidateProfiles } from "@/db";
import { eq } from "drizzle-orm";

// GET /api/candidates/[id]/profile - Get profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [profile] = await db
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.candidateId, id));

    return NextResponse.json({ success: true, data: profile || null });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/candidates/[id]/profile - Update or create profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if profile exists
    const [existing] = await db
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.candidateId, id));

    const profileData = {
      careerStage: body.careerStage || null,
      yearsOfExperience: body.yearsOfExperience || null,
      hardSkills: body.hardSkills || [],
      softSkills: body.softSkills || [],
      certifications: body.certifications || [],
      knowledgeStructure: body.knowledgeStructure || null,
      behaviorPatterns: body.behaviorPatterns || null,
      socialPosition: body.socialPosition || null,
      resources: body.resources || null,
      profileSummary: body.profileSummary || null,
      updatedAt: new Date(),
    };

    let result;
    if (existing) {
      // Update existing profile
      [result] = await db
        .update(candidateProfiles)
        .set(profileData)
        .where(eq(candidateProfiles.candidateId, id))
        .returning();
    } else {
      // Create new profile
      [result] = await db
        .insert(candidateProfiles)
        .values({
          candidateId: id,
          ...profileData,
        })
        .returning();
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
