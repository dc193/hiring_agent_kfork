import { NextRequest, NextResponse } from "next/server";
import { db, attachments, candidates, PIPELINE_STAGES } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { put, del } from "@vercel/blob";

// GET /api/candidates/[id]/stages/[stage]/attachments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stage: string }> }
) {
  try {
    const { id, stage } = await params;

    // Validate stage
    if (!PIPELINE_STAGES.includes(stage as typeof PIPELINE_STAGES[number])) {
      return NextResponse.json(
        { success: false, error: "Invalid pipeline stage" },
        { status: 400 }
      );
    }

    const stageAttachments = await db
      .select()
      .from(attachments)
      .where(
        and(
          eq(attachments.candidateId, id),
          eq(attachments.pipelineStage, stage)
        )
      )
      .orderBy(desc(attachments.createdAt));

    return NextResponse.json({ success: true, data: stageAttachments });
  } catch (error) {
    console.error("Failed to fetch attachments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}

// POST /api/candidates/[id]/stages/[stage]/attachments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stage: string }> }
) {
  try {
    const { id, stage } = await params;

    // Validate stage
    if (!PIPELINE_STAGES.includes(stage as typeof PIPELINE_STAGES[number])) {
      return NextResponse.json(
        { success: false, error: "Invalid pipeline stage" },
        { status: 400 }
      );
    }

    // Verify candidate exists
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, id));

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string || "other";
    const description = formData.get("description") as string || null;
    const uploadedBy = formData.get("uploadedBy") as string || null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(`candidates/${id}/${stage}/${file.name}`, file, {
      access: "public",
    });

    // Save to database
    const [attachment] = await db
      .insert(attachments)
      .values({
        candidateId: id,
        pipelineStage: stage,
        type,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        blobUrl: blob.url,
        description,
        uploadedBy,
      })
      .returning();

    return NextResponse.json({ success: true, data: attachment });
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}
