import { 
    CARRIER_CASES,
    assignCarrier,
    fillAddressDetails,
    fillInternalWaybillForm,
    fillShipmentAmount,
    fillVehiclePlate,
    selectFirstAvailableShipmentProductFromSale,
    searchAndSelectShipmentProduct,
    submitWaybillAndVerify,
    clearAssignedCarrierAndVerify,
    expectCarrierAssigned 
} from "../../../../../regression/transactions/other-documents/waybills/harness/waybill-helpers.js";

export class InternalWaybillStrategy {
    async execute(workflow) {
        const { 
            page, 
            authType, 
            warehouseName,
            checkoutName, 
            vehiclePlate, 
            carrierParams, 
            isLongProductSale, 
            addressDetails, 
            useFirstAvailableProduct, 
            shipmentProduct, 
            shipmentAmount 
        } = workflow;

        await fillInternalWaybillForm(page, {
            authType,
            warehouseName,
            checkoutName
        });

        if (vehiclePlate) {
            await fillVehiclePlate(page, vehiclePlate);
        }

        if (carrierParams) {
            if (!isLongProductSale) {
                for (const { carrier } of CARRIER_CASES) {
                    const isLast = carrier === CARRIER_CASES[CARRIER_CASES.length - 1].carrier;
                    await assignCarrier(page, carrier, carrierParams);
                    await expectCarrierAssigned(page);
                    if (!isLast) {
                        await clearAssignedCarrierAndVerify(page);
                    }
                }
            } else {
                await assignCarrier(page, "cedula", carrierParams);
            }
        }

        if (addressDetails) {
            await fillAddressDetails(page, addressDetails);
        }

        if (useFirstAvailableProduct) {
            await selectFirstAvailableShipmentProductFromSale(page);
        } else if (shipmentProduct) {
            await searchAndSelectShipmentProduct(page, shipmentProduct);
        }

        if (shipmentAmount) {
            await fillShipmentAmount(page, shipmentAmount);
        }

        await submitWaybillAndVerify(page);
    }
}
