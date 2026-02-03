import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Parse client payload
        const payload = clientPayload ? JSON.parse(clientPayload) : {};

        return {
          // Allow any content type
          allowedContentTypes: [
            // Documents
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            // Text
            "text/plain",
            "text/markdown",
            "text/csv",
            "application/json",
            // Media
            "audio/*",
            "video/*",
            "image/*",
            // Archives
            "application/zip",
            "application/x-rar-compressed",
            // Any other
            "application/octet-stream",
          ],
          // Don't add random suffix, keep original filename
          addRandomSuffix: true,
          // Pass along any token payload for onUploadCompleted
          tokenPayload: JSON.stringify(payload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This callback won't work on localhost (needs ngrok or similar)
        // We'll handle database insertion on the client side after upload completes
        console.log("Upload completed:", blob.url);
        if (tokenPayload) {
          console.log("Token payload:", tokenPayload);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
