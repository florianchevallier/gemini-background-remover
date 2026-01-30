import os from "node:os";
import path from "node:path";

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  TEMP_DIR: process.env.TEMP_DIR || path.join(os.tmpdir(), "gemini-watermark"),
  MAX_FILE_SIZE: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  MAX_CONCURRENT_PROCESSES: Number(process.env.MAX_CONCURRENT_PROCESSES) || 5,
  FILE_RETENTION_HOURS: Number(process.env.FILE_RETENTION_HOURS) || 1,
} as const;
