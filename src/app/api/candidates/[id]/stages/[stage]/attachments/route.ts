import { NextRequest, NextResponse } from "next/server";
import { db, attachments, candidates, templateStages, PIPELINE_STAGES } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { put, del } from "@vercel/blob";

// Increase body size limit to 50MB for file uploads
export const maxDuration = 60; // 60 seconds timeout for large file uploads

// Helper: Validate stage against candidate's template or default stages
// Returns both validity and the normalized stage name (from template)
async function validateStage(candidateId: string, stage: string): Promise<{ valid: boolean; candidate?: typeof candidates.$inferSelect; normalizedStage?: string }> {
  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, candidateId));

  if (!candidate) {
    return { valid: false };
  }

  // If candidate has a template, validate against template stages
  if (candidate.templateId) {
    const stages = await db
      .select()
      .from(templateStages)
      .where(eq(templateStages.templateId, candidate.templateId));

    // Check both name and displayName for robustness
    // This handles cases where URL might use displayName or name
    const matchingStage = stages.find(s => s.name === stage || s.displayName === stage);
    if (matchingStage) {
      // Return the stage's name as the normalized identifier
      return { valid: true, candidate, normalizedStage: matchingStage.name };
    }
    return { valid: false, candidate };
  }

  // Fall back to default stages
  return { valid: PIPELINE_STAGES.includes(stage as typeof PIPELINE_STAGES[number]), candidate, normalizedStage: stage };
}

// GET /api/candidates/[id]/stages/[stage]/attachments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stage: string }> }
) {
  try {
    const { id, stage: encodedStage } = await params;
    const stage = decodeURIComponent(encodedStage);

    // Validate stage against candidate's template
    const { valid } = await validateStage(id, stage);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid pipeline stage or candidate not found" },
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
    const { id, stage: encodedStage } = await params;
    const stage = decodeURIComponent(encodedStage);

    // Validate stage against candidate's template
    const { valid, candidate } = await validateStage(id, stage);
    if (!valid || !candidate) {
      return NextResponse.json(
        { success: false, error: "Invalid pipeline stage or candidate not found" },
        { status: 400 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    let attachment;
    let fileType: string;
    let mimeType: string;

    // Check if this is a JSON request (text note) or form data (file upload)
    if (contentType.includes("application/json")) {
      // Text note submission
      const body = await request.json();
      const { text, title, type: noteType, uploadedBy } = body;

      if (!text || !text.trim()) {
        return NextResponse.json(
          { success: false, error: "No text content provided" },
          { status: 400 }
        );
      }

      const fileName = title ? `${title}.md` : `评审意见_${new Date().toISOString().slice(0, 10)}.md`;
      fileType = noteType || "note";
      mimeType = "text/markdown";

      // Create a blob from the text content
      const textBlob = new Blob([text], { type: "text/markdown" });

      // Upload to Vercel Blob
      const blob = await put(`candidates/${id}/${stage}/${fileName}`, textBlob, {
        access: "public",
      });

      // Save to database
      [attachment] = await db
        .insert(attachments)
        .values({
          candidateId: id,
          pipelineStage: stage,
          type: fileType,
          fileName,
          fileSize: textBlob.size,
          mimeType,
          blobUrl: blob.url,
          description: text.slice(0, 200) + (text.length > 200 ? "..." : ""),
          uploadedBy: uploadedBy || null,
        })
        .returning();
    } else {
      // File upload
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

      fileType = type;
      mimeType = file.type;

      // Upload to Vercel Blob
      const blob = await put(`candidates/${id}/${stage}/${file.name}`, file, {
        access: "public",
      });

      // Save to database
      [attachment] = await db
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
    }

    // Auto-processing disabled - user prefers manual AI analysis with file selection

    return NextResponse.json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}
