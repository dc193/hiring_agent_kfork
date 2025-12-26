import { NextRequest, NextResponse } from "next/server";
import { db, promptReferenceFiles, stagePrompts } from "@/db";
import { eq } from "drizzle-orm";
import { put, del } from "@vercel/blob";

// GET all reference files for a prompt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;

    const files = await db
      .select()
      .from(promptReferenceFiles)
      .where(eq(promptReferenceFiles.promptId, promptId));

    return NextResponse.json({ success: true, data: files });
  } catch (error) {
    console.error("Error fetching reference files:", error);
    return NextResponse.json(
      { error: "Failed to fetch reference files" },
      { status: 500 }
    );
  }
}

// POST upload new reference file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;

    // Verify prompt exists
    const [prompt] = await db
      .select()
      .from(stagePrompts)
      .where(eq(stagePrompts.id, promptId));

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(
      `templates/prompts/${promptId}/${file.name}`,
      file,
      { access: "public" }
    );

    // Save to database
    const [referenceFile] = await db
      .insert(promptReferenceFiles)
      .values({
        promptId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        blobUrl: blob.url,
        description: description || null,
      })
      .returning();

    return NextResponse.json({ success: true, data: referenceFile }, { status: 201 });
  } catch (error) {
    console.error("Error uploading reference file:", error);
    return NextResponse.json(
      { error: "Failed to upload reference file" },
      { status: 500 }
    );
  }
}

// DELETE all reference files for a prompt (used when deleting prompt)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;

    // Get all files to delete from blob storage
    const files = await db
      .select()
      .from(promptReferenceFiles)
      .where(eq(promptReferenceFiles.promptId, promptId));

    // Delete from blob storage
    for (const file of files) {
      try {
        await del(file.blobUrl);
      } catch {
        // Continue even if blob deletion fails
        console.warn(`Failed to delete blob: ${file.blobUrl}`);
      }
    }

    // Delete from database (cascade should handle this, but explicit is better)
    await db
      .delete(promptReferenceFiles)
      .where(eq(promptReferenceFiles.promptId, promptId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reference files:", error);
    return NextResponse.json(
      { error: "Failed to delete reference files" },
      { status: 500 }
    );
  }
}
