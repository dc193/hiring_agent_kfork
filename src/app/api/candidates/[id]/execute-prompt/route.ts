import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, candidates, attachments, stagePrompts, templateStages, promptReferenceFiles } from "@/db";
import { eq, and } from "drizzle-orm";
import { put } from "@vercel/blob";

const anthropic = new Anthropic();

// Content block types for Claude API
type TextBlock = { type: "text"; text: string };
type DocumentBlock = {
  type: "document";
  source: {
    type: "base64";
    media_type: "application/pdf";
    data: string;
  };
};
type ImageBlock = {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    data: string;
  };
};
type ContentBlock = TextBlock | DocumentBlock | ImageBlock;

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

// 创建文档 content block（原生 PDF 支持）
async function createDocumentBlock(
  blobUrl: string,
  mimeType: string,
  fileName: string
): Promise<ContentBlock[]> {
  try {
    const response = await fetch(blobUrl);
    const buffer = await response.arrayBuffer();
    const base64Content = Buffer.from(buffer).toString("base64");

    return [
      { type: "text", text: `\n### 文档: ${fileName}\n` },
      {
        type: "document",
        source: {
          type: "base64",
          media_type: mimeType as "application/pdf",
          data: base64Content,
        },
      },
    ];
  } catch (error) {
    console.error(`Error loading document ${fileName}:`, error);
    return [{ type: "text", text: `\n### ${fileName}\n\n[无法加载文档]` }];
  }
}

// 创建图片 content block（原生图片支持）
async function createImageBlock(
  blobUrl: string,
  mimeType: string,
  fileName: string
): Promise<ContentBlock[]> {
  try {
    const response = await fetch(blobUrl);
    const buffer = await response.arrayBuffer();
    const base64Content = Buffer.from(buffer).toString("base64");

    return [
      { type: "text", text: `\n### 图片: ${fileName}\n` },
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: base64Content,
        },
      },
    ];
  } catch (error) {
    console.error(`Error loading image ${fileName}:`, error);
    return [{ type: "text", text: `\n### ${fileName}\n\n[无法加载图片]` }];
  }
}

// 创建文本文件 content block
async function createTextBlock(
  blobUrl: string,
  fileName: string
): Promise<ContentBlock[]> {
  try {
    const response = await fetch(blobUrl);
    const content = await response.text();
    return [{ type: "text", text: `\n### ${fileName}\n\n${content}` }];
  } catch (error) {
    console.error(`Error loading text file ${fileName}:`, error);
    return [{ type: "text", text: `\n### ${fileName}\n\n[无法加载文件内容]` }];
  }
}

// Build content blocks from specifically selected attachments (native document support)
async function buildContentBlocksFromSelectedAttachments(
  candidateId: string,
  attachmentIds: string[]
): Promise<ContentBlock[]> {
  const contentBlocks: ContentBlock[] = [];

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
    return [{ type: "text", text: "[没有选择的文件]" }];
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

  // Build content blocks for each stage
  for (const [stage, stageAttachments] of Object.entries(byStage)) {
    contentBlocks.push({ type: "text", text: `\n## 阶段: ${stage}\n` });

    for (const attachment of stageAttachments) {
      const mimeType = attachment.mimeType;
      const fileName = attachment.fileName;

      if (isTextFile(mimeType, fileName)) {
        // 纯文本文件：直接读取
        const blocks = await createTextBlock(attachment.blobUrl, fileName);
        contentBlocks.push(...blocks);
      } else if (isSupportedDocument(mimeType)) {
        // 文档类型（PDF）：使用原生文档块
        const blocks = await createDocumentBlock(attachment.blobUrl, mimeType!, fileName);
        contentBlocks.push(...blocks);
      } else if (isSupportedImage(mimeType)) {
        // 图片类型：使用原生图片块
        const blocks = await createImageBlock(attachment.blobUrl, mimeType!, fileName);
        contentBlocks.push(...blocks);
      } else {
        // 不支持的文件类型（音视频等）
        contentBlocks.push({ type: "text", text: `\n### ${fileName}\n\n[${attachment.type} 文件，不支持内容提取（如音视频文件）]` });
      }
    }
  }

  return contentBlocks;
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

    // Build content blocks array for native document support
    const contentBlocks: ContentBlock[] = [];

    // 1. Add instructions as text block
    contentBlocks.push({ type: "text", text: prompt.instructions });

    // 2. Get and add reference files as native content blocks
    const referenceFiles = await db
      .select()
      .from(promptReferenceFiles)
      .where(eq(promptReferenceFiles.promptId, promptId));

    if (referenceFiles.length > 0) {
      contentBlocks.push({ type: "text", text: "\n\n---\n\n## 参考资料\n" });

      for (const refFile of referenceFiles) {
        const mimeType = refFile.mimeType;
        const fileName = refFile.fileName;

        if (isTextFile(mimeType, fileName)) {
          const blocks = await createTextBlock(refFile.blobUrl, fileName);
          contentBlocks.push(...blocks);
        } else if (isSupportedDocument(mimeType)) {
          const blocks = await createDocumentBlock(refFile.blobUrl, mimeType!, fileName);
          contentBlocks.push(...blocks);
        } else if (isSupportedImage(mimeType)) {
          const blocks = await createImageBlock(refFile.blobUrl, mimeType!, fileName);
          contentBlocks.push(...blocks);
        } else {
          contentBlocks.push({ type: "text", text: `\n### ${fileName}\n\n[不支持的文件类型，无法读取内容]` });
        }
      }
    }

    // 3. Add candidate materials as native content blocks
    contentBlocks.push({ type: "text", text: `\n\n---\n\n## 候选人材料 - ${candidate.name}\n` });

    if (selectedAttachmentIds && selectedAttachmentIds.length > 0) {
      const candidateBlocks = await buildContentBlocksFromSelectedAttachments(candidateId, selectedAttachmentIds);
      contentBlocks.push(...candidateBlocks);
    } else {
      contentBlocks.push({ type: "text", text: "[没有选择候选人材料]" });
    }

    // Call Claude API with streaming (required for long-running operations with high token limits)
    // Using stream to handle operations that may take longer than 10 minutes
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 32000,
      thinking: {
        type: "enabled",
        budget_tokens: 8000,
      },
      ...(stageSystemPrompt && { system: stageSystemPrompt }),
      messages: [
        {
          role: "user",
          content: contentBlocks,
        },
      ],
    });

    // Wait for the complete response
    const message = await stream.finalMessage();

    // Extract text content (skip thinking blocks from extended thinking)
    const textBlock = message.content.find((block) => block.type === "text");
    const analysisResult = textBlock && textBlock.type === "text" ? textBlock.text : "";

    // Save result as attachment
    const fileName = `${prompt.name}_${candidate.name}.md`;
    const blob = new Blob([analysisResult], { type: "text/markdown" });

    const uploadedBlob = await put(
      `candidates/${candidateId}/${stage}/${fileName}`,
      blob,
      { access: "public", addRandomSuffix: true }
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
