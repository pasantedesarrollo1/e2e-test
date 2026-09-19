# Análisis de Integridad de JSONs de Pruebas (E2E)

## Archivo: `harness\.auth\actor1-session.json`
- **Scenario [0] (Sin ID)**
  - ❌ **Faltan Base Keys:** id, fixture, only, skip, skipReason, metadata, description, authType, subsidiaryName, subsidiaryCode
  - ⚠️ **Variables extra/inventadas en raíz:** cookies, origins
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `harness\.auth\actor2-session.json`
- **Scenario [0] (Sin ID)**
  - ❌ **Faltan Base Keys:** id, fixture, only, skip, skipReason, metadata, description, authType, subsidiaryName, subsidiaryCode
  - ⚠️ **Variables extra/inventadas en raíz:** cookies, origins
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `harness\.auth\actor3-session.json`
- **Scenario [0] (Sin ID)**
  - ❌ **Faltan Base Keys:** id, fixture, only, skip, skipReason, metadata, description, authType, subsidiaryName, subsidiaryCode
  - ⚠️ **Variables extra/inventadas en raíz:** cookies, origins
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `harness\.auth\chef-actor1-session.json`
- **Scenario [0] (Sin ID)**
  - ❌ **Faltan Base Keys:** id, fixture, only, skip, skipReason, metadata, description, authType, subsidiaryName, subsidiaryCode
  - ⚠️ **Variables extra/inventadas en raíz:** cookies, origins
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\finance\accounts\payments\multiple-payment\0-json-data\multiple-receivables.json`
- **Scenario [0] (PAY-MULTI-001)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `paymentData` con propiedades: [cedula, paymentAmount, paymentDescription, initialDeleteReason, finalDeleteReason]

## Archivo: `regression\finance\accounts\receivables\payment-print\0-json-data\payment-print.json`
- **Scenario [0] (PAY-PRINT-001)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `paymentData` con propiedades: [cedula, amount, description, paymentMethodRegex]

## Archivo: `regression\inventory\products-services\brands\0-json-data\basic-brand-flow.json`
- **Scenario [0] (BRD-BASE-001)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `brandData` con propiedades: [name, order, observation]

## Archivo: `regression\inventory\products-services\colors\0-json-data\basic-color-flow.json`
- **Scenario [0] (CLR-BASE-001)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `colorData` con propiedades: [name, observation]
- **Scenario [1] (CLR-BASE-002)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `colorData` con propiedades: [name, observation]

## Archivo: `regression\inventory\products-services\discounts\0-json-data\basic-discount-flow.json`
- **Scenario [0] (DSC-BASE-001)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `discountData` con propiedades: [name, description, applicationMethod, type, discount]

## Archivo: `regression\inventory\products-services\discounts\0-json-data\discounts-summary.json`
- **Scenario [0] (DSC-SUM-001)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `discountData` con propiedades: [name, description, applicationMethod, type, discount]
- **Scenario [1] (DSC-SUM-002)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `discountData` con propiedades: [name, description, applicationMethod, type, discount, quantity]
- **Scenario [2] (DSC-SUM-003)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `discountData` con propiedades: [name, description, applicationMethod, type, discount, quantity]

## Archivo: `regression\inventory\products-services\products\0-json-data\recipe-decimals.json`
- **Scenario [0] (PROD-RECIPE-001)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `recipeData` con propiedades: [productName, ingredientName, exactAmount, roundedAmount]
- **Scenario [1] (PROD-RECIPE-002)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `recipeData` con propiedades: [productName, ingredientName, exactAmount, roundedAmount]

## Archivo: `regression\inventory\products-services\sizes\0-json-data\basic-size-flow.json`
- **Scenario [0] (SIZ-BASE-001)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `sizeData` con propiedades: [name, observation]

## Archivo: `regression\inventory\products-services\surcharges\0-json-data\basic-surcharge-flow.json`
- **Scenario [0] (SUR-BASE-001)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `surchargeData` con propiedades: [name, percentage]

## Archivo: `regression\login\0-json-data\whatsapp-button.json`
- **Scenario [0] (LOGIN-WAPP-001)**
  - ❌ **Faltan Base Keys:** authType, subsidiaryName, subsidiaryCode
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\people\people\0-json-data\basic-people-flow.json`
- **Scenario [0] (PPL-CRUD-001)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `personData` con propiedades: [name, identity, identityType, roles]
- **Scenario [1] (PPL-CRUD-002)**
  - ✅ Base Keys completos.
  - 📦 **Payload detectado:** `personData` con propiedades: [name, identity, identityType, roles]

