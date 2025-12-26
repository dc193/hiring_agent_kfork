import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, candidates, candidateProfiles, candidatePreferences, attachments, interviewNotes, stagePrompts, templateStages, promptReferenceFiles } from "@/db";
import { eq, and } from "drizzle-orm";
import { put } from "@vercel/blob";
import { ContextSource } from "@/db/schema";

const anthropic = new Anthropic();

// 支持的文档类型（Claude Vision API 支持）
const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
];

// 支持的图片类型
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// 检查是否为支持的文档类型
function isSupportedDocument(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return SUPPORTED_DOCUMENT_TYPES.includes(mimeType);
}

// 检查是否为支持的图片类型
function isSupportedImage(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return SUPPORTED_IMAGE_TYPES.includes(mimeType);
}

// 检查是否为纯文本文件
function isTextFile(mimeType: string | null, fileName: string): boolean {
  return (
    mimeType?.startsWith("text/") ||
    mimeType === "application/json" ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".json") ||
    fileName.endsWith(".csv")
  );
}

// 使用 Claude Vision API 提取文档内容
async function extractDocumentContent(
  blobUrl: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  try {
    const response = await fetch(blobUrl);
    const buffer = await response.arrayBuffer();
    const base64Content = Buffer.from(buffer).toString("base64");

    const extractResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: mimeType as "application/pdf",
                data: base64Content,
              },
            },
            {
              type: "text",
              text: `请提取这个文档(${fileName})的所有文本内容。保留原有的结构和格式。只返回提取的文本内容，不要添加任何解释。`,
            },
          ],
        },
      ],
    });

    return extractResponse.content[0].type === "text"
      ? extractResponse.content[0].text
      : "[文档内容提取失败]";
  } catch (error) {
    // 检查是否为 token 限制错误
    if (error instanceof Error && error.message.includes("token")) {
      throw new Error(`文档 ${fileName} 内容过大，超出 token 限制。请减少选择的文件数量。`);
    }
    console.error(`Error extracting document content from ${fileName}:`, error);
    return `[文档内容提取失败: ${error instanceof Error ? error.message : "未知错误"}]`;
  }
}

