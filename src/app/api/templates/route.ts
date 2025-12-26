import { NextRequest, NextResponse } from "next/server";
import { db, pipelineTemplates, templateStages, stagePrompts } from "@/db";
import { eq, asc } from "drizzle-orm";

// GET all templates with their stages and prompts
export async function GET() {
  try {
    const templates = await db
      .select()
      .from(pipelineTemplates)
      .orderBy(asc(pipelineTemplates.createdAt));

    // Get stages and prompts for each template
    const templatesWithDetails = await Promise.all(
      templates.map(async (template) => {
        const stages = await db
          .select()
          .from(templateStages)
          .where(eq(templateStages.templateId, template.id))
          .orderBy(asc(templateStages.orderIndex));

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

        return { ...template, stages: stagesWithPrompts };
      })
    );

    return NextResponse.json(templatesWithDetails);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, stages } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    // Create template
    const [template] = await db
      .insert(pipelineTemplates)
      .values({
        name,
        description: description || null,
      })
      .returning();

    // Create stages if provided
    if (stages && stages.length > 0) {
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const [newStage] = await db
          .insert(templateStages)
          .values({
            templateId: template.id,
            name: stage.name,
            displayName: stage.displayName || stage.name,
            description: stage.description || null,
            systemPrompt: stage.systemPrompt || null,
            orderIndex: i,
          })
          .returning();

        // Create prompts for this stage if provided
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

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
