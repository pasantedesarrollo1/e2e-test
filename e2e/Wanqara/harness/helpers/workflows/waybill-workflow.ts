/* eslint-disable */
import { ExternalWaybillStrategy } from "@/e2e/Wanqara/harness/helpers/workflows/waybill-strategies/external-waybill-strategy.js";
import { InternalWaybillStrategy } from "@/e2e/Wanqara/harness/helpers/workflows/waybill-strategies/internal-waybill-strategy.js";
import type { Page } from "@playwright/test";


export interface WaybillStrategyPayload {
    page: Page;
    authType: string | null;
    checkoutName: string | null;
    warehouseName: string | null;
    saleIndex: number;
    vehiclePlate: string | null;
    carrierParams: unknown | null;
    isLongProductSale: boolean;
    addressDetails: { location: string; details: string; email: string } | null;
    useFirstAvailableProduct: boolean;
    shipmentProduct: string | null;
    shipmentAmount: string | null;
}

export interface WaybillStrategy {
    execute(payload: WaybillStrategyPayload): Promise<void>;
}

export class WaybillWorkflow {
    private page: Page;
    private strategy: WaybillStrategy;
    private authType: string | null = null;
    private checkoutName: string | null = null;
    private warehouseName: string | null = null;
    private saleIndex: number = 0;
    private vehiclePlate: string | null = null;
    private carrierParams: unknown | null = null;
    private isLongProductSale: boolean = false;
    private addressDetails: { location: string; details: string; email: string } | null = null;
    private useFirstAvailableProduct: boolean = false;
    private shipmentProduct: string | null = null;
    private shipmentAmount: string | null = null;

    constructor(page: Page, strategy: WaybillStrategy = new ExternalWaybillStrategy()) {
        this.page = page;
        this.strategy = strategy;
    }

    isExternal(): this { this.strategy = new ExternalWaybillStrategy(); return this; }
    isInternal(): this { this.strategy = new InternalWaybillStrategy(); return this; }
    withAuth(authType: string): this { this.authType = authType; return this; }
    withCheckout(checkoutName: string): this { this.checkoutName = checkoutName; return this; }
    withWarehouse(warehouseName: string): this { this.warehouseName = warehouseName; return this; }
    withSaleIndex(index: number): this { this.saleIndex = index; return this; }
    withVehicle(plate: string): this { this.vehiclePlate = plate; return this; }
    
    withCarrierLoop(carrierParams: unknown, isLongProductSale: boolean = false): this { 
        this.carrierParams = carrierParams;
        this.isLongProductSale = isLongProductSale;
        return this; 
    }

    withAddress(addressDetails: { location: string; details: string; email: string }): this { this.addressDetails = addressDetails; return this; }
    withFirstAvailableProduct(): this { this.useFirstAvailableProduct = true; return this; }
    withShipmentProduct(name: string): this { this.shipmentProduct = name; return this; }
    withShipmentAmount(amount: string): this { this.shipmentAmount = amount; return this; }

    buildPayload(): WaybillStrategyPayload {
        return Object.freeze({
            page: this.page,
            authType: this.authType,
            checkoutName: this.checkoutName,
            warehouseName: this.warehouseName,
            saleIndex: this.saleIndex,
            vehiclePlate: this.vehiclePlate,
            carrierParams: this.carrierParams,
            isLongProductSale: this.isLongProductSale,
            addressDetails: this.addressDetails,
            useFirstAvailableProduct: this.useFirstAvailableProduct,
            shipmentProduct: this.shipmentProduct,
            shipmentAmount: this.shipmentAmount,
        });
    }

    async executeWaybill(): Promise<void> {
        if (!this.strategy) throw new Error("Se requiere una Strategy");
        await this.strategy.execute(this.buildPayload());
    }
}
