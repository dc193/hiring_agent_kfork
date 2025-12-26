import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, candidates, candidateProfiles, candidatePreferences, attachments, interviewNotes, stagePrompts, templateStages } from "@/db";
import { eq, and } from "drizzle-orm";
import { put } from "@vercel/blob";
import { ContextSource } from "@/db/schema";

const anthropic = new Anthropic();

// Build context from specifically selected attachments
async function buildContextFromSelectedAttachments(
  candidateId: string,
  attachmentIds: string[]
): Promise<string> {
  const contextParts: string[] = [];

  // Get the selected attachments
  const selectedAttachments = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.candidateId, candidateId),
      )
    );

  // Filter to only selected IDs
  const filteredAttachments = selectedAttachments.filter(a => attachmentIds.includes(a.id));

  if (filteredAttachments.length === 0) {
    return "[没有选择的文件]";
  }

  // Group by stage for better organization
  const byStage: Record<string, typeof filteredAttachments> = {};
  for (const att of filteredAttachments) {
    if (!byStage[att.pipelineStage]) {
      byStage[att.pipelineStage] = [];
    }
    byStage[att.pipelineStage].push(att);
  }

  // Build context for each stage
  for (const [stage, stageAttachments] of Object.entries(byStage)) {
    contextParts.push(`## 阶段: ${stage}`);

    for (const attachment of stageAttachments) {
      const isTextFile =
        attachment.mimeType?.startsWith("text/") ||
        attachment.mimeType === "application/json" ||
        attachment.fileName.endsWith(".md") ||
        attachment.fileName.endsWith(".txt") ||
        attachment.fileName.endsWith(".json");

      if (isTextFile) {
        try {
          const response = await fetch(attachment.blobUrl);
          const content = await response.text();
          contextParts.push(`### ${attachment.fileName}\n\n${content}`);
        } catch {
          contextParts.push(`### ${attachment.fileName}\n\n[无法加载文件内容]`);
        }
      } else {
        // For non-text files, just list them
        contextParts.push(`### ${attachment.fileName}\n\n[${attachment.type} 文件，无法读取文本内容]`);
      }
    }
  }

  return contextParts.join("\n\n---\n\n");
}

