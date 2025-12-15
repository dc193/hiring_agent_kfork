import { NextRequest, NextResponse } from "next/server";
import { db, processingJobs, attachments } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { processJob } from "@/lib/processing";

// GET /api/processing/jobs - Get jobs for an attachment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("attachmentId");
    const candidateId = searchParams.get("candidateId");
    const status = searchParams.get("status");

    let query = db
      .select({
        job: processingJobs,
        attachment: {
          id: attachments.id,
          fileName: attachments.fileName,
          type: attachments.type,
        },
      })
      .from(processingJobs)
      .leftJoin(attachments, eq(processingJobs.attachmentId, attachments.id))
      .orderBy(desc(processingJobs.createdAt));

    // Build where conditions
    const conditions = [];
    if (attachmentId) {
      conditions.push(eq(processingJobs.attachmentId, attachmentId));
    }
    if (candidateId) {
      conditions.push(eq(processingJobs.candidateId, candidateId));
    }
    if (status) {
      conditions.push(eq(processingJobs.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const jobs = await query;

    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    console.error("Failed to fetch processing jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch processing jobs" },
      { status: 500 }
    );
  }
}

// POST /api/processing/jobs - Manually trigger job processing
export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Check job exists
    const [job] = await db
      .select()
      .from(processingJobs)
      .where(eq(processingJobs.id, jobId));

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Process the job
    const success = await processJob(jobId);

    if (success) {
      // Fetch updated job
      const [updatedJob] = await db
        .select()
        .from(processingJobs)
        .where(eq(processingJobs.id, jobId));

      return NextResponse.json({ success: true, data: updatedJob });
    } else {
      return NextResponse.json(
        { success: false, error: "Job processing failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to process job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process job" },
      { status: 500 }
    );
  }
}
