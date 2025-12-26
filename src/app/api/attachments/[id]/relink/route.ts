import { NextRequest, NextResponse } from "next/server";
import { db, attachments, templateStages, stagePrompts } from "@/db";
import { eq } from "drizzle-orm";

// Re-link an attachment to a new stage/prompt
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attachmentId } = await params;
    const body = await request.json();
    const { stageId, promptId } = body;

    // Get the attachment
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, attachmentId));

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Prepare update values
    const updateValues: {
      stageId?: string | null;
      sourcePromptId?: string | null;
      pipelineStage?: string | null;
      promptNameSnapshot?: string | null;
    } = {};

    // If stageId provided, validate and get display name
    if (stageId !== undefined) {
      if (stageId === null) {
        // Clear stage association
        updateValues.stageId = null;
        updateValues.pipelineStage = null;
      } else {
        const [stage] = await db
          .select()
          .from(templateStages)
          .where(eq(templateStages.id, stageId));

        if (!stage) {
          return NextResponse.json(
            { error: "Stage not found" },
            { status: 404 }
          );
        }

        updateValues.stageId = stageId;
        updateValues.pipelineStage = stage.displayName;
      }
    }

    // If promptId provided, validate and get name
    if (promptId !== undefined) {
      if (promptId === null) {
        // Clear prompt association
        updateValues.sourcePromptId = null;
        updateValues.promptNameSnapshot = null;
      } else {
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

        updateValues.sourcePromptId = promptId;
        updateValues.promptNameSnapshot = prompt.name;
      }
    }

    // Update the attachment
    const [updated] = await db
      .update(attachments)
      .set(updateValues)
      .where(eq(attachments.id, attachmentId))
      .returning();

    return NextResponse.json({
      success: true,
      attachment: updated,
    });
  } catch (error) {
    console.error("Error re-linking attachment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to re-link attachment" },
      { status: 500 }
    );
  }
}
