import { useEffect, useState, useCallback, useRef } from "react";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Button } from "~/components/ui/button";

interface ProcessingStatusProps {
  id: string;
  originalName: string;
  onComplete: (id: string) => void;
  onError: (id: string, message: string) => void;
}

interface StatusResponse {
  id: string;
  state: "pending" | "processing" | "complete" | "error";
  originalName: string;
  elapsedMs: number;
  queuePosition?: number;
  errorMessage?: string;
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

export function ProcessingStatus({
  id,
  originalName,
  onComplete,
  onError,
}: ProcessingStatusProps) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/status/${id}`);
      if (!res.ok) return;
      const data: StatusResponse = await res.json();
      setStatus(data);

      if (data.state === "complete") {
        onComplete(id);
        // Stop polling on complete
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (data.state === "error") {
        onError(id, data.errorMessage || "Processing failed");
        // Stop polling on error
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch {
      // Network error, will retry on next interval
    }
  }, [id, onComplete, onError]);

  useEffect(() => {
    poll();

    intervalRef.current = setInterval(poll, 500);
    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 90_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [poll]);

  if (timedOut && status?.state !== "complete" && status?.state !== "error") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{originalName}</p>
          <p className="text-xs text-destructive mt-1">
            Processing timed out. Please try again with a smaller image.
          </p>
        </div>
        <Badge variant="destructive">Timeout</Badge>
      </div>
    );
  }

  const state = status?.state || "pending";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{originalName}</p>
        <div className="mt-1">
          {state === "pending" && (
            <p className="text-xs text-muted-foreground">
              Waiting in queue
              {status?.queuePosition
                ? ` (position ${status.queuePosition})`
                : ""}
              ...
            </p>
          )}
          {state === "processing" && (
            <div className="space-y-1">
              <Progress className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                Processing
                {status?.elapsedMs
                  ? ` (${formatElapsed(status.elapsedMs)})`
                  : ""}
                ...
              </p>
            </div>
          )}
          {state === "complete" && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Complete
              {status?.elapsedMs
                ? ` in ${formatElapsed(status.elapsedMs)}`
                : ""}
            </p>
          )}
          {state === "error" && (
            <p className="text-xs text-destructive">
              {status?.errorMessage || "Processing failed"}
            </p>
          )}
        </div>
      </div>

      {state === "pending" && (
        <Badge variant="secondary">Queued</Badge>
      )}
      {state === "processing" && (
        <Badge variant="default" className="animate-pulse">
          Processing
        </Badge>
      )}
      {state === "complete" && (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          Done
        </Badge>
      )}
      {state === "error" && <Badge variant="destructive">Error</Badge>}
    </div>
  );
}
