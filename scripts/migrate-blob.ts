/**
 * Blob Migration Script
 *
 * 迁移 Vercel Blob 数据从旧项目到新项目
 *
 * 使用方法:
 * 1. 设置环境变量:
 *    - OLD_BLOB_TOKEN: 旧项目的 BLOB_READ_WRITE_TOKEN
 *    - NEW_BLOB_TOKEN: 新项目的 BLOB_READ_WRITE_TOKEN
 *    - DATABASE_URL: 数据库连接
 *
 * 2. 运行: npx tsx scripts/migrate-blob.ts
 */

import { put } from "@vercel/blob";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";

// 简化的表定义（只需要迁移用到的字段）
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

const referenceFiles = pgTable("reference_files", {
  id: uuid("id").primaryKey(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  blobUrl: varchar("blob_url", { length: 1000 }).notNull(),
});

const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  blobUrl: varchar("blob_url", { length: 1000 }).notNull(),
});

async function migrateBlob() {
  const OLD_BLOB_TOKEN = process.env.OLD_BLOB_TOKEN;
  const NEW_BLOB_TOKEN = process.env.NEW_BLOB_TOKEN;
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!OLD_BLOB_TOKEN || !NEW_BLOB_TOKEN || !DATABASE_URL) {
    console.error("缺少环境变量！需要设置:");
    console.error("  - OLD_BLOB_TOKEN: 旧项目的 BLOB_READ_WRITE_TOKEN");
    console.error("  - NEW_BLOB_TOKEN: 新项目的 BLOB_READ_WRITE_TOKEN");
    console.error("  - DATABASE_URL: 数据库连接");
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);

  console.log("开始迁移 Blob 数据...\n");

  // 迁移 reference_files
  console.log("=== 迁移 reference_files ===");
  const refFiles = await db.select().from(referenceFiles);
  console.log(`找到 ${refFiles.length} 个参考文件`);

  for (const file of refFiles) {
    try {
      console.log(`迁移: ${file.fileName}`);

      // 下载旧文件
      const response = await fetch(file.blobUrl);
      if (!response.ok) {
        console.error(`  ❌ 下载失败: ${response.status}`);
        continue;
      }
      const blob = await response.blob();

      // 上传到新 Blob（使用新 token）
      const newBlob = await put(file.fileName, blob, {
        access: "public",
        token: NEW_BLOB_TOKEN,
      });

      // 更新数据库
      await db.update(referenceFiles)
        .set({ blobUrl: newBlob.url })
        .where(eq(referenceFiles.id, file.id));

      console.log(`  ✅ 完成: ${newBlob.url}`);
    } catch (error) {
      console.error(`  ❌ 错误: ${error}`);
    }
  }

  // 迁移 attachments
  console.log("\n=== 迁移 attachments ===");
  const attachmentFiles = await db.select().from(attachments);
  console.log(`找到 ${attachmentFiles.length} 个附件`);

  for (const file of attachmentFiles) {
    try {
      console.log(`迁移: ${file.fileName}`);

      // 下载旧文件
      const response = await fetch(file.blobUrl);
      if (!response.ok) {
        console.error(`  ❌ 下载失败: ${response.status}`);
        continue;
      }
      const blob = await response.blob();

      // 上传到新 Blob
      const newBlob = await put(file.fileName, blob, {
        access: "public",
        token: NEW_BLOB_TOKEN,
      });

      // 更新数据库
      await db.update(attachments)
        .set({ blobUrl: newBlob.url })
        .where(eq(attachments.id, file.id));

      console.log(`  ✅ 完成: ${newBlob.url}`);
    } catch (error) {
      console.error(`  ❌ 错误: ${error}`);
    }
  }

  console.log("\n🎉 迁移完成！");
}

migrateBlob().catch(console.error);
