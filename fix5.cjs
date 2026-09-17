
const fs = require("fs");

const helperPath = "c:/Users/User/Desktop/e2e-test/e2e/Wanqara/regression/transactions/other-documents/waybills/harness/waybill-helpers.js";
let helpers = fs.readFileSync(helperPath, "utf8");

const newHelper = `
export async function expectCarrierAssigned(page) {
    const { expect } = require("@playwright/test");
    await expect(page.getByText(/Empleado Test 1.*Identificaci.n:/i)).toBeVisible();
}
`;

if (!helpers.includes("expectCarrierAssigned")) {
  fs.writeFileSync(helperPath, helpers + newHelper, "utf8");
}

const workflowPath = "c:/Users/User/Desktop/e2e-test/e2e/Wanqara/harness/helpers/workflows/waybill-workflow.js";
let workflow = fs.readFileSync(workflowPath, "utf8");

workflow = workflow.replace(
  "clearAssignedCarrierAndVerify ",
  "clearAssignedCarrierAndVerify,\n    expectCarrierAssigned "
);

const oldCode = `await expect(page.getByText(/Empleado Test 1.*Identificaci.n:/i)).toBeVisible();`;
const newCode = `await expectCarrierAssigned(page);`;

workflow = workflow.replace(oldCode, newCode);
fs.writeFileSync(workflowPath, workflow, "utf8");
console.log("Sealed expect abstraction");

