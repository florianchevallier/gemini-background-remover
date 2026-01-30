import {
  generateFileId,
  isValidImageExtension,
  isValidMimeType,
  saveUploadedFile,
} from "~/lib/storage.server";
import { createStatus } from "~/lib/status.server";
import { enqueue } from "~/lib/queue.server";
import { env } from "~/lib/env.server";
import path from "node:path";

export async function action({ request }: { request: Request }) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return Response.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return Response.json(
        { error: "Maximum 10 files per upload. Please reduce the batch size." },
        { status: 400 }
      );
    }

    const results: Array<{
      id: string;
      originalName: string;
      size: number;
      status: "accepted" | "rejected";
      error?: string;
    }> = [];

    for (const file of files) {
      if (!(file instanceof File) || !file.name) {
        results.push({
          id: "",
          originalName: "unknown",
          size: 0,
          status: "rejected",
          error: "Invalid file",
        });
        continue;
      }

      // Validate file extension
      if (!isValidImageExtension(file.name)) {
        results.push({
          id: "",
          originalName: file.name,
          size: file.size,
          status: "rejected",
          error:
            "Unsupported file type. Supported formats: JPG, JPEG, PNG, WebP, GIF",
        });
        continue;
      }

      // Validate MIME type
      if (!isValidMimeType(file.type)) {
        results.push({
          id: "",
          originalName: file.name,
          size: file.size,
          status: "rejected",
          error: "Invalid MIME type. File does not appear to be an image.",
        });
        continue;
      }

      // Validate file size
      if (file.size > env.MAX_FILE_SIZE) {
        const maxMB = Math.round(env.MAX_FILE_SIZE / (1024 * 1024));
        const fileMB = (file.size / (1024 * 1024)).toFixed(1);
        results.push({
          id: "",
          originalName: file.name,
          size: file.size,
          status: "rejected",
          error: `File too large (${fileMB}MB). Maximum size is ${maxMB}MB.`,
        });
        continue;
      }

      const fileId = generateFileId();
      const buffer = Buffer.from(await file.arrayBuffer());
      await saveUploadedFile(buffer, file.name, fileId);

      const ext = path.extname(file.name).toLowerCase();
      createStatus(fileId, file.name, ext);

      // Enqueue for processing (fire-and-forget)
      enqueue(fileId, ext);

      results.push({
        id: fileId,
        originalName: file.name,
        size: file.size,
        status: "accepted",
      });
    }

    return Response.json({ results });
  } catch (err) {
    console.error("[upload] Error:", err);
    return Response.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