// Build context based on selected sources
async function buildContext(
  candidateId: string,
  currentStage: string,
  contextSources: ContextSource[]
): Promise<string> {
  const contextParts: string[] = [];

  // Get candidate data
  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, candidateId));

  if (!candidate) {
    throw new Error("Candidate not found");
  }

  for (const source of contextSources) {
    switch (source) {
      case "resume":
        if (candidate.resumeRawText) {
          contextParts.push(`## 简历原文\n\n${candidate.resumeRawText}`);
        }
        break;

      case "profile":
        const [profile] = await db
          .select()
          .from(candidateProfiles)
          .where(eq(candidateProfiles.candidateId, candidateId));

        if (profile) {
          contextParts.push(`## 候选人画像 (Profile)\n\n${JSON.stringify(profile, null, 2)}`);
        }
        break;

      case "preference":
        const [preference] = await db
          .select()
          .from(candidatePreferences)
          .where(eq(candidatePreferences.candidateId, candidateId));

        if (preference) {
          contextParts.push(`## 候选人偏好 (Preference)\n\n${JSON.stringify(preference, null, 2)}`);
        }
        break;

      case "stage_attachments":
        const stageFiles = await db
          .select()
          .from(attachments)
          .where(
            and(
              eq(attachments.candidateId, candidateId),
              eq(attachments.pipelineStage, currentStage)
            )
          );

        if (stageFiles.length > 0) {
          const filesList = stageFiles.map((f) => `- ${f.fileName} (${f.type})`).join("\n");
          contextParts.push(`## 当前阶段附件\n\n${filesList}`);

          // Try to fetch text content from text files
          for (const file of stageFiles) {
            if (file.mimeType?.startsWith("text/") || file.mimeType === "application/json") {
              try {
                const response = await fetch(file.blobUrl);
                const content = await response.text();
                contextParts.push(`### ${file.fileName}\n\n${content}`);
              } catch {
                // Skip if can't fetch
              }
            }
          }
        }
        break;

      case "history_attachments":
        const historyFiles = await db
          .select()
          .from(attachments)
          .where(eq(attachments.candidateId, candidateId));

        const nonCurrentFiles = historyFiles.filter(
          (f) => f.pipelineStage !== currentStage
        );

        if (nonCurrentFiles.length > 0) {
          const filesList = nonCurrentFiles
            .map((f) => `- [${f.pipelineStage}] ${f.fileName} (${f.type})`)
            .join("\n");
          contextParts.push(`## 历史阶段附件\n\n${filesList}`);
        }
        break;

      case "history_reports":
        const allAttachments = await db
          .select()
          .from(attachments)
          .where(eq(attachments.candidateId, candidateId));

        const aiReports = allAttachments.filter(
          (f) =>
            f.description?.includes("AI") ||
            f.fileName.includes("AI") ||
            f.mimeType === "text/markdown"
        );

        if (aiReports.length > 0) {
          contextParts.push(`## 历史 AI 报告`);
          for (const report of aiReports) {
            if (
              report.mimeType?.startsWith("text/") ||
              report.mimeType === "text/markdown"
            ) {
              try {
                const response = await fetch(report.blobUrl);
                const content = await response.text();
                contextParts.push(`### ${report.fileName}\n\n${content}`);
              } catch {
                contextParts.push(`### ${report.fileName}\n\n[无法加载内容]`);
              }
            }
          }
        }
        break;

      case "interview_notes":
        const notes = await db
          .select()
          .from(interviewNotes)
          .where(eq(interviewNotes.candidateId, candidateId));

        if (notes.length > 0) {
          contextParts.push(`## 面试记录`);
          for (const note of notes) {
            contextParts.push(
              `### ${note.stage} - ${note.interviewer || "Unknown"}\n评分: ${note.rating || "N/A"}\n\n${note.content || ""}`
            );
          }
        }
        break;
    }
  }

  return contextParts.join("\n\n---\n\n");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params;
    const body = await request.json();
    const { promptId, stage, selectedAttachmentIds } = body;

    if (!promptId || !stage) {
      return NextResponse.json(
        { error: "promptId and stage are required" },
        { status: 400 }
      );
    }

    // Get candidate
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId));

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Get prompt configuration
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

    // Get stage system prompt if candidate has a template
    let stageSystemPrompt: string | null = null;
    if (candidate.templateId) {
      const [templateStage] = await db
        .select()
        .from(templateStages)
        .where(
          and(
            eq(templateStages.templateId, candidate.templateId),
            eq(templateStages.name, stage)
          )
        );

      if (templateStage?.systemPrompt) {
        stageSystemPrompt = templateStage.systemPrompt;
      }
    }

    // Build context from selected attachments
    let candidateContext: string;
    if (selectedAttachmentIds && selectedAttachmentIds.length > 0) {
      // Use specifically selected attachments
      candidateContext = await buildContextFromSelectedAttachments(candidateId, selectedAttachmentIds);
    } else {
      // No files selected, provide minimal context
      candidateContext = "[没有选择候选人材料]";
    }

    // Build full prompt with reference content and candidate materials
    let fullPrompt = prompt.instructions;

    // Add reference content (template-level) if exists
    if (prompt.referenceContent) {
      fullPrompt += `

---

## 参考资料

${prompt.referenceContent}`;
    }

    // Add candidate materials
    fullPrompt += `

---

## 候选人材料 - ${candidate.name}

${candidateContext}`;

    // Call Claude API with optional system prompt
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      ...(stageSystemPrompt && { system: stageSystemPrompt }),
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
    });

    const analysisResult =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Save result as attachment
    const fileName = `${prompt.name}_${candidate.name}.md`;
    const blob = new Blob([analysisResult], { type: "text/markdown" });

    const uploadedBlob = await put(
      `candidates/${candidateId}/${stage}/${fileName}`,
      blob,
      { access: "public" }
    );

    // Save attachment record
    const [attachment] = await db
      .insert(attachments)
      .values({
        candidateId,
        pipelineStage: stage,
        type: "note",
        fileName,
        fileSize: blob.size,
        mimeType: "text/markdown",
        blobUrl: uploadedBlob.url,
        description: `AI 生成 - ${prompt.name}`,
      })
      .returning();

    return NextResponse.json({
      success: true,
      attachment,
      content: analysisResult,
    });
  } catch (error) {
    console.error("Error executing prompt:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute prompt" },
      { status: 500 }
    );
  }
}
