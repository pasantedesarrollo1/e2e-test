/* eslint-disable */
// @ts-nocheck
// @ts-ignore
import { ensureAuthenticated } from "../../auth/auth.js";
// @ts-ignore
import { 
    selectClientByCedula, 
    searchAndSelectProduct, 
    selectPaymentMethod 
} from "@/e2e/Wanqara/regression/transactions/sales/harness/admin-pre-sale-flow.js";
// @ts-ignore
import { selectCheckout, submitAdminSale } from "@/e2e/Wanqara/regression/transactions/sales/harness/admin-checkout-helpers.js";
// @ts-ignore
import { selectDocumentType } from "@/e2e/Wanqara/regression/transactions/sales/harness/admin-document-helpers.js";

import type { SaleStrategy, SaleStrategyPayload } from "@/e2e/Wanqara/harness/helpers/workflows/admin-sale-workflow.js";

export class ValidatedTransactionStrategy implements SaleStrategy {
    async execute(workflow, endpoint) {
        const { page, skipNavigation, authType, customCheckout, customDocumentType, documentType, clientCedula, items, customActions, paymentMethod } = workflow;

        if (!skipNavigation) {
            await ensureAuthenticated(page, { targetPath: "/admin/ventas/add", authType });
            await page.waitForURL(/\/admin\/ventas\/add/);
        }

        if (customCheckout) {
            await selectCheckout(page, { warehouseName: customCheckout.bodega });
        }

        if (customDocumentType) {
            await selectDocumentType(page, customDocumentType);
        } else if (documentType) {
            await selectDocumentType(page, documentType);
        }

        if (clientCedula) await selectClientByCedula(page, clientCedula);

        for (const item of items) {
            await searchAndSelectProduct(page, { name: item.name, searchTerm: item.searchTerm });
        }

        for (const action of customActions) {
            await action(page);
        }

        if (paymentMethod) await selectPaymentMethod(page, paymentMethod);

        await submitAdminSale(page, endpoint);
    }
}
