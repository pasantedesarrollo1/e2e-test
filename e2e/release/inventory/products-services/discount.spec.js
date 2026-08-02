import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  getTenantBaseUrl,
} from "../../../harness/settings.js";
import {
  fillDiscountForm,
  saveDiscount,
  verifyDiscountInList,
  assertDiscountSummary,
  deleteDiscountIfExists,
} from "../../harness/discount-flow.js";

test.describe("Inventory — Discounts @release", () => {
  requirePosCredentials(test);

  const DISCOUNT_NAME = "Descuento Siempre Porcentaje";

  test("verifies discount summary for 'Siempre' + 'Porcentaje' and creates the discount", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    test.setTimeout(120_000);

    await test.step("Search for the discount and delete it if found", async () => {
      await deleteDiscountIfExists(page, { tenantBaseUrl, name: DISCOUNT_NAME });
    });

    await test.step("Navigate to the add discount form", async () => {
      await fillDiscountForm(page, {
        tenantBaseUrl,
        name: DISCOUNT_NAME,
        description: "test automatizado",
        applicationMethod: "always",
        type: "porcentaje",
        discount: 10,
      });
    });

    await test.step("Verify the summary panel reflects the selected options", async () => {
      await assertDiscountSummary(page, {
        applicationMethod: "always",
        type: "porcentaje",
        discount: 10,
      });
    });

    await test.step("Save the discount and confirm the success message", async () => {
      await saveDiscount(page);
    });

    await test.step("Verify the discount appears in the list", async () => {
      await verifyDiscountInList(page, { tenantBaseUrl, name: DISCOUNT_NAME });
    });
  });

  test("verifies discount summary for 'Por Cada' + 'Fijo'", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    test.setTimeout(120_000);

    await test.step("Navigate to the add discount form", async () => {
      await fillDiscountForm(page, {
        tenantBaseUrl,
        name: "Descuento Por Cada Fijo",
        description: "test automatizado",
        applicationMethod: "every_to",
        type: "fijo",
        discount: 1,
        quantity: 10,
      });
    });

    await test.step("Verify the summary panel reflects the selected options", async () => {
      await assertDiscountSummary(page, {
        applicationMethod: "every_to",
        type: "fijo",
        discount: 1,
        quantity: 10,
      });
    });
  });

  test("verifies discount summary for 'A partir de' + 'Porcentaje'", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    test.setTimeout(120_000);

    await test.step("Navigate to the add discount form", async () => {
      await fillDiscountForm(page, {
        tenantBaseUrl,
        name: "Descuento A Partir De Porcentaje",
        description: "test automatizado",
        applicationMethod: "from_to",
        type: "porcentaje",
        discount: 5,
        quantity: 3,
      });
    });

    await test.step("Verify the summary panel reflects the selected options", async () => {
      await assertDiscountSummary(page, {
        applicationMethod: "from_to",
        type: "porcentaje",
        discount: 5,
        quantity: 3,
      });
    });
  });
});