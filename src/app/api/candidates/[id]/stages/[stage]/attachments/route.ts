import { NextRequest, NextResponse } from "next/server";
import { db, attachments, candidates, PIPELINE_STAGES } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import { createProcessingJobs, processAttachmentJobs } from "@/lib/processing";

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

    // Check for processing rules and create jobs
    const jobIds = await createProcessingJobs(
      attachment.id,
      id,
      stage,
      mimeType,
      fileType
    );

    // Process jobs in background (non-blocking)
    if (jobIds.length > 0) {
      // Don't await - let it run in background
      processAttachmentJobs(attachment.id).catch((error) => {
        console.error("Background processing failed:", error);
      });
    }

    return NextResponse.json({
      success: true,
      data: attachment,
      processingJobs: jobIds.length > 0 ? jobIds : undefined,
    });
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}
