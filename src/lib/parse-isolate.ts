/**
 * Parse optional `isolate` flag from API request bodies.
 * Omitted or false → keep on skin (default). Must be boolean when present.
 */
export function parseIsolateFlag(value: unknown): boolean | null {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value !== "boolean") {
    return null;
  }
  return value;
}
