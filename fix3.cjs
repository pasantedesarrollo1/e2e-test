
const fs = require("fs");
const path = require("path");

// 1. Add helper to waybill-helpers.js
const helperPath = "c:/Users/User/Desktop/e2e-test/e2e/Wanqara/regression/transactions/other-documents/waybills/harness/waybill-helpers.js";
let helpers = fs.readFileSync(helperPath, "utf8");

const newHelper = `
export async function clearAssignedCarrierAndVerify(page) {
    const clearBtn = page.locator(".tw-flex > .tw-flex.tw-gap-1").getByRole("button").last();
    await clearBtn.click();
    await page.getByText(/Empleado Test 1.*Identificaci.n:/i).waitFor({ state: "hidden" });
}
`;

if (!helpers.includes("clearAssignedCarrierAndVerify")) {
  fs.writeFileSync(helperPath, helpers + newHelper, "utf8");
}

// 2. Update waybill-workflow.js
const workflowPath = "c:/Users/User/Desktop/e2e-test/e2e/Wanqara/harness/helpers/workflows/waybill-workflow.js";
let workflow = fs.readFileSync(workflowPath, "utf8");

workflow = workflow.replace(
  "submitWaybillAndVerify",
  "submitWaybillAndVerify,\n    clearAssignedCarrierAndVerify"
);

const oldCode = `const clearBtn = page.locator(".tw-flex > .tw-flex.tw-gap-1").getByRole("button").last();
                        await clearBtn.click();
                        await expect(page.getByText(/Empleado Test 1.*Identificaci.n:/i)).not.toBeVisible();`;
const newCode = `await clearAssignedCarrierAndVerify(page);`;

workflow = workflow.replace(oldCode, newCode);
fs.writeFileSync(workflowPath, workflow, "utf8");
console.log("Sealed abstractions in waybill-workflow.js");

