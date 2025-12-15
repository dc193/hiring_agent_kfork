import { db, pipelineStageConfigs, processingJobs, attachments, candidates } from "@/db";
import { eq, and } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

interface ProcessingRule {
  fileType: string;
  autoTranscribe: boolean;
  autoAnalyze: boolean;
  analysisPrompt: string;
  outputType: string;
  outputTemplate?: string;
}

// Check if a file type matches a processing rule
function matchesFileType(mimeType: string | null, ruleFileType: string): boolean {
  if (!mimeType) return false;

  const mimeToType: Record<string, string[]> = {
    recording: ["audio/", "video/"],
    transcript: ["text/plain", "text/"],
    homework: ["application/pdf", "text/", "application/zip"],
    note: ["text/plain", "text/markdown", "application/"],
    resume: ["application/pdf", "application/msword", "application/vnd.openxmlformats"],
    other: ["*"],
  };

  const patterns = mimeToType[ruleFileType] || ["*"];
  return patterns.some((pattern) => {
    if (pattern === "*") return true;
    return mimeType.startsWith(pattern);
  });
}

// Get processing rules for a stage
export async function getProcessingRules(stage: string): Promise<ProcessingRule[]> {
  try {
    const [config] = await db
      .select()
      .from(pipelineStageConfigs)
      .where(eq(pipelineStageConfigs.stage, stage));

    return config?.processingRules || [];
  } catch (error) {
    console.error("Error fetching processing rules:", error);
    return [];
  }
}

// Find matching processing rule for a file
export function findMatchingRule(
  rules: ProcessingRule[],
  mimeType: string | null,
  attachmentType: string
): ProcessingRule | null {
  // First try to match by attachment type
  const byType = rules.find((rule) => rule.fileType === attachmentType);
  if (byType) return byType;

  // Then try to match by MIME type
  return rules.find((rule) => matchesFileType(mimeType, rule.fileType)) || null;
}

// Create processing jobs for an attachment
export async function createProcessingJobs(
  attachmentId: string,
  candidateId: string,
  pipelineStage: string,
  mimeType: string | null,
  attachmentType: string
): Promise<string[]> {
  const rules = await getProcessingRules(pipelineStage);
  const matchingRule = findMatchingRule(rules, mimeType, attachmentType);

  if (!matchingRule) {
    console.log("No matching processing rule found");
    return [];
  }

  const jobIds: string[] = [];

  // Create transcription job if needed
  if (matchingRule.autoTranscribe && mimeType?.startsWith("audio/") || mimeType?.startsWith("video/")) {
    const [job] = await db
      .insert(processingJobs)
      .values({
        attachmentId,
        candidateId,
        pipelineStage,
        jobType: "transcribe",
        status: "pending",
        config: {
          options: { language: "auto" },
        },
      })
      .returning();
    jobIds.push(job.id);
  }

  // Create analysis job if needed
  if (matchingRule.autoAnalyze) {
    const [job] = await db
      .insert(processingJobs)
      .values({
        attachmentId,
        candidateId,
        pipelineStage,
        jobType: "analyze",
        status: "pending",
        config: {
          prompt: matchingRule.analysisPrompt,
        },
        inputData: {
          outputType: matchingRule.outputType,
        },
      })
      .returning();
    jobIds.push(job.id);
  }

  return jobIds;
}

