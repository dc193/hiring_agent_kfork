import { NextRequest, NextResponse } from "next/server";
import { db, attachments, pipelineStageConfigs, candidates, PIPELINE_STAGES } from "@/db";
import { eq, and, inArray } from "drizzle-orm";
import { put } from "@vercel/blob";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// Default summary prompt if none configured
const DEFAULT_SUMMARY_PROMPT = `你是一位资深的招聘专家。请基于以下候选人在招聘流程中收集的所有材料，生成一份阶段性综合评估报告。

## 评估要求

1. **材料概述**
   - 列出收到的所有材料类型
   - 标注材料的完整性

2. **能力评估**
   - 技术能力分析
   - 软技能观察
   - 与岗位的匹配度

3. **关键发现**
   - 亮点和优势
   - 需要关注的问题
   - 待验证的疑点

4. **阶段结论**
   - 当前阶段的综合评价
   - 是否推荐进入下一阶段
   - 下一阶段需要重点关注的问题

请用 Markdown 格式输出，语言使用中文。

---

候选人: {candidate_name}
当前阶段: {current_stage}
材料内容:

{materials}
`;

// Helper to read file content
async function readFileContent(blobUrl: string, mimeType: string | null, fileName: string): Promise<string | null> {
  try {
    // Only read text-based files
    if (
      mimeType?.startsWith("text/") ||
      mimeType === "application/json" ||
      fileName.endsWith(".md") ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".json")
    ) {
      const response = await fetch(blobUrl);
      return await response.text();
    }

    // For PDF files, we'll just note that it exists (content extraction would require more work)
    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      return `[PDF 文件: ${fileName}]`;
    }

    // For other files, just note the file type
    return `[文件: ${fileName}, 类型: ${mimeType || "未知"}]`;
  } catch (error) {
    console.error(`Failed to read file ${fileName}:`, error);
    return `[无法读取文件: ${fileName}]`;
  }
}

// POST /api/candidates/[id]/stages/[stage]/summary
// Generate a stage summary report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stage: string }> }
) {
  try {
    const { id: candidateId, stage } = await params;

    // Validate stage
    if (!PIPELINE_STAGES.includes(stage as typeof PIPELINE_STAGES[number])) {
      return NextResponse.json(
        { success: false, error: "Invalid pipeline stage" },
        { status: 400 }
      );
    }

    // Get candidate info
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId));

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Get stage config for the summary prompt
    let summaryPrompt = DEFAULT_SUMMARY_PROMPT;
    try {
      const [stageConfig] = await db
        .select()
        .from(pipelineStageConfigs)
        .where(eq(pipelineStageConfigs.stage, stage));

      if (stageConfig?.stageSummaryPrompt) {
        summaryPrompt = stageConfig.stageSummaryPrompt;
      }
    } catch (error) {
      console.log("Could not fetch stage config, using default prompt");
    }

    // Get current stage index
    const currentStageIndex = PIPELINE_STAGES.indexOf(stage as typeof PIPELINE_STAGES[number]);

    // Get all stages up to and including current stage
    const stagesToInclude = PIPELINE_STAGES.slice(0, currentStageIndex + 1);

    // Fetch all attachments from these stages
    const stageAttachments = await db
      .select()
      .from(attachments)
      .where(
        and(
          eq(attachments.candidateId, candidateId),
          inArray(attachments.pipelineStage, [...stagesToInclude])
        )
      );

    if (stageAttachments.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有找到任何材料，请先上传文件" },
        { status: 400 }
      );
    }

    // Read content from each attachment
    const materialsContent: string[] = [];

    for (const attachment of stageAttachments) {
      const stageLabel = {
        resume_review: "简历筛选",
        phone_screen: "电话面试",
        homework: "作业",
        team_interview: "Team 面试",
        consultant_review: "外部顾问",
        final_interview: "终面",
        offer: "Offer",
      }[attachment.pipelineStage] || attachment.pipelineStage;

      const content = await readFileContent(
        attachment.blobUrl,
        attachment.mimeType,
        attachment.fileName
      );

      if (content) {
        materialsContent.push(`### [${stageLabel}] ${attachment.fileName}\n\n${content}`);
      }
    }

    const stageLabel = {
      resume_review: "简历筛选",
      phone_screen: "电话面试",
      homework: "作业",
      team_interview: "Team 面试",
      consultant_review: "外部顾问",
      final_interview: "终面",
      offer: "Offer",
    }[stage] || stage;

    // Prepare the prompt
    const fullPrompt = summaryPrompt
      .replace("{candidate_name}", candidate.name)
      .replace("{current_stage}", stageLabel)
      .replace("{materials}", materialsContent.join("\n\n---\n\n"));

    // Generate summary using Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
    });

    const summaryText = response.content[0].type === "text"
      ? response.content[0].text
      : "";

    if (!summaryText) {
      return NextResponse.json(
        { success: false, error: "AI 生成失败，请重试" },
        { status: 500 }
      );
    }

    // Create filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "").replace("T", "-");
    const fileName = `${stage}-总结-${timestamp}.md`;

    // Upload to Vercel Blob
    const blob = new Blob([summaryText], { type: "text/markdown" });
    const uploadedBlob = await put(
      `candidates/${candidateId}/${stage}/${fileName}`,
      blob,
      { access: "public" }
    );

    // Save as attachment
    const [newAttachment] = await db
      .insert(attachments)
      .values({
        candidateId,
        pipelineStage: stage,
        type: "note",
        fileName,
        fileSize: blob.size,
        mimeType: "text/markdown",
        blobUrl: uploadedBlob.url,
        description: `AI 生成的${stageLabel}阶段总结报告`,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "阶段总结已生成",
      attachment: newAttachment,
    });
  } catch (error) {
    console.error("Failed to generate stage summary:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to generate summary" },
      { status: 500 }
    );
  }
}
