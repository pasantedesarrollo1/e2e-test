
const fs = require("fs");
const path = require("path");

const strategyDir = "c:/Users/User/Desktop/e2e-test/e2e/Wanqara/harness/helpers/workflows/strategies";
if (!fs.existsSync(strategyDir)) {
  fs.mkdirSync(strategyDir, { recursive: true });
}

// Create PosNormalSaleStrategy
const posStrategyContent = `import { selectClientByCedula } from "../../people/client-helpers.js";
import { ensureCashRegisterOpen } from "../../../../regression/POS/harness/cash-register/cash-register-helpers.js";
import { completePayment } from "../../../../regression/POS/harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "../../../../regression/POS/harness/products/pos-search.js";
import { selectDocumentTypePos, clickFinishSale } from "../../../../regression/POS/harness/sales/pos-checkout-helpers.js";

export class PosNormalSaleStrategy {
    async execute(workflow) {
        const { page, subsidiaryName, subsidiaryCode } = workflow;
        const targetPath = workflow.targetPath || "/pos/home";

        if (!workflow.skipNavigation) {
            await ensureCashRegisterOpen(page, workflow.openingAmount, subsidiaryName, subsidiaryCode, targetPath);
            await page.waitForURL(/\\/pos\\/(home|restaurant-home)/);
        }

        if (workflow.documentType) {
            await selectDocumentTypePos(page, workflow.documentType);
        }

        if (workflow.clientCedula) {
            await selectClientByCedula(page, workflow.clientCedula);
        }

        if (workflow.productName) {
            await searchAndSelectProduct(page, { name: workflow.productName, searchTerm: workflow.searchTerm });
        }

        for (const action of workflow.customActions) {
            await action(page);
        }

        await clickFinishSale(page);

        if (!workflow.paymentMethod) throw new Error("Payment method must be explicitly provided from JSON");
        await completePayment(page, { 
            paymentMethod: workflow.paymentMethod, 
            printTicket: workflow.printTicket, 
            openDrawer: workflow.openDrawer,
            printPdf: workflow.printPdf
        });
    }
}
`;

fs.writeFileSync(path.join(strategyDir, "pos-normal-sale-strategy.js"), posStrategyContent, "utf8");

// Update PosSaleWorkflow
const workflowPath = "c:/Users/User/Desktop/e2e-test/e2e/Wanqara/harness/helpers/workflows/pos-sale-workflow.js";
let workflow = fs.readFileSync(workflowPath, "utf8");

// Remove old imports inside pos-sale-workflow because they are moved to strategy, except those not used? 
// Actually, I can just replace the execute method and add strategy import.

const newExecute = `
    async execute() {
        if (!this.strategy) {
            const { PosNormalSaleStrategy } = await import("./strategies/pos-normal-sale-strategy.js");
            this.strategy = new PosNormalSaleStrategy();
        }
        return this.strategy.execute(this);
    }
`;

// Regex to replace the whole execute method
const executeRegex = /async execute\(\) \{[\s\S]*?\n    \}/;
workflow = workflow.replace(executeRegex, newExecute.trim());

// Add strategy parameter to constructor (optional, but good for DI)
workflow = workflow.replace("constructor(page, subsidiaryName, subsidiaryCode) {", "constructor(page, subsidiaryName, subsidiaryCode, strategy = null) {\n        this.strategy = strategy;");

fs.writeFileSync(workflowPath, workflow, "utf8");
console.log("Applied Strategy Pattern to PosSaleWorkflow");

