import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_CONFIG } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Delete session cookie
    cookieStore.delete(AUTH_CONFIG.cookieName);

    return NextResponse.json({
      success: true,
      message: "已登出",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "登出失败" },
      { status: 500 }
    );
  }
}
