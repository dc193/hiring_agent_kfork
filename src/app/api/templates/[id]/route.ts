import { NextRequest, NextResponse } from "next/server";
import { db, pipelineTemplates, templateStages, stagePrompts } from "@/db";
import { eq, asc } from "drizzle-orm";

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

// PUT update template
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

    // If stages are provided, replace all stages
    if (stages !== undefined) {
      // Delete existing stages (cascades to prompts)
      await db
        .delete(templateStages)
        .where(eq(templateStages.templateId, id));

      // Create new stages
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
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

        // Create prompts for this stage
        if (stage.prompts && stage.prompts.length > 0) {
          for (let j = 0; j < stage.prompts.length; j++) {
            const prompt = stage.prompts[j];
            await db.insert(stagePrompts).values({
              stageId: newStage.id,
              name: prompt.name,
              instructions: prompt.instructions,
              contextSources: prompt.contextSources || [],
              orderIndex: j,
            });
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

// DELETE template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
