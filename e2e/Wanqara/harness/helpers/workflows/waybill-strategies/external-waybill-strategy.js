import { 
    CARRIER_CASES,
    assignCarrier,
    fillAddressDetails,
    fillExternalWaybillForm,
    fillShipmentAmount,
    fillVehiclePlate,
    selectFirstAvailableShipmentProductFromSale,
    searchAndSelectShipmentProduct,
    submitWaybillAndVerify,
    clearAssignedCarrierAndVerify,
    expectCarrierAssigned 
} from "../../../../../regression/transactions/other-documents/waybills/harness/waybill-helpers.js";

export class ExternalWaybillStrategy {
    async execute(workflow) {
        const { 
            page, 
            authType, 
            checkoutName, 
            saleIndex, 
            vehiclePlate, 
            carrierParams, 
            isLongProductSale, 
            addressDetails, 
            useFirstAvailableProduct, 
            shipmentProduct, 
            shipmentAmount 
        } = workflow;

        await fillExternalWaybillForm(page, {
            authType,
            checkoutName,
            saleIndex
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
