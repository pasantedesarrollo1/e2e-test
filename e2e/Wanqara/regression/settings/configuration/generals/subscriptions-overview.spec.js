import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/auth.js";
import { 
  validateSubscriptionsOverview, 
  validateSubsidiaryCapabilityBadges 
} from "./harness/subscriptions-flow.js";

const tenantBaseUrl = getTenantBaseUrl();

test.describe("Subscriptions Overview @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("retail") });

  test("Validates that displayed subscription cards match the seed data", async ({ page }) => {
    test.setTimeout(120_000);
    
    await ensureAuthenticated(page, { 
      tenantBaseUrl, 
      targetPath: "/admin/settings/subscriptions", 
      authType: "retail" 
    });

    await validateSubscriptionsOverview(page);
  });

  test("Validates that capability badges in subsidiary form match the seed data", async ({ page }) => {
    test.setTimeout(60_000);
    
    await ensureAuthenticated(page, { 
      tenantBaseUrl, 
      targetPath: "/admin/home", 
      authType: "retail" 
    });

    await validateSubsidiaryCapabilityBadges(page, tenantBaseUrl);
  });
});