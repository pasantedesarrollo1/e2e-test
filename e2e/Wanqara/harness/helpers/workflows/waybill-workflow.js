import { ExternalWaybillStrategy } from "./waybill-strategies/external-waybill-strategy.js";
import { InternalWaybillStrategy } from "./waybill-strategies/internal-waybill-strategy.js";

export class WaybillWorkflow {
    constructor(page, strategy = new ExternalWaybillStrategy()) {
        this.page = page;
        this.strategy = strategy;
        this.authType = null;
        this.checkoutName = null;
        this.warehouseName = null;
        this.saleIndex = 0;
        this.vehiclePlate = null;
        this.carrierParams = null;
        this.isLongProductSale = false;
        this.addressDetails = null;
        this.useFirstAvailableProduct = false;
        this.shipmentProduct = null;
        this.shipmentAmount = null;
    }

    isExternal() { this.strategy = new ExternalWaybillStrategy(); return this; }
    isInternal() { this.strategy = new InternalWaybillStrategy(); return this; }
    withAuth(authType) { this.authType = authType; return this; }
    withCheckout(checkoutName) { this.checkoutName = checkoutName; return this; }
    withWarehouse(warehouseName) { this.warehouseName = warehouseName; return this; }
    withSaleIndex(index) { this.saleIndex = index; return this; }
    withVehicle(plate) { this.vehiclePlate = plate; return this; }
    
    withCarrierLoop(carrierParams, isLongProductSale = false) { 
        this.carrierParams = carrierParams;
        this.isLongProductSale = isLongProductSale;
        return this; 
    }

    withAddress(addressDetails) { this.addressDetails = addressDetails; return this; }
    withFirstAvailableProduct() { this.useFirstAvailableProduct = true; return this; }
    withShipmentProduct(name) { this.shipmentProduct = name; return this; }
    withShipmentAmount(amount) { this.shipmentAmount = amount; return this; }

    buildPayload() {
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

    async executeWaybill() {
        if (!this.strategy) throw new Error("Se requiere una Strategy");
        await this.strategy.execute(this.buildPayload());
    }
}
