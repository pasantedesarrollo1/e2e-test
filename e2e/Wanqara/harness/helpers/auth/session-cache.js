import fs from "node:fs";

/**
 * Validates if a session file is present, fresh (within maxAgeMs), and contains valid auth data.
 * Protected Variations (GRASP): Encapsulates session validation logic to protect against token expiration changes.
 * 
 * @param {string} sessionPath - The absolute path to the session storage JSON file.
 * @param {number} maxAgeMs - Maximum allowed age of the session in milliseconds (default: 1 hour).
 * @returns {boolean} True if the session is valid and fresh, false otherwise.
 */
export function isSessionFresh(sessionPath, maxAgeMs = 3600_000) {
  if (!fs.existsSync(sessionPath)) {
    return false;
  }

  try {
    const stats = fs.statSync(sessionPath);
    const isWithinTimeLimit = (Date.now() - stats.mtimeMs) < maxAgeMs;
    
    if (!isWithinTimeLimit) {
      return false;
    }

    const content = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    const hasCookies = content.cookies && content.cookies.length > 0;
    const hasOrigins = content.origins && content.origins.length > 0;

    return hasCookies || hasOrigins;
  } catch {
    return false;
  }
}
