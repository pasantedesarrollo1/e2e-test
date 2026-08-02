import { test } from "@playwright/test";
import { ensureRestaurantBusinessType } from "../harness/restaurant-setup.js";
import { setDispatchInventory } from "../../regression/harness/subsidiary-dispatch.js";
import { 
  getTenantBaseUrl, 
  hasTenantData, 
  hasLoginCredentials, 
  playwrightHarness 
} from "../../harness/settings.js";
import { logoutAndLoginAgain, SESSION_PATH } from "../../harness/auth.js";
import { SEED } from "../../harness/seed.js";

test.describe("POS Restaurant — Environment Setup", () => {
  test("ensure business type is restaurant and dispatch is disabled", async ({ page }) => {
    test.setTimeout(60_000); 
    
    if (!hasTenantData() || !hasLoginCredentials()) {
      test.skip("Faltan credenciales del tenant");
      return;
    }

    const tenantBaseUrl = getTenantBaseUrl();
    
    const restaurantChanged = await ensureRestaurantBusinessType(page, { tenantBaseUrl });
    
    const dispatchChanged = await setDispatchInventory(page, { 
      tenantBaseUrl, 
      enable: false 
    });

    if (restaurantChanged || dispatchChanged) {
      await logoutAndLoginAgain(page, {
        tenantBaseUrl,
        login: playwrightHarness.login,
        subsidiaryName: SEED.subsidiary.name,
      });

      await page.context().storageState({ path: SESSION_PATH });
    }
  });
});