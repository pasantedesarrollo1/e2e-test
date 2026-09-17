
import { buildMixedCart, buildPreSaleMixedCart } from "../../../regression/transactions/sales/harness/admin-cart-helpers.js";
import { NormalSaleStrategy } from "./strategies/normal-sale-strategy.js";
import { PreSaleStrategy } from "./strategies/pre-sale-strategy.js";
import { ValidatedTransactionStrategy } from "./strategies/validated-transaction-strategy.js";

export { NormalSaleStrategy, PreSaleStrategy, ValidatedTransactionStrategy };
export class AdminSaleWorkflow {
    constructor(page, strategy = new NormalSaleStrategy()) {
        this.page = page;
        this.strategy = strategy;
        this.authType = null;
        this.documentType = null;
        this.clientCedula = null;
        this.items = [];
        this.paymentMethod = null;
        this.dispatchDetails = null;
        this.customCheckout = null;
        this.customDocumentType = null;
        this.skipNavigation = false;
        this.customActions = [];
    }

    withAuth(authType) { this.authType = authType; return this; }
    withoutNavigation() { this.skipNavigation = true; return this; }
    withDocumentType(type) { this.documentType = type; return this; }
    withClient(cedula) { this.clientCedula = cedula; return this; }
    addProduct(name, options = {}) { this.items.push({ type: 'product', name, ...options }); return this; }
    addPreSaleItem(name, options = {}) { this.items.push({ type: 'presale', name, ...options }); return this; }
    withPaymentMethod(methodName) { this.paymentMethod = methodName; return this; }
    withDispatch(warehouseName) { this.dispatchDetails = { warehouseName }; return this; }
    andThen(actionFn) { this.customActions.push(actionFn); return this; }
    withMixedCart(mixedCart, options = { dispatchEnabled: false, isPreSale: false }) {
        this.andThen(async (page) => {
            if (options.isPreSale) {
                await buildPreSaleMixedCart(page, mixedCart);
            } else {
                await buildMixedCart(page, mixedCart, options.dispatchEnabled);
            }
        });
        return this;
    }
    withCustomCheckout(bodega, caja) { this.customCheckout = { bodega, caja }; return this; }
    withCustomDocumentType(type) { this.customDocumentType = type; return this; }

    buildPayload() {
        return Object.freeze({
            page: this.page,
            skipNavigation: this.skipNavigation,
            authType: this.authType,
            dispatchDetails: this.dispatchDetails,
            documentType: this.documentType,
            clientCedula: this.clientCedula,
            items: Object.freeze([...this.items]),
            customActions: Object.freeze([...this.customActions]),
            paymentMethod: this.paymentMethod,
            customCheckout: this.customCheckout,
            customDocumentType: this.customDocumentType,
        });
    }

    async execute(endpoint = null) {
        if (!this.strategy) throw new Error("Se requiere una Strategy");
        return this.strategy.execute(this.buildPayload(), endpoint);
    }
}
