import { ensureAuthenticated } from "../../auth/auth.js";
import { 
    selectCheckout, 
    selectDocumentType, 
    selectClientByCedula, 
    searchAndSelectProduct, 
    selectPaymentMethod 
} from "../../../../regression/transactions/sales/harness/admin-pre-sale-flow.js";
import { submitAdminSale } from "../../../../regression/transactions/sales/harness/admin-checkout-helpers.js";

export class NormalSaleStrategy {
    async execute(workflow) {
        const { page, skipNavigation, authType, dispatchDetails, documentType, clientCedula, items, customActions, paymentMethod } = workflow;

        if (!skipNavigation) {
            await ensureAuthenticated(page, { targetPath: "/admin/ventas/add", authType });
            await page.waitForURL(/\/admin\/ventas\/add/);
        }

        await selectCheckout(page, { warehouseName: dispatchDetails?.warehouseName });
        
        if (documentType) await selectDocumentType(page, documentType);
        if (clientCedula) await selectClientByCedula(page, clientCedula);

        for (const item of items) {
            await searchAndSelectProduct(page, { name: item.name, searchTerm: item.searchTerm });
        }

        for (const action of customActions) {
            await action(page);
        }

        if (paymentMethod) await selectPaymentMethod(page, paymentMethod);
        
        await submitAdminSale(page);
    }
}
