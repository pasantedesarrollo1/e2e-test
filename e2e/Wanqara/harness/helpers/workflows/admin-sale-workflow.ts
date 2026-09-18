import { buildMixedCart, buildPreSaleMixedCart, type MixedCartOptions } from "@/e2e/Wanqara/regression/transactions/sales/harness/admin-cart-helpers.js";
import { NormalSaleStrategy } from "@/e2e/Wanqara/harness/helpers/workflows/strategies/normal-sale-strategy.js";
import { PreSaleStrategy } from "@/e2e/Wanqara/harness/helpers/workflows/strategies/pre-sale-strategy.js";
import { ValidatedTransactionStrategy } from "@/e2e/Wanqara/harness/helpers/workflows/strategies/validated-transaction-strategy.js";
import type { Page } from "@playwright/test";

export interface SaleItem {
    type: 'product' | 'presale';
    name: string;
    [key: string]: unknown;
}

export interface SaleStrategyPayload {
    page: Page;
    skipNavigation: boolean;
    authType: string | null;
    dispatchDetails: { warehouseName: string } | null;
    documentType: string | null;
    clientCedula: string | null;
    items: ReadonlyArray<SaleItem>;
    customActions: ReadonlyArray<(page: Page) => Promise<void>>;
    paymentMethod: string | null;
    customCheckout: { bodega: string; caja: string } | null;
    customDocumentType: string | null;
}

export interface SaleStrategy {
    execute(payload: SaleStrategyPayload, endpoint?: string | null): Promise<void>;
}

export { NormalSaleStrategy, PreSaleStrategy, ValidatedTransactionStrategy };

export class AdminSaleWorkflow {
    private page: Page;
    private strategy: SaleStrategy;
    private authType: string | null = null;
    private documentType: string | null = null;
    private clientCedula: string | null = null;
    private items: SaleItem[] = [];
    private paymentMethod: string | null = null;
    private dispatchDetails: { warehouseName: string } | null = null;
    private customCheckout: { bodega: string; caja: string } | null = null;
    private customDocumentType: string | null = null;
    private skipNavigation: boolean = false;
    private customActions: Array<(page: Page) => Promise<void>> = [];

    constructor(page: Page, strategy: SaleStrategy = new NormalSaleStrategy()) {
        this.page = page;
        this.strategy = strategy;
    }

    withAuth(authType: string): this { this.authType = authType; return this; }
    withoutNavigation(): this { this.skipNavigation = true; return this; }
    withDocumentType(type: string): this { this.documentType = type; return this; }
    withClient(cedula: string): this { this.clientCedula = cedula; return this; }
    addProduct(name: string, options: Record<string, unknown> = {}): this { this.items.push({ type: 'product', name, ...options }); return this; }
    addPreSaleItem(name: string, options: Record<string, unknown> = {}): this { this.items.push({ type: 'presale', name, ...options }); return this; }
    withPaymentMethod(methodName: string): this { this.paymentMethod = methodName; return this; }
    withDispatch(warehouseName: string): this { this.dispatchDetails = { warehouseName }; return this; }
    andThen(actionFn: (page: Page) => Promise<void>): this { this.customActions.push(actionFn); return this; }
    withMixedCart(mixedCart: MixedCartOptions, options: { dispatchEnabled?: boolean; isPreSale?: boolean } = { dispatchEnabled: false, isPreSale: false }): this {
        this.andThen(async (page: Page) => {
            if (options.isPreSale) {
                await buildPreSaleMixedCart(page, mixedCart);
            } else {
                await buildMixedCart(page, mixedCart, options.dispatchEnabled ?? false);
            }
        });
        return this;
    }
    withCustomCheckout(bodega: string, caja: string): this { this.customCheckout = { bodega, caja }; return this; }
    withCustomDocumentType(type: string): this { this.customDocumentType = type; return this; }

    buildPayload(): SaleStrategyPayload {
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

    async execute(endpoint: string | null = null): Promise<void> {
        if (!this.strategy) throw new Error("Se requiere una Strategy");
        return this.strategy.execute(this.buildPayload(), endpoint);
    }
}
