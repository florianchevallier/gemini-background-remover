import archiver from "archiver";
import path from "node:path";
import { PassThrough } from "node:stream";
import { getStatus } from "~/lib/status.server";
import { getProcessedFilePath, fileExists } from "~/lib/storage.server";

export async function action({ request }: { request: Request }) {
  const body = await request.json();
  const ids: string[] = body.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return Response.json(
      { error: "No file IDs provided" },
      { status: 400 }
    );
  }

  // Verify all files exist
  const filesToInclude: Array<{
    path: string;
    name: string;
  }> = [];

  for (const id of ids) {
    const status = getStatus(id);
    if (!status || status.state !== "complete") continue;

    const filePath = getProcessedFilePath(id, status.extension);
    if (await fileExists(filePath)) {
      const originalBase = path.basename(
        status.originalName,
        path.extname(status.originalName)
      );
      filesToInclude.push({
        path: filePath,
        name: `${originalBase}_nowatermark${status.extension}`,
      });
    }
  }

  if (filesToInclude.length === 0) {
    return Response.json(
      { error: "No processed files available for download" },
      { status: 404 }
    );
  }

  const archive = archiver("zip", { zlib: { level: 5 } });
  const passthrough = new PassThrough();

  archive.pipe(passthrough);

  for (const file of filesToInclude) {
    archive.file(file.path, { name: file.name });
  }

  archive.finalize();

  const webStream = new ReadableStream({
    start(controller) {
      passthrough.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      passthrough.on("end", () => controller.close());
      passthrough.on("error", (err) => controller.error(err));
    },
    cancel() {
      archive.abort();
      passthrough.destroy();
    },
  });

  const timestamp = new Date().toISOString().split("T")[0];

  console.log(
    `[download] Serving batch ZIP with ${filesToInclude.length} files`
  );

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="gemini_processed_${timestamp}.zip"`,
      "Cache-Control": "no-cache",
    },
  });
}
