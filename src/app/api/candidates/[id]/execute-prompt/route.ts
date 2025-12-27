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
    // Order: Reference files → Candidate materials → Instructions (RAG pattern: context first, instructions last)
    const contentBlocks: ContentBlock[] = [];

    // 1. Get and add reference files as native content blocks (knowledge base)
    const referenceFiles = await db
      .select()
      .from(promptReferenceFiles)
      .where(eq(promptReferenceFiles.promptId, promptId));

    // 🔍 DEBUG: Log reference files info
    console.log(`[DEBUG] Found ${referenceFiles.length} reference files for prompt ${promptId}`);
    referenceFiles.forEach((f, i) => {
      console.log(`[DEBUG] Reference file ${i + 1}: ${f.fileName} (${f.mimeType}, ${f.fileSize} bytes)`);
    });

    if (referenceFiles.length > 0) {
      contentBlocks.push({ type: "text", text: "# 参考资料（知识库）\n\n以下是你需要参考的模板和标准文档：\n" });

      for (const refFile of referenceFiles) {
        const mimeType = refFile.mimeType;
        const fileName = refFile.fileName;

        if (isTextFile(mimeType, fileName)) {
          const blocks = await createTextBlock(refFile.blobUrl, fileName);
          // 🔍 DEBUG: Log loaded content length
          const textContent = blocks.find(b => b.type === "text" && (b as TextBlock).text.includes(fileName)) as TextBlock | undefined;
          console.log(`[DEBUG] Loaded text file ${fileName}: ${textContent ? textContent.text.length : 0} chars`);
          contentBlocks.push(...blocks);
        } else if (isSupportedDocument(mimeType)) {
          const blocks = await createDocumentBlock(refFile.blobUrl, mimeType!, fileName);
          console.log(`[DEBUG] Loaded PDF document ${fileName}: ${blocks.length} blocks`);
          contentBlocks.push(...blocks);
        } else if (isSupportedImage(mimeType)) {
          const blocks = await createImageBlock(refFile.blobUrl, mimeType!, fileName);
          console.log(`[DEBUG] Loaded image ${fileName}: ${blocks.length} blocks`);
          contentBlocks.push(...blocks);
        } else {
          console.log(`[DEBUG] Unsupported file type: ${fileName} (${mimeType})`);
          contentBlocks.push({ type: "text", text: `\n### ${fileName}\n\n[不支持的文件类型，无法读取内容]` });
        }
      }
    } else {
      console.log(`[DEBUG] ⚠️ No reference files found for this prompt!`);
    }

    // 2. Add candidate materials as native content blocks
    contentBlocks.push({ type: "text", text: `\n\n---\n\n# 候选人材料 - ${candidate.name}\n\n以下是需要分析的候选人资料：\n` });

    if (selectedAttachmentIds && selectedAttachmentIds.length > 0) {
      const candidateBlocks = await buildContentBlocksFromSelectedAttachments(candidateId, selectedAttachmentIds);
      contentBlocks.push(...candidateBlocks);
    } else {
      contentBlocks.push({ type: "text", text: "[没有选择候选人材料]" });
    }

    // 3. Add a simple prompt at the end of user message
    contentBlocks.push({ type: "text", text: `\n\n---\n\n请根据上述参考资料和候选人材料，按照系统指令完成所有任务。` });

    // Build system prompt: combine stage system prompt + main instructions (like Claude Projects)
    // This gives instructions higher priority than putting them in user message
    const systemPromptParts: string[] = [];

    // Add stage-level system prompt if exists (shared settings across prompts)
    if (stageSystemPrompt) {
      systemPromptParts.push(stageSystemPrompt);
    }

    // Add main instructions (this is the key change - instructions go in system prompt)
    systemPromptParts.push(`# 任务指令\n\n${prompt.instructions}\n\n请确保完成指令中要求的所有任务，包括生成候选人画像和面试问题。不要遗漏任何部分。`);

    const fullSystemPrompt = systemPromptParts.join("\n\n---\n\n");

    console.log(`[DEBUG] System prompt length: ${fullSystemPrompt.length} chars`);

    // Call Claude API with streaming (required for long-running operations with high token limits)
    // Using stream to handle operations that may take longer than 10 minutes
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 32000,
      system: fullSystemPrompt,
      messages: [
        {
          role: "user",
          content: contentBlocks,
        },
      ],
    });

    // Wait for the complete response
    const message = await stream.finalMessage();

    // 🔍 DEBUG: Log response metadata
    console.log(`[DEBUG] API Response:`);
    console.log(`[DEBUG]   - stop_reason: ${message.stop_reason}`);
    console.log(`[DEBUG]   - input_tokens: ${message.usage.input_tokens}`);
    console.log(`[DEBUG]   - output_tokens: ${message.usage.output_tokens}`);
    console.log(`[DEBUG]   - content blocks: ${message.content.length}`);
    message.content.forEach((block, i) => {
      console.log(`[DEBUG]   - block ${i + 1}: type=${block.type}, length=${block.type === "text" ? block.text.length : "N/A"}`);
    });

    // Check if output was truncated
    if (message.stop_reason === "max_tokens") {
      console.log(`[DEBUG] ⚠️ WARNING: Output was truncated due to max_tokens limit!`);
    }

    // Extract ALL text content (in case there are multiple text blocks)
    const textBlocks = message.content.filter(block => block.type === "text") as Array<{ type: "text"; text: string }>;
    const analysisResult = textBlocks.map(b => b.text).join("\n\n");

    console.log(`[DEBUG] Final result length: ${analysisResult.length} chars`);

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
