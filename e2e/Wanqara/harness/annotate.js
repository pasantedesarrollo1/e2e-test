export function annotateTicket(test, ticket) {
  test.beforeEach(async ({}, testInfo) => {
    const ws = Array.isArray(ticket.ws) ? ticket.ws.join(', ') : ticket.ws;
    const tes = Array.isArray(ticket.tes) ? ticket.tes.join(', ') : ticket.tes;

    testInfo.annotations.push(
      { type: 'ticket-ws',  description: ws },
      { type: 'ticket-tes', description: tes },
      { type: 'release',    description: ticket.release },
      { type: 'summary',    description: ticket.summary },
    );
    if (ticket.splitFrom) {
      testInfo.annotations.push(
        { type: 'split-from', description: ticket.splitFrom }
      );
    }
    if (ticket.addedToRegression) {
      testInfo.annotations.push(
        { type: 'added-to-regression', description: ticket.addedToRegression }
      );
    }
  });
}