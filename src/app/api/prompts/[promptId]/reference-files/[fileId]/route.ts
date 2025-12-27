import { NextRequest, NextResponse } from "next/server";
import { db, promptReferenceFiles } from "@/db";
import { eq, and } from "drizzle-orm";
import { del } from "@vercel/blob";

// DELETE single reference file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string; fileId: string }> }
) {
  try {
    const { promptId, fileId } = await params;

    // Get file to delete
    const [file] = await db
      .select()
      .from(promptReferenceFiles)
      .where(
        and(
          eq(promptReferenceFiles.id, fileId),
          eq(promptReferenceFiles.promptId, promptId)
        )
      );

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Delete from blob storage
    try {
      await del(file.blobUrl);
    } catch {
      console.warn(`Failed to delete blob: ${file.blobUrl}`);
    }

    // Delete from database
    await db
      .delete(promptReferenceFiles)
      .where(eq(promptReferenceFiles.id, fileId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reference file:", error);
    return NextResponse.json(
      { error: "Failed to delete reference file" },
      { status: 500 }
    );
  }
}
