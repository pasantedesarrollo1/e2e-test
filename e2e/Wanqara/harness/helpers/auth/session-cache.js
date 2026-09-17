import fs from "node:fs";

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
