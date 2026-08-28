export const salesSeed = {
  pos: {
    checkout:  "Caja 020 - 020",
    warehouse: "Bodega de Ventas W001",
  },
  documentTypes: {
    facturaElectronica: "Factura electrónica",
    recibos:            "Recibos",
  },
  paymentMethods: {
    efectivo: { label: "EFECTIVO" },
  },
  waybills: {
    vehiclePlate:          "AAC-0123",
    destinationSubsidiary: "002 - Wanqara Retail Dispatch", 
    address:               "Dir 1",
    reason:                "razon 1",
    route:                 "ruta 1",
    shipmentAmountExternal: "1",
    shipmentAmountInternal: "1.23233356728372",
  },
  cashMovement: {
    monto:       "1",
    descripcion: "test automatizado",
  },
  sale: {
    observationText:    "Observación de prueba automatizada",
    savedSaleAlias:     "Venta de prueba automatizada",
    restrictedAmount:   "14",
    quoteObservation:   "Observación de prueba automatizada",
    quotePaymentTerms:  "Términos de pago de prueba automatizada",
    productOptionsQuantity: "3.3337373372323",
    productOptionsUnitPrice: "3.3337373372323",
    annulmentReason:    "test automatizado de anulación",
  }
};