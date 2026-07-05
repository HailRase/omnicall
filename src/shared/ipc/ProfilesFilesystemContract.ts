export type ProfilesFilesystemOperation =
  | Readonly<{ op: "ensureDirectory"; directoryPath: string }>
  | Readonly<{ op: "readTextFile"; filePath: string }>
  | Readonly<{ op: "writeTextFileAtomic"; filePath: string; contents: string }>
  | Readonly<{ op: "listFiles"; directoryPath: string }>;

export type ProfilesFilesystemResponse = Readonly<{
  ok: boolean;
  contents?: string | null;
  files?: ReadonlyArray<string>;
  reason?: string;
}>;

/**
 * - Purpose: validate profiles filesystem IPC request at preload boundary.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed filesystem operation or null when invalid.
 */
export function parseProfilesFilesystemOperation(
  value: unknown,
): ProfilesFilesystemOperation | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const op = candidate["op"];
  if (typeof op !== "string") {
    return null;
  }

  switch (op) {
    case "ensureDirectory": {
      const directoryPath = candidate["directoryPath"];
      if (typeof directoryPath !== "string" || directoryPath.trim().length === 0) {
        return null;
      }
      return { op, directoryPath: directoryPath.trim() };
    }
    case "readTextFile": {
      const filePath = candidate["filePath"];
      if (typeof filePath !== "string" || filePath.trim().length === 0) {
        return null;
      }
      return { op, filePath: filePath.trim() };
    }
    case "writeTextFileAtomic": {
      const filePath = candidate["filePath"];
      const contents = candidate["contents"];
      if (typeof filePath !== "string" || filePath.trim().length === 0) {
        return null;
      }
      if (typeof contents !== "string") {
        return null;
      }
      return { op, filePath: filePath.trim(), contents };
    }
    case "listFiles": {
      const directoryPath = candidate["directoryPath"];
      if (typeof directoryPath !== "string" || directoryPath.trim().length === 0) {
        return null;
      }
      return { op, directoryPath: directoryPath.trim() };
    }
    default:
      return null;
  }
}

/**
 * - Purpose: validate profiles filesystem IPC response at preload boundary.
 * - Inputs: unknown IPC response payload.
 * - Outputs: typed response or null when invalid.
 */
export function parseProfilesFilesystemResponse(
  value: unknown,
): ProfilesFilesystemResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const ok = candidate["ok"];
  if (typeof ok !== "boolean") {
    return null;
  }

  if (!ok) {
    const reason = candidate["reason"];
    return {
      ok: false,
      reason: typeof reason === "string" ? reason : "filesystem_error",
    };
  }

  const contents = candidate["contents"];
  const files = candidate["files"];
  const response: ProfilesFilesystemResponse = { ok: true };

  if (contents === null || typeof contents === "string") {
    return { ...response, contents };
  }

  if (Array.isArray(files) && files.every((entry) => typeof entry === "string")) {
    return { ...response, files };
  }

  if (contents === undefined && files === undefined) {
    return response;
  }

  return null;
}
