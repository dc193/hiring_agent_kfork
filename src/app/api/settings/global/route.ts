import { NextRequest, NextResponse } from "next/server";
import { db, globalSettings, GLOBAL_SETTING_KEYS } from "@/db";
import { eq } from "drizzle-orm";

// GET /api/settings/global - Get all global settings
export async function GET() {
  try {
    const settings = await db.select().from(globalSettings);

    // Convert to key-value map
    const settingsMap: Record<string, string | null> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error) {
    // Table might not exist yet
    if (error && typeof error === "object") {
      const err = error as { code?: string; message?: string };
      if (err.code === "42P01" || err.message?.includes("does not exist")) {
        return NextResponse.json({ success: true, data: {} });
      }
    }
    console.error("Failed to fetch global settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/global - Update a global setting
export async function PUT(request: NextRequest) {
  try {
    const { key, value, description } = await request.json();

    if (!key) {
      return NextResponse.json(
        { success: false, error: "Key is required" },
        { status: 400 }
      );
    }

    // Check if setting exists
    const [existing] = await db
      .select()
      .from(globalSettings)
      .where(eq(globalSettings.key, key));

    if (existing) {
      // Update existing setting
      await db
        .update(globalSettings)
        .set({
          value,
          description: description || existing.description,
          updatedAt: new Date(),
        })
        .where(eq(globalSettings.key, key));
    } else {
      // Insert new setting
      await db.insert(globalSettings).values({
        key,
        value,
        description,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update global setting:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
