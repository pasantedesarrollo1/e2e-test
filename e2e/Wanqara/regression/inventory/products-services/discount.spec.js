import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { SEED } from "../../../harness/seed.js";
import {
  fillDiscountForm,
  saveDiscount,
  verifyDiscountInList,
  assertDiscountSummary,
  deleteDiscountIfExists,
} from "./harness/discount-flow.js";

test.describe("Inventory — Discounts @regression", () => {
  requirePosCredentials(test);

  test("verifies discount summary for 'Siempre' + 'Porcentaje' and creates the discount", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const data = SEED.discount.crud.alwaysPercentage;
    test.setTimeout(120_000);

    await test.step("Search for the discount and delete it if found", async () => {
      await deleteDiscountIfExists(page, { tenantBaseUrl, name: data.name });
    });

    await test.step("Navigate to the add discount form", async () => {
      await fillDiscountForm(page, {
        tenantBaseUrl,
        name: data.name,
        description: data.description,
        applicationMethod: "always",
        type: "porcentaje",
        discount: data.discount,
      });
    });

    await test.step("Verify the summary panel reflects the selected options", async () => {
      await assertDiscountSummary(page, {
        applicationMethod: "always",
        type: "porcentaje",
        discount: data.discount,
      });
    });

    await test.step("Save the discount and confirm the success message", async () => {
      await saveDiscount(page);
    });

    await test.step("Verify the discount appears in the list", async () => {
      await verifyDiscountInList(page, { tenantBaseUrl, name: data.name });
    });
  });

  test("verifies discount summary for 'Por Cada' + 'Fijo'", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const data = SEED.discount.crud.everyFixed;
    test.setTimeout(120_000);

    await test.step("Navigate to the add discount form", async () => {
      await fillDiscountForm(page, {
        tenantBaseUrl,
        name: data.name,
        description: data.description,
        applicationMethod: "every_to",
        type: "fijo",
        discount: data.discount,
        quantity: data.quantity,
      });
    });

    await test.step("Verify the summary panel reflects the selected options", async () => {
      await assertDiscountSummary(page, {
        applicationMethod: "every_to",
        type: "fijo",
        discount: data.discount,
        quantity: data.quantity,
      });
    });
  });

  test("verifies discount summary for 'A partir de' + 'Porcentaje'", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const data = SEED.discount.crud.fromPercentage;
    test.setTimeout(120_000);

    await test.step("Navigate to the add discount form", async () => {
      await fillDiscountForm(page, {
        tenantBaseUrl,
        name: data.name,
        description: data.description,
        applicationMethod: "from_to",
        type: "porcentaje",
        discount: data.discount,
        quantity: data.quantity,
      });
    });

    await test.step("Verify the summary panel reflects the selected options", async () => {
      await assertDiscountSummary(page, {
        applicationMethod: "from_to",
        type: "porcentaje",
        discount: data.discount,
        quantity: data.quantity,
      });
    });
  });
});