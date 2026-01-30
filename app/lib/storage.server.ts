import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "./env.server";

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]);

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isValidImageExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function generateFileId(): string {
  return randomUUID();
}

async function ensureTempDir(): Promise<void> {
  await fsp.mkdir(env.TEMP_DIR, { recursive: true });
}

export async function saveUploadedFile(
  data: Buffer,
  originalFilename: string,
  fileId: string
): Promise<{ id: string; path: string; originalName: string }> {
  await ensureTempDir();

  const ext = path.extname(originalFilename).toLowerCase();
  const filename = `${fileId}${ext}`;
  const filePath = path.join(env.TEMP_DIR, filename);

  await fsp.writeFile(filePath, data);

  return { id: fileId, path: filePath, originalName: originalFilename };
}

export function getUploadedFilePath(
  fileId: string,
  extension: string
): string {
  return path.join(env.TEMP_DIR, `${fileId}${extension}`);
}

export function getProcessedFilePath(
  fileId: string,
  extension: string
): string {
  return path.join(env.TEMP_DIR, `${fileId}_processed${extension}`);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fsp.stat(filePath);
  return stats.size;
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fsp.unlink(filePath);
  } catch {
    // File may already be deleted
  }
}

export async function cleanupOldFiles(): Promise<number> {
  await ensureTempDir();

  const maxAge = env.FILE_RETENTION_HOURS * 60 * 60 * 1000;
  const now = Date.now();
  let cleaned = 0;

  try {
    const files = await fsp.readdir(env.TEMP_DIR);

    for (const file of files) {
      const filePath = path.join(env.TEMP_DIR, file);
      try {
        const stats = await fsp.stat(filePath);
        if (now - stats.mtimeMs > maxAge) {
          await fsp.unlink(filePath);
          cleaned++;
        }
      } catch {
        // Skip files that can't be stat'd
      }
    }
  } catch {
    // Directory might not exist yet
  }

  return cleaned;
}

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function startCleanupJob(): void {
  if (cleanupInterval) return;

  // Run cleanup every 15 minutes
  cleanupInterval = setInterval(
    async () => {
      const cleaned = await cleanupOldFiles();
      if (cleaned > 0) {
        console.log(`[cleanup] Removed ${cleaned} expired files`);
      }
    },
    15 * 60 * 1000
  );

  // Run immediately on startup
  cleanupOldFiles().then((cleaned) => {
    if (cleaned > 0) {
      console.log(`[cleanup] Startup: removed ${cleaned} stale files`);
    }
  });
}

export function stopCleanupJob(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
