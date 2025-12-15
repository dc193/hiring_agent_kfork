import { NextRequest, NextResponse } from "next/server";
import { db, attachments } from "@/db";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";

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