// 使用 Claude Vision API 描述图片内容
async function extractImageContent(
  blobUrl: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  try {
    const response = await fetch(blobUrl);
    const buffer = await response.arrayBuffer();
    const base64Content = Buffer.from(buffer).toString("base64");

    const extractResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64Content,
              },
            },
            {
              type: "text",
              text: `请详细描述这张图片(${fileName})的内容。如果图片包含文字，请提取所有文字内容。`,
            },
          ],
        },
      ],
    });

    return extractResponse.content[0].type === "text"
      ? extractResponse.content[0].text
      : "[图片内容提取失败]";
  } catch (error) {
    if (error instanceof Error && error.message.includes("token")) {
      throw new Error(`图片 ${fileName} 过大，超出 token 限制。请减少选择的文件数量。`);
    }
    console.error(`Error extracting image content from ${fileName}:`, error);
    return `[图片内容提取失败: ${error instanceof Error ? error.message : "未知错误"}]`;
  }
}

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

  // Group by stage for better organization (handle null pipelineStage)
  const byStage: Record<string, typeof filteredAttachments> = {};
  for (const att of filteredAttachments) {
    const stageKey = att.pipelineStage || "未分类";
    if (!byStage[stageKey]) {
      byStage[stageKey] = [];
    }
    byStage[stageKey].push(att);
  }

  // Build context for each stage
  for (const [stage, stageAttachments] of Object.entries(byStage)) {
    contextParts.push(`## 阶段: ${stage}`);

    for (const attachment of stageAttachments) {
      const mimeType = attachment.mimeType;
      const fileName = attachment.fileName;

      if (isTextFile(mimeType, fileName)) {
        // 纯文本文件：直接读取
        try {
          const response = await fetch(attachment.blobUrl);
          const content = await response.text();
          contextParts.push(`### ${fileName}\n\n${content}`);
        } catch {
          contextParts.push(`### ${fileName}\n\n[无法加载文件内容]`);
        }
      } else if (isSupportedDocument(mimeType)) {
        // 文档类型（PDF）：使用 Claude Vision API 提取内容
        const content = await extractDocumentContent(
          attachment.blobUrl,
          mimeType!,
          fileName
        );
        contextParts.push(`### ${fileName}\n\n${content}`);
      } else if (isSupportedImage(mimeType)) {
        // 图片类型：使用 Claude Vision API 描述内容
        const content = await extractImageContent(
          attachment.blobUrl,
          mimeType!,
          fileName
        );
        contextParts.push(`### ${fileName}\n\n[图片内容描述]\n${content}`);
      } else {
        // 不支持的文件类型（音视频等）
        contextParts.push(`### ${fileName}\n\n[${attachment.type} 文件，不支持内容提取（如音视频文件）]`);
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

    // Get stage info if candidate has a template
    let stageSystemPrompt: string | null = null;
    let stageId: string | null = null;
    let stageDisplayName: string = stage;
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

      if (templateStage) {
        stageId = templateStage.id;
        stageDisplayName = templateStage.displayName;
        if (templateStage.systemPrompt) {
          stageSystemPrompt = templateStage.systemPrompt;
        }
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

    // Get reference files for this prompt
    const referenceFiles = await db
      .select()
      .from(promptReferenceFiles)
      .where(eq(promptReferenceFiles.promptId, promptId));

    // Build reference content from files
    let referenceContentText = "";
    if (referenceFiles.length > 0) {
      const refContentParts: string[] = [];
      for (const refFile of referenceFiles) {
        const mimeType = refFile.mimeType;
        const fileName = refFile.fileName;

        if (isTextFile(mimeType, fileName)) {
          // 纯文本文件：直接读取
          try {
            const response = await fetch(refFile.blobUrl);
            const content = await response.text();
            refContentParts.push(`### ${fileName}\n\n${content}`);
          } catch {
            refContentParts.push(`### ${fileName}\n\n[无法加载文件内容]`);
          }
        } else if (isSupportedDocument(mimeType)) {
          // 文档类型（PDF）：使用 Claude Vision API 提取内容
          const content = await extractDocumentContent(
            refFile.blobUrl,
            mimeType!,
            fileName
          );
          refContentParts.push(`### ${fileName}\n\n${content}`);
        } else if (isSupportedImage(mimeType)) {
          // 图片类型：使用 Claude Vision API 描述内容
          const content = await extractImageContent(
            refFile.blobUrl,
            mimeType!,
            fileName
          );
          refContentParts.push(`### ${fileName}\n\n[图片内容描述]\n${content}`);
        } else {
          // 不支持的文件类型
          refContentParts.push(`### ${fileName}\n\n[不支持的文件类型，无法读取内容]`);
        }
      }
      referenceContentText = refContentParts.join("\n\n");
    }

    // Build full prompt with reference content and candidate materials
    let fullPrompt = prompt.instructions;

    // Add reference files content (template-level) if exists
    if (referenceContentText) {
      fullPrompt += `

---

## 参考资料

${referenceContentText}`;
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

    // Save attachment record with stageId for broken link detection
    const [attachment] = await db
      .insert(attachments)
      .values({
        candidateId,
        stageId, // 关联的阶段ID，用于断链检测
        sourcePromptId: promptId, // 关联的prompt ID
        pipelineStage: stageDisplayName, // 快照：创建时的阶段名称
        promptNameSnapshot: prompt.name, // 快照：创建时的prompt名称
        type: "ai_analysis",
        fileName,
        fileSize: blob.size,
        mimeType: "text/markdown",
        blobUrl: uploadedBlob.url,
        description: `AI 生成 - ${prompt.name}`,
        tags: ["AI分析", prompt.name],
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
