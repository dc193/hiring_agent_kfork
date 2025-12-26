import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, candidates, candidateProfiles, candidatePreferences, attachments, interviewNotes, stagePrompts } from "@/db";
import { eq, and } from "drizzle-orm";
import { put } from "@vercel/blob";
import { ContextSource } from "@/db/schema";

const anthropic = new Anthropic();

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
    const { promptId, stage } = body;

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

    // Build context
    const context = await buildContext(
      candidateId,
      stage,
      prompt.contextSources || []
    );

    // Build full prompt
    const fullPrompt = `${prompt.instructions}

---

以下是候选人 ${candidate.name} 的相关材料：

${context}`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
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
