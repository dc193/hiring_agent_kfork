import { NextRequest, NextResponse } from "next/server";
import { db, attachments, processingJobs } from "@/db";
import { eq, and } from "drizzle-orm";
import { del } from "@vercel/blob";
import { createProcessingJobs, processAttachmentJobs } from "@/lib/processing";

// GET /api/candidates/[id]/stages/[stage]/attachments/[attachmentId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stage: string; attachmentId: string }> }
) {
  try {
    const { attachmentId } = await params;

    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, attachmentId));

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: "Attachment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: attachment });
  } catch (error) {
    console.error("Failed to fetch attachment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attachment" },
      { status: 500 }
    );
  }
}

// DELETE /api/candidates/[id]/stages/[stage]/attachments/[attachmentId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stage: string; attachmentId: string }> }
) {
  try {
    const { attachmentId } = await params;

    // Get attachment first
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, attachmentId));

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete from Vercel Blob
    try {
      await del(attachment.blobUrl);
    } catch (blobError) {
      console.warn("Failed to delete blob, continuing with db deletion:", blobError);
    }

    // Delete from database
    await db.delete(attachments).where(eq(attachments.id, attachmentId));

    return NextResponse.json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}

// POST /api/candidates/[id]/stages/[stage]/attachments/[attachmentId]
// Re-trigger AI processing for an attachment
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stage: string; attachmentId: string }> }
) {
  try {
    const { id, stage, attachmentId } = await params;

    // Get attachment
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, attachmentId));

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Check for existing pending/processing jobs
    const existingJobs = await db
      .select()
      .from(processingJobs)
      .where(
        and(
          eq(processingJobs.attachmentId, attachmentId),
          eq(processingJobs.status, "processing")
        )
      );

    if (existingJobs.length > 0) {
      return NextResponse.json(
        { success: false, error: "正在处理中，请稍后再试" },
        { status: 409 }
      );
    }

    // Create new processing jobs
    const jobIds = await createProcessingJobs(
      attachmentId,
      id,
      stage,
      attachment.mimeType,
      attachment.type
    );

    if (jobIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有找到匹配的处理规则，请先在设置中配置" },
        { status: 400 }
      );
    }

    // Process jobs in background (non-blocking)
    processAttachmentJobs(attachmentId).catch((error) => {
      console.error("Background processing failed:", error);
    });

    return NextResponse.json({
      success: true,
      message: "AI 处理已触发",
      processingJobs: jobIds,
    });
  } catch (error) {
    console.error("Failed to re-process attachment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to re-process attachment" },
      { status: 500 }
    );
  }
}