## Archivo: `regression\POS\common\0-json-data\cart-duplication.json`
- **Scenario [0] (CART-DUPLICATION-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** actions, productName, productCode, openingAmount, cashRegisterMode, forceBusinessType
  - ℹ️ Sin Payload (Solo navegación/Setup).
- **Scenario [1] (CART-DUPLICATION-002)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** actions, productName, productCode, openingAmount, cashRegisterMode, forceBusinessType
  - ℹ️ Sin Payload (Solo navegación/Setup).
- **Scenario [2] (CART-DUPLICATION-003)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** actions, productName, productCode, openingAmount, cashRegisterMode, forceBusinessType
  - ℹ️ Sin Payload (Solo navegación/Setup).
- **Scenario [3] (CART-DUPLICATION-004)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** actions, productName, productCode, openingAmount, cashRegisterMode, forceBusinessType
  - ℹ️ Sin Payload (Solo navegación/Setup).
- **Scenario [4] (CART-DUPLICATION-005)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** actions, productName, productCode, openingAmount, cashRegisterMode, forceBusinessType
  - ℹ️ Sin Payload (Solo navegación/Setup).
- **Scenario [5] (CART-DUPLICATION-006)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** actions, productName, productCode, openingAmount, cashRegisterMode, forceBusinessType
  - ℹ️ Sin Payload (Solo navegación/Setup).
- **Scenario [6] (CART-DUPLICATION-007)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** actions, productName, productCode, openingAmount, cashRegisterMode, forceBusinessType
  - ℹ️ Sin Payload (Solo navegación/Setup).
- **Scenario [7] (CART-DUPLICATION-008)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** actions, productName, productCode, openingAmount, cashRegisterMode, forceBusinessType
  - ℹ️ Sin Payload (Solo navegación/Setup).
- **Scenario [8] (CART-DUPLICATION-009)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** actions, productName, productCode, openingAmount, cashRegisterMode, forceBusinessType
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\POS\common\0-json-data\cash-movements.json`
- **Scenario [0] (CASH-MOVEMENTS-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** basePath, forceBusinessType, cashRegisterMode, actions, productName, paymentMethod, openingAmount
  - 📦 **Payload detectado:** `cashMovement` con propiedades: [monto, descripcion]
- **Scenario [1] (CASH-MOVEMENTS-002)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** basePath, forceBusinessType, cashRegisterMode, actions, productName, paymentMethod, openingAmount
  - 📦 **Payload detectado:** `cashMovement` con propiedades: [monto, descripcion]
- **Scenario [2] (CASH-MOVEMENTS-003)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** basePath, forceBusinessType, cashRegisterMode, skipPriorSale, actions, openingAmount
  - 📦 **Payload detectado:** `cashMovement` con propiedades: [monto, descripcion]
- **Scenario [3] (CASH-MOVEMENTS-004)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** basePath, forceBusinessType, cashRegisterMode, skipPriorSale, actions, openingAmount
  - 📦 **Payload detectado:** `cashMovement` con propiedades: [monto, descripcion]

## Archivo: `regression\POS\common\0-json-data\cash-register-lifecycle.json`
- **Scenario [0] (CASH-REGISTER-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** basePath, forceBusinessType, cashRegisterMode, openingAmount, productName, clientCedula, paymentMethod
  - ℹ️ Sin Payload (Solo navegación/Setup).
- **Scenario [1] (CASH-REGISTER-002)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** basePath, forceBusinessType, cashRegisterMode, openingAmount, productName, clientCedula, paymentMethod
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\POS\common\0-json-data\pos-cross-sales.json`
- **Scenario [0] (POS-CROSS-SALES-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** type, paymentMethod, openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `saleParams` con propiedades: [productName, printTicket, openDrawer, clientCedula]
- **Scenario [1] (POS-CROSS-SALES-002)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** type, paymentMethod, openingAmount, cashRegisterMode, forceBusinessType, dispatchEnabled
  - 📦 **Payload detectado:** `saleParams` con propiedades: [productName, printTicket, openDrawer, clientCedula]
- **Scenario [2] (POS-CROSS-SALES-003)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** type, paymentMethod, openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `saleParams` con propiedades: [productName, printTicket, openDrawer, clientCedula]

## Archivo: `regression\POS\common\0-json-data\public-document-share.json`
- **Scenario [0] (PUBLIC-DOCUMENT-SHARE-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `shareData` con propiedades: [productName, clientCedula, paymentMethod]

## Archivo: `regression\POS\common\0-json-data\sale-cancellation.json`
- **Scenario [0] (SALE-CANCELLATION-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** expectSwitch, expectMessage, openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `saleParams` con propiedades: [productName, clientCedula, paymentMethod]
- **Scenario [1] (SALE-CANCELLATION-002)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** expectSwitch, expectMessage, openingAmount, cashRegisterMode, forceBusinessType, dispatchEnabled
  - 📦 **Payload detectado:** `saleParams` con propiedades: [productName, clientCedula, paymentMethod]
- **Scenario [2] (SALE-CANCELLATION-003)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** expectSwitch, expectMessage, openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `saleParams` con propiedades: [productName, clientCedula, paymentMethod]

## Archivo: `regression\POS\common\0-json-data\sale-cart.json`
- **Scenario [0] (SALE-CART-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** includeDynamicDocumentTest, openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `cartParams` con propiedades: [productName, restrictedAmount, testClientCedula, dynamicDocumentType, paymentMethod]
- **Scenario [1] (SALE-CART-002)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** includeDynamicDocumentTest, openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `cartParams` con propiedades: [productName, restrictedAmount, testClientCedula]

## Archivo: `regression\POS\common\0-json-data\sale-financial-precision.json`
- **Scenario [0] (SALE-FINANCIAL-PRECISION-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** surchargeProducts, discountName, discountCases, surchargeName, surchargeClientCedula, paymentMethod, openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `surchargePrecisionHoliday` con propiedades: [ui, summary, details]
- **Scenario [1] (SALE-FINANCIAL-PRECISION-002)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** surchargeProducts, discountName, discountCases, surchargeName, surchargeClientCedula, paymentMethod, openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `surchargePrecisionHoliday` con propiedades: [ui, summary, details]

## Archivo: `regression\POS\common\0-json-data\sale-options.json`
- **Scenario [0] (SALE-OPTIONS-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `optionsParams` con propiedades: [productName, observationText, savedSaleAlias, paymentMethod]
- **Scenario [1] (SALE-OPTIONS-002)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `optionsParams` con propiedades: [productName, observationText, savedSaleAlias, paymentMethod]

## Archivo: `regression\POS\common\0-json-data\sale-product-options.json`
- **Scenario [0] (SALE-PRODUCT-OPTIONS-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `productOptionsParams` con propiedades: [quantity, unitPrice, discountRate, paymentMethod, productName]
- **Scenario [1] (SALE-PRODUCT-OPTIONS-002)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `productOptionsParams` con propiedades: [quantity, unitPrice, discountRate, paymentMethod, productName]

## Archivo: `regression\POS\common\0-json-data\sale-quotations.json`
- **Scenario [0] (SALE-QUOTATIONS-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `quoteParams` con propiedades: [clientCedula, productName, observation, paymentTerms, paymentMethod]
- **Scenario [1] (SALE-QUOTATIONS-002)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `quoteParams` con propiedades: [clientCedula, productName, observation, paymentTerms, paymentMethod]

## Archivo: `regression\POS\common\0-json-data\sale-with-client.json`
- **Scenario [0] (SALE-WITH-CLIENT-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `clientParams` con propiedades: [testCedula, testName, consumidorFinalCedula, productName, paymentMethod]
- **Scenario [1] (SALE-WITH-CLIENT-002)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** openingAmount, cashRegisterMode, forceBusinessType
  - 📦 **Payload detectado:** `clientParams` con propiedades: [testCedula, testName, consumidorFinalCedula, productName, paymentMethod]

## Archivo: `regression\POS\POS-C\0-json-data\sale-combo-receipt-discount.json`
- **Scenario [0] (SALE-COMBO-RECEIPT-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** forceBusinessType, cashRegisterMode, openingAmount, productName, discountValue, documentType, paymentMethod
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\POS\POS-C\0-json-data\sale-inventory-dispatch.json`
- **Scenario [0] (SALE-INVENTORY-DISPATCH-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** dispatchEnabled, products, paymentMethod, openingAmount, forceBusinessType
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\POS\POS-C\0-json-data\stress-cart-duplication.json`
- **Scenario [0] (STRESS-CART-DUPLICATION-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** forceBusinessType, searchKeyword, openingAmount, dispatchEnabled, cashRegisterMode
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\POS\POS-R\0-json-data\change-order-status-flow.json`
- **Scenario [0] (CHANGE-ORDER-STATUS-FLOW-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** productName, openingAmount
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\POS\POS-R\0-json-data\close-orders-flow.json`
- **Scenario [0] (CLOSE-ORDERS-FLOW-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** productName, openingAmount
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\POS\POS-R\0-json-data\close-orders-from-options.json`
- **Scenario [0] (CLOSE-ORDERS-FROM-OPTIONS-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** productName, openingAmount
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\POS\POS-R\0-json-data\collect-orders-flow.json`
- **Scenario [0] (COLLECT-ORDERS-FLOW-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** paymentMethod, productName, clientCedula, openingAmount
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\POS\POS-R\0-json-data\delivery-flow.json`
- **Scenario [0] (DELIVERY-FLOW-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** openingAmount, forceBusinessType
  - 📦 **Payload detectado:** `deliveryData` con propiedades: [phone, clientName, observation, address, cedula]

## Archivo: `regression\POS\POS-R\0-json-data\no-ebilling-flow.json`
- **Scenario [0] (POS-NO-EBILLING-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** openingAmount, ebillingEnabled, forceBusinessType, productName, paymentMethod
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\POS\POS-R\0-json-data\order-with-extras.json`
- **Scenario [0] (ORDER-WITH-EXTRAS-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** paymentMethod, clientCedula, openingAmount
  - 📦 **Payload detectado:** `extrasData` con propiedades: [baseProduct, sinStockExtra, conStockExtra, categoryName, outOfStockLabelText]

## Archivo: `regression\POS\POS-R\0-json-data\remove-products-flow.json`
- **Scenario [0] (REMOVE-PRODUCTS-FLOW-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** paymentMethod, productName, clientCedula, openingAmount
  - 📦 **Payload detectado:** `removeData` con propiedades: [productName]

## Archivo: `regression\POS\POS-R\0-json-data\sales-with-tips-combinations.json`
- **Scenario [0] (SALES-WITH-TIPS-COMBINATIONS-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** tipToType, paymentMethod, productName, openingAmount
  - 📦 **Payload detectado:** `case5` con propiedades: [ui, summary, root]

## Archivo: `regression\POS\POS-R\0-json-data\separate-order-flow.json`
- **Scenario [0] (SEPARATE-ORDER-FLOW-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** paymentMethod, productName, clientCedula, openingAmount
  - 📦 **Payload detectado:** `separateData` con propiedades: [productName]

## Archivo: `regression\POS\POS-R\0-json-data\update-order-flow.json`
- **Scenario [0] (UPDATE-ORDER-FLOW-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** paymentMethod, productName, openingAmount
  - 📦 **Payload detectado:** `updateData` con propiedades: [productName]

## Archivo: `regression\special-modules\restaurants\extras-manager\0-json-data\extra-categories.json`
- **Scenario [0] (EXTRAS-001)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `extrasData` con propiedades: [categoryName, searchTerm, productsToAssign]

## Archivo: `regression\special-modules\restaurants\orders\0-json-data\orders-waiter-filter.json`
- **Scenario [0] (ORDERS-001)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `filterData` con propiedades: [waiterName, searchKeyword, apiEndpointPattern]

## Archivo: `regression\special-modules\restaurants\orders-reconciliations\0-json-data\orders-reconciliations-waiter-filter.json`
- **Scenario [0] (RECONCILIATIONS-001)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `filterData` con propiedades: [waiterName, searchKeyword, apiEndpointPattern]

## Archivo: `regression\transactions\other-documents\waybills\0-json-data\waybill-external.json`
- **Scenario [0] (WAYBILL-EXT-001)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `waybillData` con propiedades: [checkoutName, vehiclePlate, address, reason, route, shipmentAmountExternal, isLongProductSale, carrierParams]
- **Scenario [1] (WAYBILL-EXT-002)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `waybillData` con propiedades: [checkoutName, vehiclePlate, address, reason, route, shipmentAmountExternal, isLongProductSale, saleParams, carrierParams]

## Archivo: `regression\transactions\other-documents\waybills\0-json-data\waybill-internal.json`
- **Scenario [0] (WAYBILL-INT-001)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `waybillData` con propiedades: [warehouseName, checkoutName, vehiclePlate, address, reason, route, destinationSubsidiary, shipmentAmountInternal, isLongProductSale, productName, carrierParams]
- **Scenario [1] (WAYBILL-INT-002)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `waybillData` con propiedades: [warehouseName, checkoutName, vehiclePlate, address, reason, route, destinationSubsidiary, shipmentAmountInternal, isLongProductSale, productName, carrierParams]

## Archivo: `regression\transactions\sales\0-json-data\admin-cross-sales.json`
- **Scenario [0] (ADMIN-CROSS-SALES-001-1)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** sucursales
  - 📦 **Payload detectado:** `transaction` con propiedades: [path, endpoint, clientCedula, productName, paymentMethod]
- **Scenario [1] (ADMIN-CROSS-SALES-001-2)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** sucursales
  - 📦 **Payload detectado:** `transaction` con propiedades: [path, endpoint, clientCedula, productName, paymentMethod]
- **Scenario [2] (ADMIN-CROSS-SALES-001-3)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** sucursales
  - 📦 **Payload detectado:** `transaction` con propiedades: [path, endpoint, clientCedula, productName, paymentMethod]
- **Scenario [3] (ADMIN-CROSS-SALES-002-1)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** sucursales
  - 📦 **Payload detectado:** `transaction` con propiedades: [path, endpoint, clientCedula, productName, paymentMethod]
- **Scenario [4] (ADMIN-CROSS-SALES-002-2)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** sucursales
  - 📦 **Payload detectado:** `transaction` con propiedades: [path, endpoint, clientCedula, productName, paymentMethod]
- **Scenario [5] (ADMIN-CROSS-SALES-002-3)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** sucursales
  - 📦 **Payload detectado:** `transaction` con propiedades: [path, endpoint, clientCedula, productName, paymentMethod]

## Archivo: `regression\transactions\sales\0-json-data\admin-sale-cancellation.json`
- **Scenario [0] (ADMIN-SALE-CANCEL-001)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `cancellationParams` con propiedades: [expectSwitch, expectMessage]
- **Scenario [1] (ADMIN-SALE-CANCEL-002)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `cancellationParams` con propiedades: [expectSwitch, expectMessage]

## Archivo: `regression\transactions\sales\0-json-data\admin-sale-dispatch.json`
- **Scenario [0] (ADMIN-SALE-DISPATCH-001)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `saleParams` con propiedades: [documentType, dispatchEnabled, clientCedula, paymentMethod, warehouseName, mixedCart]
- **Scenario [1] (ADMIN-SALE-DISPATCH-002)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `saleParams` con propiedades: [documentType, dispatchEnabled, clientCedula, paymentMethod, warehouseName, mixedCart]

## Archivo: `regression\transactions\sales\0-json-data\admin-sale-documents.json`
- **Scenario [0] (ADMIN-SALE-DOCS-001)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `saleParams` con propiedades: [documentType, productName, clientCedula, paymentMethod, warehouseName]
- **Scenario [1] (ADMIN-SALE-DOCS-002)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `saleParams` con propiedades: [documentType, productName, clientCedula, paymentMethod, warehouseName]

## Archivo: `regression\transactions\sales\0-json-data\admin-sale-dynamic-documents.json`
- **Scenario [0] (ADMIN-DYN-DOCS-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** targetPath, steps
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `regression\transactions\sales\0-json-data\admin-sale-modifiers.json`
- **Scenario [0] (ADMIN-SALE-MODIFIER-001)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `saleParams` con propiedades: [documentType, productName, modifierType, clientCedula, paymentMethod, warehouseName, modifierRate]
- **Scenario [1] (ADMIN-SALE-MODIFIER-002)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `saleParams` con propiedades: [documentType, productName, modifierType, clientCedula, paymentMethod, warehouseName, modifierRate]
- **Scenario [2] (ADMIN-SALE-MODIFIER-003)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `saleParams` con propiedades: [documentType, productName, modifierType, clientCedula, paymentMethod, warehouseName, modifierRate]
- **Scenario [3] (ADMIN-SALE-MODIFIER-004)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `saleParams` con propiedades: [documentType, productName, modifierType, clientCedula, paymentMethod, warehouseName, modifierRate]

## Archivo: `regression\transactions\sales\pre-sale\0-json-data\admin-pre-sale-cancellation.json`
- **Scenario [0] (ADMIN-PRE-SALE-CANCEL-001)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `cancelParams` con propiedades: [expectSwitch, expectMessage]
- **Scenario [1] (ADMIN-PRE-SALE-CANCEL-002)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `cancelParams` con propiedades: [expectSwitch, expectMessage]

## Archivo: `regression\transactions\sales\pre-sale\0-json-data\admin-pre-sale-dispatch.json`
- **Scenario [0] (ADMIN-PRE-SALE-DISPATCH-001)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `saleParams` con propiedades: [documentType, clientCedula, paymentMethod, mixedCart]
- **Scenario [1] (ADMIN-PRE-SALE-DISPATCH-002)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `saleParams` con propiedades: [documentType, clientCedula, paymentMethod, mixedCart]

## Archivo: `regression\transactions\sales\pre-sale\0-json-data\admin-pre-sale-documents.json`
- **Scenario [0] (ADMIN-PRE-SALE-DOCS-001)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `saleParams` con propiedades: [documentType, productName, clientCedula, paymentMethod]
- **Scenario [1] (ADMIN-PRE-SALE-DOCS-002)**
  - ❌ **Faltan Base Keys:** subsidiaryName, subsidiaryCode
  - 📦 **Payload detectado:** `saleParams` con propiedades: [documentType, productName, clientCedula, paymentMethod]

## Archivo: `regression\transactions\sales\pre-sale\0-json-data\admin-pre-sale-dynamic-documents.json`
- **Scenario [0] (ADMIN-PRE-SALE-DYN-DOCS-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** targetPath, steps
  - ℹ️ Sin Payload (Solo navegación/Setup).

## Archivo: `specific-cases\POS\0-json-data\rounding-error.json`
- **Scenario [0] (SPECIFIC-POS-ROUNDING-001)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** forceBusinessType, dispatchEnabled, paymentUrl, paymentMethod, openingAmount
  - 📦 **Payload detectado:** `caseData` con propiedades: [clientCedula, productName, quantity, unitPriceWithoutTax]
- **Scenario [1] (SPECIFIC-POS-ROUNDING-002)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** forceBusinessType, dispatchEnabled, paymentUrl, paymentMethod, openingAmount
  - 📦 **Payload detectado:** `caseData` con propiedades: [clientCedula, productName, quantity, unitPriceWithoutTax]
- **Scenario [2] (SPECIFIC-POS-ROUNDING-003)**
  - ✅ Base Keys completos.
  - ⚠️ **Variables extra/inventadas en raíz:** forceBusinessType, dispatchEnabled, paymentUrl, paymentMethod, openingAmount
  - 📦 **Payload detectado:** `caseData` con propiedades: [clientCedula, productName, quantity, unitPriceWithoutTax]

