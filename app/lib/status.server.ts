export type ProcessingState = "pending" | "processing" | "complete" | "error";

export interface ProcessingStatus {
  id: string;
  state: ProcessingState;
  originalName: string;
  extension: string;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  errorMessage?: string;
  queuePosition?: number;
}

const statuses = new Map<string, ProcessingStatus>();

export function createStatus(
  id: string,
  originalName: string,
  extension: string
): ProcessingStatus {
  const now = Date.now();
  const status: ProcessingStatus = {
    id,
    state: "pending",
    originalName,
    extension,
    createdAt: now,
    updatedAt: now,
  };
  statuses.set(id, status);
  return status;
}

export function updateStatus(
  id: string,
  updates: Partial<Pick<ProcessingStatus, "state" | "errorMessage" | "queuePosition">>
): ProcessingStatus | null {
  const status = statuses.get(id);
  if (!status) return null;

  const now = Date.now();

  if (updates.state === "processing" && status.state !== "processing") {
    status.startedAt = now;
  }
  if (
    updates.state === "complete" ||
    updates.state === "error"
  ) {
    status.completedAt = now;
  }

  Object.assign(status, updates, { updatedAt: now });
  return status;
}

export function getStatus(id: string): ProcessingStatus | null {
  const status = statuses.get(id);
  if (!status) return null;

  // Check expiry (1 hour)
  const maxAge = 60 * 60 * 1000;
  if (Date.now() - status.createdAt > maxAge) {
    statuses.delete(id);
    return null;
  }

  return status;
}

export function getElapsedTime(status: ProcessingStatus): number {
  if (status.state === "processing" && status.startedAt) {
    return Date.now() - status.startedAt;
  }
  if (status.completedAt && status.startedAt) {
    return status.completedAt - status.startedAt;
  }
  return 0;
}

export function cleanupExpiredStatuses(): void {
  const maxAge = 60 * 60 * 1000;
  const now = Date.now();

  for (const [id, status] of statuses) {
    if (now - status.createdAt > maxAge) {
      statuses.delete(id);
    }
  }
}
