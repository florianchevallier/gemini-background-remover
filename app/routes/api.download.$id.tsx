import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { getStatus } from "~/lib/status.server";
import { getProcessedFilePath, fileExists } from "~/lib/storage.server";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function loader({ params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) {
    return Response.json({ error: "Missing ID" }, { status: 400 });
  }

  const status = getStatus(id);
  if (!status) {
    return Response.json(
      { error: "File not found or expired" },
      { status: 404 }
    );
  }

  if (status.state !== "complete") {
    return Response.json(
      { error: "Image is not yet processed" },
      { status: 400 }
    );
  }

  const filePath = getProcessedFilePath(id, status.extension);
  if (!(await fileExists(filePath))) {
    return Response.json(
      { error: "Processed file no longer available" },
      { status: 404 }
    );
  }

  const stat = await fsp.stat(filePath);
  const contentType = MIME_TYPES[status.extension] || "application/octet-stream";

  // Generate download filename: originalname_nowatermark.ext
  const originalBase = path.basename(
    status.originalName,
    path.extname(status.originalName)
  );
  const downloadName = `${originalBase}_nowatermark${status.extension}`;

  const stream = fs.createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });

  console.log(`[download] Serving ${downloadName} (${stat.size} bytes)`);

  return new Response(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Content-Length": stat.size.toString(),
      "Cache-Control": "no-cache",
    },
  });
}
