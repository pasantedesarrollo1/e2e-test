import { ensureAuthenticated } from "../../auth/auth.js";
import { 
    selectCheckout, 
    selectDocumentType, 
    selectClientByCedula, 
    searchAndSelectProduct, 
    selectPaymentMethod,
    submitAdminPreSale
} from "../../../../regression/transactions/sales/harness/admin-pre-sale-flow.js";

export class PreSaleStrategy {
    async execute(workflow) {
        const { page, skipNavigation, authType, dispatchDetails, documentType, clientCedula, items, customActions, paymentMethod } = workflow;

        if (!skipNavigation) {
            await ensureAuthenticated(page, { targetPath: "/admin/pre-sale/add", authType });
            await page.waitForURL(/\/admin\/pre-sale\/add/);
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
        
        await submitAdminPreSale(page);
    }
}
