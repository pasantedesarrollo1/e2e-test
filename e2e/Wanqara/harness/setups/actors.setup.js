import { test as setup } from "@playwright/test";
import { playwrightHarness } from "../config/settings.js";
import { authenticateByRole } from "./common-setup.js";

// Genera un test de setup por cada actor definido en settings.js
for (const actorKey of Object.keys(playwrightHarness.users)) {
  setup(`authenticate ${actorKey}`, authenticateByRole(actorKey));
}
