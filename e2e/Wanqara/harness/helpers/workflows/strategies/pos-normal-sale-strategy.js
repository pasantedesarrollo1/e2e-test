import { selectClientByCedula } from "../../people/client-helpers.js";
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
            await page.waitForURL(/\/pos\/(home|restaurant-home)/);
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
