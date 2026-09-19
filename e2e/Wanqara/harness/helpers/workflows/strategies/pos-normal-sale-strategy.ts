/* eslint-disable */
// @ts-nocheck
// @ts-ignore
import { selectClientByCedula } from "../../shared/client-picker.js";
// @ts-ignore
import { ensureCashRegisterOpen } from "@/e2e/Wanqara/regression/POS/harness/cash-register/cash-register-helpers.js";
// @ts-ignore
import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
// @ts-ignore
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
// @ts-ignore
import { selectDocumentTypePos, clickFinishSale } from "@/e2e/Wanqara/regression/POS/harness/sales/pos-checkout-helpers.js";

import type { PosSaleStrategy, PosSaleStrategyPayload } from "@/e2e/Wanqara/harness/helpers/workflows/pos-sale-workflow.js";

export class PosNormalSaleStrategy implements PosSaleStrategy {
    async execute(workflow: PosSaleStrategyPayload): Promise<void> {
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
            await selectClientByCedula(page, workflow.clientCedula, {  identityType: workflow.identityType });
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
