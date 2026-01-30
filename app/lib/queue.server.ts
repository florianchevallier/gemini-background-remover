import path from "node:path";
import { env } from "./env.server";
import { processImage } from "./watermark.server";
import {
  getProcessedFilePath,
  getUploadedFilePath,
  fileExists,
} from "./storage.server";
import { updateStatus } from "./status.server";

interface QueueItem {
  id: string;
  extension: string;
  resolve: (success: boolean) => void;
}

const queue: QueueItem[] = [];
let activeCount = 0;

export function getQueuePosition(id: string): number {
  const index = queue.findIndex((item) => item.id === id);
  return index === -1 ? 0 : index + 1;
}

export function getQueueLength(): number {
  return queue.length;
}

export function getActiveCount(): number {
  return activeCount;
}

export function enqueue(id: string, extension: string): Promise<boolean> {
  return new Promise((resolve) => {
    queue.push({ id, extension, resolve });
    updateQueuePositions();
    processNext();
  });
}

function updateQueuePositions(): void {
  for (let i = 0; i < queue.length; i++) {
    updateStatus(queue[i].id, { queuePosition: i + 1 });
  }
}

async function processNext(): Promise<void> {
  if (activeCount >= env.MAX_CONCURRENT_PROCESSES) return;
  if (queue.length === 0) return;

  const item = queue.shift()!;
  activeCount++;
  updateQueuePositions();

  updateStatus(item.id, { state: "processing" });

  const inputPath = getUploadedFilePath(item.id, item.extension);
  const outputPath = getProcessedFilePath(item.id, item.extension);

  try {
    const result = await processImage(inputPath, outputPath);

    if (result.success && (await fileExists(outputPath))) {
      updateStatus(item.id, { state: "complete" });
      item.resolve(true);
    } else {
      let errorMessage = "Processing failed.";
      if (result.timedOut) {
        errorMessage =
          "Processing timed out. Try a smaller or simpler image.";
      } else if (result.stderr) {
        errorMessage = `Processing error: ${result.stderr}`;
      }
      updateStatus(item.id, { state: "error", errorMessage });
      item.resolve(false);
    }
  } catch (err) {
    updateStatus(item.id, {
      state: "error",
      errorMessage:
        err instanceof Error ? err.message : "Unknown processing error.",
    });
    item.resolve(false);
  } finally {
    activeCount--;
    processNext();
  }
}

// Drain the queue (for graceful shutdown)
export function drain(): Promise<void> {
  return new Promise((resolve) => {
    if (activeCount === 0 && queue.length === 0) {
      resolve();
      return;
    }

    const check = setInterval(() => {
      if (activeCount === 0 && queue.length === 0) {
        clearInterval(check);
        resolve();
      }
    }, 500);

    // Force resolve after 30 seconds
    setTimeout(() => {
      clearInterval(check);
      resolve();
    }, 30_000);
  });
}
