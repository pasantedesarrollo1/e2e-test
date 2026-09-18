import { test as setup } from "@playwright/test";
import { playwrightHarness } from "@/e2e/Wanqara/harness/config/settings.js";
import { authenticateByRole } from "@/e2e/Wanqara/harness/setups/common-setup.js";

for (const actorKey of Object.keys(playwrightHarness.users)) {
  setup(`authenticate ${actorKey}`, authenticateByRole(actorKey));
}
