import { ensureAuthenticated } from "../../auth/auth.js";
import { 
    selectClientByCedula, 
    searchAndSelectProduct, 
    selectPaymentMethod 
} from "../../../../regression/transactions/sales/harness/admin-pre-sale-flow.js";
import { selectCheckout, submitAdminSale } from "../../../../regression/transactions/sales/harness/admin-checkout-helpers.js";
import { selectDocumentType } from "../../../../regression/transactions/sales/harness/admin-document-helpers.js";

export class ValidatedTransactionStrategy {
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