// Process a single job
export async function processJob(jobId: string): Promise<boolean> {
  const [job] = await db
    .select()
    .from(processingJobs)
    .where(eq(processingJobs.id, jobId));

  if (!job) {
    console.error("Job not found:", jobId);
    return false;
  }

  // Mark as processing
  await db
    .update(processingJobs)
    .set({
      status: "processing",
      startedAt: new Date(),
    })
    .where(eq(processingJobs.id, jobId));

  try {
    // Get attachment and candidate info
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, job.attachmentId));

    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, job.candidateId));

    if (!attachment || !candidate) {
      throw new Error("Attachment or candidate not found");
    }

    let result: Record<string, unknown> = {};

    if (job.jobType === "transcribe") {
      // For now, just mark as needing manual transcription
      // In production, you'd integrate with a transcription service
      result = {
        status: "requires_manual",
        message: "自动转录功能待集成，请手动上传转录文本",
      };
    } else if (job.jobType === "analyze") {
      // Run AI analysis
      const config = job.config as { prompt?: string } | null;
      const inputData = job.inputData as { outputType?: string } | null;
      const outputType = inputData?.outputType;
      if (config?.prompt) {
        // Replace variables in prompt (except {content} which might not be needed)
        const basePrompt = config.prompt
          .replace("{candidate_name}", candidate.name)
          .replace("{stage}", job.pipelineStage)
          .replace("{file_name}", attachment.fileName);

        // Call Claude API
        const anthropic = new Anthropic();
        let message;

        // Check if this is a PDF file - use document support
        if (attachment.mimeType === "application/pdf") {
          // Fetch PDF as base64
          const response = await fetch(attachment.blobUrl);
          const arrayBuffer = await response.arrayBuffer();
          const base64Data = Buffer.from(arrayBuffer).toString("base64");

          // Use Claude's document support
          message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "document",
                    source: {
                      type: "base64",
                      media_type: "application/pdf",
                      data: base64Data,
                    },
                  },
                  {
                    type: "text",
                    text: basePrompt.replace("{content}", "请分析上面的PDF文档内容"),
                  },
                ],
              },
            ],
          });
        } else if (attachment.mimeType?.startsWith("text/") || attachment.mimeType === "application/json") {
          // Text files - fetch and include content
          let content = "";
          try {
            const response = await fetch(attachment.blobUrl);
            content = await response.text();
          } catch {
            content = "[无法读取文件内容]";
          }

          const prompt = basePrompt.replace("{content}", content);
          message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          });
        } else if (attachment.mimeType?.startsWith("image/")) {
          // Image files - use vision support
          const response = await fetch(attachment.blobUrl);
          const arrayBuffer = await response.arrayBuffer();
          const base64Data = Buffer.from(arrayBuffer).toString("base64");

          message = await anthropic.messages.create({
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
                      media_type: attachment.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                      data: base64Data,
                    },
                  },
                  {
                    type: "text",
                    text: basePrompt.replace("{content}", "请分析上面的图片内容"),
                  },
                ],
              },
            ],
          });
        } else {
          // Unsupported file type
          const prompt = basePrompt.replace("{content}", `[文件类型: ${attachment.mimeType}，暂不支持直接分析，请先转换为PDF或文本格式]`);
          message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          });
        }

        const analysisResult =
          message.content[0].type === "text" ? message.content[0].text : "";

        result = {
          analysis: analysisResult,
          outputType,
          model: "claude-sonnet-4-20250514",
          timestamp: new Date().toISOString(),
        };

        // If output type is report or note, create a new attachment
        if (outputType === "report" || outputType === "note") {
          const reportFileName = `AI分析报告_${attachment.fileName}_${Date.now()}.md`;

          // Create a blob from the analysis result
          const blob = new Blob([analysisResult], { type: "text/markdown" });

          // Upload to Vercel Blob
          const { put } = await import("@vercel/blob");
          const uploadedBlob = await put(
            `candidates/${job.candidateId}/${job.pipelineStage}/${reportFileName}`,
            blob,
            { access: "public" }
          );

          // Save as new attachment
          const [reportAttachment] = await db
            .insert(attachments)
            .values({
              candidateId: job.candidateId,
              pipelineStage: job.pipelineStage,
              type: outputType === "report" ? "note" : outputType,
              fileName: reportFileName,
              fileSize: blob.size,
              mimeType: "text/markdown",
              blobUrl: uploadedBlob.url,
              description: `AI自动生成的分析报告 - 基于 ${attachment.fileName}`,
            })
            .returning();

          // Update job with result attachment
          await db
            .update(processingJobs)
            .set({ resultAttachmentId: reportAttachment.id })
            .where(eq(processingJobs.id, jobId));

          result.reportAttachmentId = reportAttachment.id;
        }
      }
    }

    // Mark as completed
    await db
      .update(processingJobs)
      .set({
        status: "completed",
        progress: 100,
        outputData: result,
        completedAt: new Date(),
      })
      .where(eq(processingJobs.id, jobId));

    return true;
  } catch (error) {
    console.error("Error processing job:", error);

    // Mark as failed
    await db
      .update(processingJobs)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(processingJobs.id, jobId));

    return false;
  }
}

// Process all pending jobs for an attachment
export async function processAttachmentJobs(attachmentId: string): Promise<void> {
  const jobs = await db
    .select()
    .from(processingJobs)
    .where(
      and(
        eq(processingJobs.attachmentId, attachmentId),
        eq(processingJobs.status, "pending")
      )
    );

  for (const job of jobs) {
    await processJob(job.id);
  }
}
