import type { TestType } from '@playwright/test';

/**
 * Metadata for a QA execution ticket.
 */
export interface TicketMetadata {
  /** Workspace ticket ID(s) */
  ws?: string | string[];
  /** Test execution ticket ID(s) */
  tes?: string | string[];
  /** Target release version */
  release?: string;
  /** Brief summary of the ticket/test */
  summary?: string;
  /** Indicates if this test was split from another ticket */
  splitFrom?: string;
  /** Indicates if this was added to the regression suite */
  addedToRegression?: boolean | string;
}

/**
 * Injects ticket metadata annotations into the Playwright test report.
 * This runs in a `beforeEach` hook.
 *
 * @param test - The Playwright test object
 * @param ticket - The ticket metadata to inject
 * 
 * @example
 * ```typescript
 * import { test } from '@playwright/test';
 * annotateTicket(test, { ws: 'WS-1234', release: 'v1.2.0' });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function annotateTicket(test: TestType<any, any>, ticket: TicketMetadata): void {
   
  test.beforeEach(({}, testInfo) => {
    const ws = Array.isArray(ticket.ws) ? ticket.ws.join(', ') : (ticket.ws ?? '');
    const tes = Array.isArray(ticket.tes) ? ticket.tes.join(', ') : (ticket.tes ?? '');

    if (ticket.ws) {
      testInfo.annotations.push({ type: 'ticket-ws', description: ws });
    }
    if (ticket.tes) {
      testInfo.annotations.push({ type: 'ticket-tes', description: tes });
    }
    if (ticket.release) {
      testInfo.annotations.push({ type: 'release', description: ticket.release });
    }
    if (ticket.summary) {
      testInfo.annotations.push({ type: 'summary', description: ticket.summary });
    }
    if (ticket.splitFrom) {
      testInfo.annotations.push({ type: 'split-from', description: ticket.splitFrom });
    }
    if (ticket.addedToRegression !== undefined) {
      testInfo.annotations.push({ 
        type: 'added-to-regression', 
        description: String(ticket.addedToRegression) 
      });
    }
  });
}
