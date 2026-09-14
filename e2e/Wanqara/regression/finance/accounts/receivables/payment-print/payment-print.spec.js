import { test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../../../../harness/config/settings.js";
import { ensureAuthenticated, getSessionPath } from "../../../../../harness/helpers/auth/auth.js";
import { annotateTicket } from "../../../../../harness/helpers/reporting/annotate.js";
import { processPaymentAndVerifyPrinter } from "./harness/payment-print-helpers.js";

import scenarios from "./0-json-data/payment-print.json" assert { type: "json" };

test.describe("Finance - Receivables (Payment Print)", () => {
  requirePosCredentials(test);
  const tenantBaseUrl = getTenantBaseUrl();

  for (const scenario of scenarios) {
    if (scenario.skip) {
      test.describe.skip(`Escenario: ${scenario.description}`, () => {
        const razon = scenario.skipReason ? scenario.skipReason : 'Omitido por configuración en JSON';
        test(`Omitido: ${razon}`, async () => {});
      });
      continue;
    }

    const scope = (scenario.metadata && scenario.metadata.testScope) ? scenario.metadata.testScope : "regression";
    const executionTag = `@${scope}`;
    const describeBlock = scenario.only ? test.describe.only : test.describe;

    describeBlock(`Escenario: ${scenario.description} ${executionTag}`, () => {
      // Dinámicamente añadir el ticket si es un test de release o tiene metadata válida
      if (scenario.metadata && scenario.metadata.ws !== undefined) {
        annotateTicket(test, scenario.metadata);
      }
      
      // Resolvemos el authType dinámicamente
      const resolvedAuthType = scenario.authType;

      test.use({ storageState: getSessionPath(resolvedAuthType) });

      test(`ensures payment is sent to printer with correct amount`, async ({ page }) => {
        test.setTimeout(60_000); 

        await test.step("Navigate to receivables list route", async () => {
          await ensureAuthenticated(page, { 
            tenantBaseUrl, 
            targetPath: "/admin/receivables/list", 
            authType: resolvedAuthType 
          });
        });

        await test.step("Process payment and intercept printer request", async () => {
          await processPaymentAndVerifyPrinter(page, scenario.paymentData);
        });
      });
    });
  }
});
