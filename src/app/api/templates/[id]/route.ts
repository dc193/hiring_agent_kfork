import { NextRequest, NextResponse } from "next/server";
import { db, pipelineTemplates, templateStages, stagePrompts, promptReferenceFiles } from "@/db";
import { eq, asc, inArray } from "drizzle-orm";
import { del } from "@vercel/blob";

// GET single template with stages and prompts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [template] = await db
      .select()
      .from(pipelineTemplates)
      .where(eq(pipelineTemplates.id, id));

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Get stages
    const stages = await db
      .select()
      .from(templateStages)
      .where(eq(templateStages.templateId, id))
      .orderBy(asc(templateStages.orderIndex));

    // Get prompts for each stage
    const stagesWithPrompts = await Promise.all(
      stages.map(async (stage) => {
        const prompts = await db
          .select()
          .from(stagePrompts)
          .where(eq(stagePrompts.stageId, stage.id))
          .orderBy(asc(stagePrompts.orderIndex));

        return { ...stage, prompts };
      })
    );

    return NextResponse.json({ ...template, stages: stagesWithPrompts });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// Helper function to delete reference files and their blobs
async function deletePromptReferenceFilesWithBlobs(promptIds: string[]) {
  if (promptIds.length === 0) return;

  // Get all reference files for these prompts
  const files = await db
    .select()
    .from(promptReferenceFiles)
    .where(inArray(promptReferenceFiles.promptId, promptIds));

  // Delete blobs
  for (const file of files) {
    try {
      await del(file.blobUrl);
    } catch (e) {
      console.warn(`Failed to delete blob: ${file.blobUrl}`, e);
    }
  }

  // Delete database records
  await db
    .delete(promptReferenceFiles)
    .where(inArray(promptReferenceFiles.promptId, promptIds));
}

// PUT update template - Smart update that preserves prompts with reference files
// 解耦架构：模板改动不再级联更新候选人数据
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, stages } = body;

    // Update template
    const [template] = await db
      .update(pipelineTemplates)
      .set({
        name,
        description,
        updatedAt: new Date(),
      })
      .where(eq(pipelineTemplates.id, id))
      .returning();

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // If stages are provided, do smart update
    if (stages !== undefined) {
      // Get existing stages
      const existingStages = await db
        .select()
        .from(templateStages)
        .where(eq(templateStages.templateId, id));

      const existingStageIds = existingStages.map(s => s.id);
      const incomingStageIds = stages
        .filter((s: { id?: string }) => s.id)
        .map((s: { id: string }) => s.id);

      // Find stages to delete (exist in DB but not in incoming)
      const stageIdsToDelete = existingStageIds.filter(sid => !incomingStageIds.includes(sid));

      // Delete removed stages and their prompts (with blob cleanup)
      if (stageIdsToDelete.length > 0) {
        // Get prompts for stages being deleted
        const promptsToDelete = await db
          .select()
          .from(stagePrompts)
          .where(inArray(stagePrompts.stageId, stageIdsToDelete));

        const promptIdsToDelete = promptsToDelete.map(p => p.id);

        // Delete reference files with blobs
        await deletePromptReferenceFilesWithBlobs(promptIdsToDelete);

        // Delete stages (cascades to prompts)
        await db
          .delete(templateStages)
          .where(inArray(templateStages.id, stageIdsToDelete));
      }

      // Update or create stages
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];

        if (stage.id && existingStageIds.includes(stage.id)) {
          // Update existing stage (no cascade update needed in decoupled architecture)
          await db
            .update(templateStages)
            .set({
              name: stage.name,
              displayName: stage.displayName || stage.name,
              description: stage.description || null,
              systemPrompt: stage.systemPrompt || null,
              orderIndex: i,
            })
            .where(eq(templateStages.id, stage.id));

          // Handle prompts for this stage
          if (stage.prompts !== undefined) {
            const existingPrompts = await db
              .select()
              .from(stagePrompts)
              .where(eq(stagePrompts.stageId, stage.id));

            const existingPromptIds = existingPrompts.map(p => p.id);
            const incomingPromptIds = stage.prompts
              .filter((p: { id?: string }) => p.id)
              .map((p: { id: string }) => p.id);

            // Find prompts to delete
            const promptIdsToDelete = existingPromptIds.filter(
              (pid: string) => !incomingPromptIds.includes(pid)
            );

            // Delete removed prompts with blob cleanup
            if (promptIdsToDelete.length > 0) {
              await deletePromptReferenceFilesWithBlobs(promptIdsToDelete);
              await db
                .delete(stagePrompts)
                .where(inArray(stagePrompts.id, promptIdsToDelete));
            }

            // Update or create prompts
            for (let j = 0; j < stage.prompts.length; j++) {
              const prompt = stage.prompts[j];

              if (prompt.id && existingPromptIds.includes(prompt.id)) {
                // Update existing prompt (preserve reference files)
                await db
                  .update(stagePrompts)
                  .set({
                    name: prompt.name,
                    instructions: prompt.instructions,
                    orderIndex: j,
                    updatedAt: new Date(),
                  })
                  .where(eq(stagePrompts.id, prompt.id));
              } else {
                // Create new prompt
                await db.insert(stagePrompts).values({
                  stageId: stage.id,
                  name: prompt.name,
                  instructions: prompt.instructions,
                  orderIndex: j,
                });
              }
            }
          }
        } else {
          // Create new stage
          const [newStage] = await db
            .insert(templateStages)
            .values({
              templateId: id,
              name: stage.name,
              displayName: stage.displayName || stage.name,
              description: stage.description || null,
              systemPrompt: stage.systemPrompt || null,
              orderIndex: i,
            })
            .returning();

          // Create prompts for new stage
          if (stage.prompts && stage.prompts.length > 0) {
            for (let j = 0; j < stage.prompts.length; j++) {
              const prompt = stage.prompts[j];
              await db.insert(stagePrompts).values({
                stageId: newStage.id,
                name: prompt.name,
                instructions: prompt.instructions,
                orderIndex: j,
              });
            }
          }
        }
      }
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE template - with blob cleanup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get all stages for this template
    const stages = await db
      .select()
      .from(templateStages)
      .where(eq(templateStages.templateId, id));

    const stageIds = stages.map(s => s.id);

    if (stageIds.length > 0) {
      // Get all prompts for these stages
      const prompts = await db
        .select()
        .from(stagePrompts)
        .where(inArray(stagePrompts.stageId, stageIds));

      const promptIds = prompts.map(p => p.id);

      // Delete reference files with blobs
      await deletePromptReferenceFilesWithBlobs(promptIds);
    }

    // Delete template (cascades to stages and prompts)
    const [template] = await db
      .delete(pipelineTemplates)
      .where(eq(pipelineTemplates.id, id))
      .returning();

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
