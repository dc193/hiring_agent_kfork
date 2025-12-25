import { NextRequest, NextResponse } from "next/server";
import { db, pipelineStageConfigs } from "@/db";
import { eq } from "drizzle-orm";

// GET all stage configurations
export async function GET() {
  try {
    const configs = await db.select().from(pipelineStageConfigs);
    return NextResponse.json(configs);
  } catch (error) {
    console.error("Error fetching stage configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch stage configurations" },
      { status: 500 }
    );
  }
}

// POST create or update stage configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      stage,
      displayName,
      description,
      isActive,
      processingRules,
      defaultAnalysisPrompt,
      evaluationDimensions,
      recommendedQuestionCategories,
    } = body;

    if (!stage || !displayName) {
      return NextResponse.json(
        { error: "Stage and displayName are required" },
        { status: 400 }
      );
    }

    // Check if config exists for this stage
    const [existing] = await db
      .select()
      .from(pipelineStageConfigs)
      .where(eq(pipelineStageConfigs.stage, stage));

    let result;

    if (existing) {
      // Update existing config
      [result] = await db
        .update(pipelineStageConfigs)
        .set({
          displayName,
          description,
          isActive: isActive || "true",
          processingRules: processingRules || [],
          defaultAnalysisPrompt,
          evaluationDimensions: evaluationDimensions || [],
          recommendedQuestionCategories: recommendedQuestionCategories || [],
          updatedAt: new Date(),
        })
        .where(eq(pipelineStageConfigs.stage, stage))
        .returning();
    } else {
      // Create new config
      [result] = await db
        .insert(pipelineStageConfigs)
        .values({
          stage,
          displayName,
          description,
          isActive: isActive || "true",
          processingRules: processingRules || [],
          defaultAnalysisPrompt,
          evaluationDimensions: evaluationDimensions || [],
          recommendedQuestionCategories: recommendedQuestionCategories || [],
        })
        .returning();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving stage config:", error);
    return NextResponse.json(
      { error: "Failed to save stage configuration" },
      { status: 500 }
    );
  }
}

// PUT update a specific field of stage configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { stage, stageSummaryPrompt } = body;

    if (!stage) {
      return NextResponse.json(
        { success: false, error: "Stage is required" },
        { status: 400 }
      );
    }

    // Check if config exists for this stage
    const [existing] = await db
      .select()
      .from(pipelineStageConfigs)
      .where(eq(pipelineStageConfigs.stage, stage));

    if (existing) {
      // Update existing config
      await db
        .update(pipelineStageConfigs)
        .set({
          stageSummaryPrompt,
          updatedAt: new Date(),
        })
        .where(eq(pipelineStageConfigs.stage, stage));
    } else {
      // Create new config with just the summary prompt
      const stageDisplayNames: Record<string, string> = {
        resume_review: "简历筛选",
        phone_screen: "电话面试",
        homework: "作业",
        team_interview: "Team 面试",
        consultant_review: "外部顾问",
        final_interview: "终面",
        offer: "Offer",
      };
      const displayName = stageDisplayNames[stage] || stage;

      await db.insert(pipelineStageConfigs).values({
        stage,
        displayName,
        stageSummaryPrompt,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating stage config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update stage configuration" },
      { status: 500 }
    );
  }
}
