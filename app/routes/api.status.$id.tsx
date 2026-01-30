import { getStatus, getElapsedTime } from "~/lib/status.server";
import { getQueuePosition } from "~/lib/queue.server";

export async function loader({ params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) {
    return Response.json({ error: "Missing ID" }, { status: 400 });
  }

  const status = getStatus(id);
  if (!status) {
    return Response.json(
      { error: "Processing ID not found or expired" },
      { status: 404 }
    );
  }

  const elapsed = getElapsedTime(status);
  const queuePosition =
    status.state === "pending" ? getQueuePosition(id) : undefined;

  return Response.json(
    {
      id: status.id,
      state: status.state,
      originalName: status.originalName,
      elapsedMs: elapsed,
      queuePosition,
      errorMessage: status.errorMessage,
    },
    {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
