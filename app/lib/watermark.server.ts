import { spawn } from "node:child_process";
import fsp from "node:fs/promises";
import which from "which";
import { copyFile } from "node:fs/promises";

const BINARY_NAME = "GeminiWatermarkTool";
const TIMEOUT_MS = 60_000;

let binaryPath: string | null = null;
let verificationPromise: Promise<boolean> | null = null;

export async function verifyBinary(): Promise<boolean> {
  try {
    binaryPath = await which(BINARY_NAME);
    console.log(`[watermark] Binary found at: ${binaryPath}`);
    return true;
  } catch {
    // Try common paths
    const candidates = [
      "/usr/local/bin/GeminiWatermarkTool",
      "/usr/bin/GeminiWatermarkTool",
      "./GeminiWatermarkTool",
    ];

    for (const candidate of candidates) {
      try {
        await fsp.access(candidate);
        binaryPath = candidate;
        console.log(`[watermark] Binary found at: ${binaryPath}`);
        return true;
      } catch {
        // Try next
      }
    }

    console.warn(
      `[watermark] Binary not found. Processing will fail until ${BINARY_NAME} is installed.`
    );
    return false;
  }
}

export interface ProcessResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

export async function processImage(
  inputPath: string,
  outputPath: string
): Promise<ProcessResult> {
  // Ensure binary is verified before first use
  if (!binaryPath && !verificationPromise) {
    verificationPromise = verifyBinary();
  }
  if (verificationPromise) {
    await verificationPromise;
    verificationPromise = null;
  }

  if (!binaryPath) {
    return {
      success: false,
      stdout: "",
      stderr: `${BINARY_NAME} binary not found. Ensure it is installed.`,
      exitCode: null,
      timedOut: false,
    };
  }

  // Copy input to output first (binary does in-place edit)
  try {
    await copyFile(inputPath, outputPath);
    console.log(`[watermark] Copied ${inputPath} to ${outputPath}`);
  } catch (err) {
    return {
      success: false,
      stdout: "",
      stderr: `Failed to copy file: ${err instanceof Error ? err.message : "Unknown error"}`,
      exitCode: null,
      timedOut: false,
    };
  }

  console.log(`[watermark] Processing: ${outputPath} (in-place)`);
  console.log(`[watermark] Command: ${binaryPath} ${outputPath}`);

  return new Promise((resolve) => {
    const child = spawn(binaryPath!, [outputPath]);

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!settled) child.kill("SIGKILL");
      }, 5000);
    }, TIMEOUT_MS);

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (exitCode) => {
      settled = true;
      clearTimeout(timer);
      console.log(`[watermark] Process exited with code: ${exitCode}`);
      console.log(`[watermark] stdout: ${stdout}`);
      console.log(`[watermark] stderr: ${stderr}`);
      resolve({
        success: exitCode === 0 && !timedOut,
        stdout,
        stderr,
        exitCode,
        timedOut,
      });
    });

    child.on("error", (err) => {
      settled = true;
      clearTimeout(timer);
      resolve({
        success: false,
        stdout,
        stderr: err.message,
        exitCode: null,
        timedOut: false,
      });
    });
  });
}

// Auto-verify binary on module load
verifyBinary().catch((err) => {
  console.error("[watermark] Failed to verify binary on startup:", err);
});
