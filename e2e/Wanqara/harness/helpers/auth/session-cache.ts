import fs from "node:fs";

/**
 * Checks if a session file is fresh based on its modification time and contents.
 * 
 * @param sessionPath - The absolute path to the session JSON file
 * @param maxAgeMs - The maximum allowed age in milliseconds (defaults to 1 hour)
 * @returns True if the session exists, is within the time limit, and contains valid cookies/origins
 * 
 * @example
 * ```typescript
 * const isValid = isSessionFresh('/path/to/session.json', 3600_000);
 * ```
 */
export function isSessionFresh(sessionPath: string, maxAgeMs: number = 3600_000): boolean {
  if (!fs.existsSync(sessionPath)) {
    return false;
  }

  try {
    const stats = fs.statSync(sessionPath);
    const isWithinTimeLimit = (Date.now() - stats.mtimeMs) < maxAgeMs;
    
    if (!isWithinTimeLimit) {
      return false;
    }

    const content = JSON.parse(fs.readFileSync(sessionPath, 'utf8')) as {
      cookies?: unknown[];
      origins?: unknown[];
    };
    
    const hasCookies = Array.isArray(content.cookies) && content.cookies.length > 0;
    const hasOrigins = Array.isArray(content.origins) && content.origins.length > 0;

    return hasCookies || hasOrigins;
  } catch {
    return false;
  }
}
