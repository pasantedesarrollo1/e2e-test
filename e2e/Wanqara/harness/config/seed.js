
import { playwrightHarness } from './settings.js';


// === cross-sales-seed.js ===
export const RELEASE_SEED = {
  sucursales: [
    {
      name: "001 - Wanqara 001",
      combinations: [
        { bodega: "Bodega de Garantias", caja: "Caja 020" },
        { bodega: "Bodega de Showroom", caja: "021" },
        { bodega: "Bodega de Backup", caja: "Caja 020" }
      ]
    },
    {
      name: "100 - Wanqara Comercios 100",
      combinations: [
        { bodega: "Bodega Wanqara Comercios 01", caja: "Caja Wanqara Comercios 01" },
        { bodega: "Bodega Wanqara Comercios 02", caja: "Caja Wanqara Comercios 02" }
      ]
    },
    {
      name: "101 - Wanqara Comercios Dispatch 101",
      combinations: [
        { bodega: "Bodega Wanqara Comercios Dispatch 01", caja: "Caja Wanqara Comercios Dispatch 01" },
        { bodega: "Bodega Wanqara Comercios Dispatch 02", caja: "Caja Wanqara Comercios Dispatch 02" }
      ]
    }
  ]
};
// === extras-seed.js ===
export const extrasSeed = {
  extrasManager: {
    category: {
      name: "Extras Alitas",
    },
    products: {
      searchTerm: "alitas",
      baseProduct: "Caja de alitas de pollo",
      items: {
        sinStock: { name: "extra alitas sin stock" },
        conStock: { name: "extra alitas stock" },
      }
    },
    messages: {
      categoryCreated: "Categoría Creada",
      categoryDeleted: "Categoría extra eliminada",
      cannotDelete: "No se puede eliminar una categoría con productos relacionados",
      changesSaved: "Cambios de productos extra guardados",
      relationDeleted: "Relación eliminada",
      noCategories: "Aún no hay categorías",
      loadingProducts: "Cargando productos disponibles",
      outOfStockLabel: "Sin stock disponible",
      outOfStockToast: "No hay stock disponible para este acompañamiento"
    }
  }
};

// === financial-seed.js ===
export const financialSeed = {
  receivables: {
    paymentAmount: "0.01",
    paymentDescription: "Automated test payment",
    initialDeleteReason: "test",
    finalDeleteReason: "test deletion reason",
  },
  discount: {
    rate: "3.3337373372323",
    name: "Descuento General",
    crud: {
      alwaysPercentage: { name: "Descuento Siempre Porcentaje", description: "test automatizado", discount: 10 },
      everyFixed:       { name: "Descuento Por Cada Fijo", description: "test automatizado", discount: 1, quantity: 10 },
      fromPercentage:   { name: "Descuento A Partir De Porcentaje", description: "test automatizado", discount: 5, quantity: 3 }
    },
    precision: {
      estandar: {
        ui:      { descuentos: "$0.11", subtotal: "$3.26", impuestos: "$0.49", total: "$3.75" },
        detail:  { price: "3.3773263982716", discount: "0.112591191139383", taxedDiscount: "0.12947986981029", total: "3.264735207132217", taxedTotal: "3.754445488202047", taxedPrice: "3.88" },
        summary: { discount: "0.112591191139383", subtotal: "3.264735207132217", total: "3.75" },
      },
      subproducto: {
        ui:      { descuentos: "$0.12", subtotal: "$3.61", impuestos: "$0.54", total: "$4.15" },
        detail:  { price: "3.733233456543", discount: "0.124456197626822", taxedDiscount: "0.143124627270845", total: "3.608777258916178", taxedTotal: "4.150093847753608", taxedPrice: "4.29" },
        summary: { discount: "0.124456197626822", subtotal: "3.608777258916178", total: "4.15" },
      },
      preElaborado: {
        ui:      { descuentos: "$0.09", subtotal: "$2.52", impuestos: "$0.38", total: "$2.9" },
        detail:  { price: "2.6087267167662", discount: "0.086968096583189", taxedDiscount: "0.100013311070667", total: "2.521758620183011", taxedTotal: "2.900022413210461", taxedPrice: "3" },
        summary: { discount: "0.086968096583189", subtotal: "2.521758620183011", total: "2.9" },
      },
      elaborado: {
        ui:      { descuentos: "$0.26", subtotal: "$7.51", impuestos: "$1.13", total: "$8.64" },
        detail:  { price: "7.7733352637263", discount: "0.259142580035089", taxedDiscount: "0.298013967040352", total: "7.514192683691211", taxedTotal: "8.641321586244911", taxedPrice: "8.94" },
        summary: { discount: "0.259142580035089", subtotal: "7.514192683691211", total: "8.64" },
      },
      combo: {
        ui:      { descuentos: "$1.03", subtotal: "$29.94", impuestos: "$4.49", total: "$34.43" },
        detail:  { price: "30.9730162676336", discount: "1.032559007781135", taxedDiscount: "1.032559007781135", total: "29.940457259852465", taxedTotal: "29.940457259852465", taxedPrice: "30.97" },
        summary: { discount: "1.032559007781135", subtotal: "29.940457259852465", total: "34.43" },
      },
      serie: {
        ui:      { descuentos: "$0.04", subtotal: "$1.23", impuestos: "$0.18", total: "$1.41" },
        detail:  { price: "1.26732881637592", discount: "0.042249413937028", taxedDiscount: "0.048586826027582", total: "1.225079402438892", taxedTotal: "1.408841312804722", taxedPrice: "1.46" },
        summary: { discount: "0.042249413937028", subtotal: "1.225079402438892", total: "1.41" },
      },
      tallaColor: {
        ui:      { descuentos: "$0.04", subtotal: "$1.29", impuestos: "$0.19", total: "$1.48" },
        detail:  { price: "1.33234332323432", discount: "0.044416826826784", taxedDiscount: "0.051079350850802", total: "1.287926496407536", taxedTotal: "1.481115470868666", taxedPrice: "1.53" },
        summary: { discount: "0.044416826826784", subtotal: "1.287926496407536", total: "1.48" },
      },
    },
    precisionHoliday: {
      estandar: {
        ui:      { descuentos: "$0.11", subtotal: "$3.26", impuestos: "$0.26", total: "$3.53" },
        detail:  { price: "3.3773263982716", discount: "0.112591191139383", taxedDiscount: "0.121598486430534", total: "3.264735207132217", taxedTotal: "3.525914023702797", taxedPrice: "3.65" },
        summary: { discount: "0.112591191139383", subtotal: "3.264735207132217", total: "3.53" },
      },
      subproducto: {
        ui:      { descuentos: "$0.12", subtotal: "$3.61", impuestos: "$0.29", total: "$3.90" },
        detail:  { price: "3.733233456543000", discount: "0.124456197626822", taxedDiscount: "0.134412693436968", total: "3.608777258916178", taxedTotal: "3.897479439629468", taxedPrice: "4.03" },
        summary: { discount: "0.124456197626822", subtotal: "3.608777258916178", total: "3.9" },
      },
      preElaborado: {
        ui:      { descuentos: "$0.09", subtotal: "$2.52", impuestos: "$0.20", total: "$2.72" },
        detail:  { price: "2.608726716766200", discount: "0.086968096583189", taxedDiscount: "0.093925544309844", total: "2.521758620183011", taxedTotal: "2.723499309797651", taxedPrice: "2.82" },
        summary: { discount: "0.086968096583189", subtotal: "2.521758620183011", total: "2.72" },
      },
      elaborado: {
        ui:      { descuentos: "$0.26", subtotal: "$7.51", impuestos: "$0.60", total: "$8.12" },
        detail:  { price: "7.773335263726300", discount: "0.259142580035089", taxedDiscount: "0.279873986437896", total: "7.514192683691211", taxedTotal: "8.115328098386511", taxedPrice: "8.4" },
        summary: { discount: "0.259142580035089", subtotal: "7.514192683691211", total: "8.12" },
      },
      combo: {
        ui:      { descuentos: "$1.03", subtotal: "$29.94", impuestos: "$2.40", total: "$32.34" },
        detail:  { price: "30.9730162676336", discount: "1.032559007781135", taxedDiscount: "1.032559007781135", total: "29.940457259852465", taxedTotal: "29.940457259852465", taxedPrice: "30.97" },
        summary: { discount: "1.032559007781135", subtotal: "29.940457259852465", total: "32.34" },
      },
      serie: {
        ui:      { descuentos: "$0.04", subtotal: "$1.23", impuestos: "$0.10", total: "$1.42" },
        detail:  { price: "1.267328816375920", discount: "0.042249413937028", taxedDiscount: "0.04562936705199", total: "1.225079402438892", taxedTotal: "1.323085754634003", taxedPrice: "1.37" },
        summary: { discount: "0.042249413937028", subtotal: "1.225079402438892", total: "1.42" },
      },
      tallaColor: {
        ui:      { descuentos: "$0.04", subtotal: "$1.29", impuestos: "$0.19", total: "$1.48" },
        detail:  { price: "1.33234332323432", discount: "0.044416826826784", taxedDiscount: "0.051079350850802", total: "1.287926496407536", taxedTotal: "1.481115470868666", taxedPrice: "1.53" },
        summary: { discount: "0.044416826826784", subtotal: "1.287926496407536", total: "1.48" },
      },
    },
  },
  surcharge: {
    rate: "3.3337373372323",
    name: "Recargo Manual",
    crud: {
      name: "Recargo Test Automatizado",
      percentage: "10"
    },
    precision: {
      estandar: {
        ui:      { subtotal: "$11.63", impuestos: "$1.75", total: "$13.38" },
        detail:  { price: "3.489917589410983", discount: "0", taxedPrice: "4.01", total: "11.634468571683138", taxedTotal: "13.379638857435638" },
        summary: { subtotal: "11.634468571683138", total: "13.38" },
      },
      subproducto: {
        ui:      { subtotal: "$12.86", impuestos: "$1.93", total: "$14.79" },
        detail:  { price: "3.857689654169822", discount: "0", taxedPrice: "4.44", total: "12.860524035560694", taxedTotal: "14.789602640894794" },
        summary: { subtotal: "12.860524035560694", total: "14.79" },
      },
      preElaborado: {
        ui:      { subtotal: "$8.99", impuestos: "$1.35", total: "$10.33" },
        detail:  { price: "2.695694813349389", discount: "0", taxedPrice: "3.1", total: "8.986738449046314", taxedTotal: "10.334749216403214" },
        summary: { subtotal: "8.986738449046314", total: "10.33" },
      },
      elaborado: {
        ui:      { subtotal: "$26.78", impuestos: "$4.02", total: "$30.79" },
        detail:  { price: "8.032477843761389", discount: "0", taxedPrice: "9.24", total: "26.778171298238538", taxedTotal: "30.794896992974338" },
        summary: { subtotal: "26.778171298238538", total: "30.79" },
      },
      combo: {
        ui:      { subtotal: "$106.7", impuestos: "$16.0", total: "$122.7" },
        detail:  { price: "32.005575275414735", discount: "0", taxedPrice: "32.01", total: "106.698181295249056", taxedTotal: "106.698181295249056" },
        summary: { subtotal: "106.698181295249056", total: "122.7" },
      },
      serie: {
        ui:      { subtotal: "$1.31", impuestos: "$0.20", total: "$1.51" },
        detail:  { price: "1.309578230312948", discount: "0", taxedPrice: "1.51", total: "1.309578230312948", taxedTotal: "1.506014964859888" },
        summary: { subtotal: "1.309578230312948", total: "1.51" },
      },
      tallaColor: {
        ui:      { subtotal: "$4.59", impuestos: "$0.69", total: "$5.28" },
        detail:  { price: "1.376760150061104", discount: "0", taxedPrice: "1.58", total: "4.589756716672247", taxedTotal: "5.278220224173087" },
        summary: { subtotal: "4.589756716672247", total: "5.28" },
      },
      allProducts: {
        ui:      { subtotal: "$54.96", impuestos: "$8.24", total: "$63.20" },
        details: [
          { price: "1.376760150061104",  discount: "0", taxedPrice: "1.58",  total: "1.376760150061104",  taxedTotal: "1.583274172570274"  },
          { price: "1.309578230312948",  discount: "0", taxedPrice: "1.51",  total: "1.309578230312948",  taxedTotal: "1.506014964859888"  },
          { price: "2.192867686054737",  discount: "0", taxedPrice: "2.52",  total: "2.192867686054737",  taxedTotal: "2.521797838962947"  },
          { price: "8.032477843761389",  discount: "0", taxedPrice: "9.24",  total: "8.032477843761388",  taxedTotal: "9.237349520325588"  },
          { price: "32.005575275414735", discount: "0", taxedPrice: "32.01", total: "32.005575275414735", taxedTotal: "32.005575275414735" },
          { price: "3.489917589410983",  discount: "0", taxedPrice: "4.01",  total: "3.489917589410983",  taxedTotal: "4.013405227822633"  },
          { price: "2.695694813349389",  discount: "0", taxedPrice: "3.1",   total: "2.695694813349389",  taxedTotal: "3.100049035351799"  },
          { price: "3.857689654169822",  discount: "0", taxedPrice: "4.44",  total: "3.857689654169821",  taxedTotal: "4.436343102295291"  },
        ],
        summary: { subtotal: "54.960561242535105", total: "63.2" },
      },
      restaurantProducts: {
        ui:      { subtotal: "$52.27", impuestos: "$7.84", total: "$60.12" },
        details: [
          { price: "2.192867686054737",  discount: "0", taxedPrice: "2.52",  total: "2.192867686054737",  taxedTotal: "2.521797838962947"  },
          { price: "8.032477843761389",  discount: "0", taxedPrice: "9.24",  total: "8.032477843761388",  taxedTotal: "9.237349520325588"  },
          { price: "32.005575275414735", discount: "0", taxedPrice: "32.01", total: "32.005575275414735", taxedTotal: "32.005575275414735" },
          { price: "3.489917589410983",  discount: "0", taxedPrice: "4.01",  total: "3.489917589410983",  taxedTotal: "4.013405227822633"  },
          { price: "2.695694813349389",  discount: "0", taxedPrice: "3.1",   total: "2.695694813349389",  taxedTotal: "3.100049035351799"  },
          { price: "3.857689654169822",  discount: "0", taxedPrice: "4.44",  total: "3.857689654169821",  taxedTotal: "4.436343102295291"  },
        ],
        summary: { subtotal: "52.274222862161053", total: "60.12" },
      },
    },
    precisionHoliday: {
      allProducts: {
        ui:      { subtotal: "$54.96", impuestos: "$4.49", total: "$59.45" },
        summary: { subtotal: "54.960561242535105", total: "59.45" },
        details: []
      },
      restaurantProducts: {
        ui:      { subtotal: "$52.27", impuestos: "$4.18", total: "$56.46" },
        summary: { subtotal: "52.274222862161053", total: "56.46" },
        details: []
      },
    },
  },
  restaurantTips: {
    tipToType: "3.3337373372323",
    case1: {
      ui: { subtotal: "$36.47", impuestos: "$5.47", total: "$41.94", propina: "$3.33" },
      detail: { price: "2.1221217218712", discount: "0", taxedDiscount: "0", total: "2.1221217218712", taxedTotal: "2.44043998015188", taxedPrice: "2.44" },
      summary: { discount: "0", subtotal: "36.4724643877764", total: "41.94" },
      root: { additional_tip: "3.33" }
    },
    case2: {
      ui: { descuentos: "$1.15", subtotal: "$33.21", impuestos: "$4.98", total: "$38.19", propina: "$3.33" },
      detail: { price: "3.3773263982716", discount: "0.112591191139383", taxedDiscount: "0.12947986981029", total: "3.264735207132217", taxedTotal: "3.754445488202047", taxedPrice: "3.88" },
      summary: { discount: "1.145150198920518", subtotal: "33.205192466984682", total: "38.19" },
      root: { additional_tip: "3.33" }
    },
    case3: {
      ui: { subtotal: "$11.15", impuestos: "$1.67", total: "$12.82", propina: "$3.33" },
      detail: { price: "3.3773263982716", discount: "0", taxedDiscount: "0", total: "3.3773263982716", taxedTotal: "3.88392535801234", taxedPrice: "3.88" },
      summary: { discount: "0", subtotal: "11.1506616619979", total: "12.82" },
      root: { additional_tip: "3.33" }
    },
    case4: {
      ui: { subtotal: "$3.38", impuestos: "$0.51", total: "$3.88", propina: "$3.33" },
      detail: { price: "3.3773263982716", discount: "0", taxedDiscount: "0", total: "3.3773263982716", taxedTotal: "3.88392535801234", taxedPrice: "3.88" },
      summary: { discount: "0", subtotal: "3.3773263982716", total: "3.88" },
      root: { additional_tip: "3.33" }
    },
    case5: {
      ui: { subtotal: "$35.50", impuestos: "$5.32", total: "$40.82", propina: "$3.33" },
      detail: { price: "3.489917589410983", discount: "0", taxedDiscount: "0", total: "3.489917589410983", taxedTotal: "4.013405227822633", taxedPrice: "4.01" },
      summary: { discount: "0", subtotal: "35.495492864825718", total: "40.82" },
      root: { additional_tip: "3.33" }
    }
  }
};
// === inventory-seed.js ===
export const inventorySeed = {
  products: {
    estandar:           { name: "Caja de alitas de pollo (100 u)", code: "Caj000000001", type: "Estandar Fisico"     },
    estandarVirtual:    { name: "Estandar Virtual Test",           code: "Est000000001", type: "Estandar Virtual"    },
    subproducto:        { name: "Alita Individual",                code: "Ali000000001", type: "Subproducto"         },
    preElaborado:       { name: "Bowl de Alitas Marinadas (20 u)", code: "Bow000000001", type: "Pre-Elaborado"       },
    elaborado:          { name: "Porción de Alitas Marinadas",     code: "Por000000001", type: "Elaborado"           },
    combo:              { name: "Combo alitas",                    code: "Com000000019", type: "Combo"               },
    servicio:           { name: "servicio alita",                  code: "ser000000002", type: "Servicio"            },
    serie:              { name: "series test",                     code: "ser000000001", type: "Serie"               },
    tallaColor:         { name: "test talla color",                code: "tes000000002", type: "TallaColor"          },
    tallaColorVariante: { name: "test talla color",                code: "0001",         type: "TallaColor-variante" },
    estandarLargo:      { name: "Alitas de Pollo Crispy Extra Crujientes en Salsa BBQ Ahumada con Miel, Acompañadas de Papas Fritas Artesanales, Aderezo Especial de la Casa y Cebolla Caramelizada", code: "Ali000000002", type: "Estandar Fisico" },
    extraAlitasSinStock: { name: "extra alitas sin stock" },
    extraAlitasStock:    { name: "extra alitas stock" },
  },
  recipeDecimals: {
    elaborado: {
      productName: "Porción de Alitas Marinadas - ToolTip",
      ingredientName: "Bowl de Alitas Marinadas (20 u)",
      exactAmount: "0.74626865671642",
      roundedAmount: "0.75",
    },
    preElaborado: {
      productName: "Bowl de Alitas Marinadas (20 u) - ToolTip",
      ingredientName: "Alita Individual",
      exactAmount: "0.30000300003",
      roundedAmount: "0.3",
    }
  },
  attributes: {
    brand: { name: "Marca Test Automatizado", order: "1", observation: "test" },
    color: { name: "Color Test Automatizado", observation: "Observación de prueba automatizada" },
    size:  { name: "Talla Test Automatizado", observation: "Observación de prueba automatizada" }
  },
  searchTerms: {
    alitas: "alitas"
  },
  categories: {
    extra: { name: "Extras Alitas" }
  }
};
// === people-seed.js ===
export const peopleSeed = {
  clients: {
    test:            { name: "Usuario Test",    cedula: "0000000001" },
    consumidorFinal: { cedula: "0000000001" },
    carrier: {
      cedula:       "1000000001",
      identity:     "1000000001",
      identityType: "CEDULA",
      name:         "Empleado Test 1",
    },
  }
};
// === restaurant-seed.js ===
export const restaurantSeed = {
  restaurant: {
    closeReason: "Cierre de prueba automatizada",
    cleanupReason: "Limpieza automática pre-prueba (Basura residual)",
  }
};
// === sales-seed.js ===
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
// === subscriptions-seed.js ===
export const SEED_SUBSCRIPTIONS = {
  modules: [
    { code: "BN001" },
    { code: "CS001" },
    { code: "VB001" },
    { code: "PS001" },
    { code: "KDS001" },
    { code: "WR001" },
    { code: "DT001" },
    { code: "TS001" },
    { code: "Res001" },
    { code: "S001" },
    { code: "BD008" },
    { code: "SC001" },
    { code: "MW001" },
    { code: "US-001" },
    { code: "AC001" }
  ],
  receipts: [
    { code: "RA101" },
    { code: "RA102" },
    { code: "RA103" },
    { code: "RA012" },
    { code: "RA010" },
    { code: "RA104" },
    { code: "RA011" },
    { code: "RA105" },
    { code: "004" },
    { code: "RA106" },
    { code: "RA013" },
    { code: "RA107" },
    { code: "007" }
  ],
  plans: [
    { code: "AP001" },
    { code: "F0001" },
    { code: "L001" },
    { code: "B001" },
    { code: "P001" },
    { code: "P002" },
    { code: "O001" },
    { code: "I001" }
  ],
  capabilityLabels: [
    "Maneja Restaurantes",
    "Maneja Varios Negocios",
    "Maneja Balanzas",
    "Maneja Subsidios",
    "Maneja Listado de Precios",
    "Maneja Cotizaciones",
    "Multibodegas"
  ],
  moduleLabels: [
    "Suscripción Restaurantes",
    "Balanzas digitales",
    "Módulo para multinegocio"
  ]
};
// === tenant-seed.js ===

export const tenantSeed = {
  subsidiaries: {
    retail:     { name: 'Wanqara Comercios 100', code: '100' },
    dispatch:   { name: 'Wanqara Comercios Dispatch 101', code: '101' },
    restaurant: { name: 'Wanqara 001', code: '102' },
    crud: [
      { type: 'Comercios (Sin Despacho)', name: 'Sucursal Comercios Test', code: '901', isRestaurant: false, hasDispatch: false },
      { type: 'Comercios (Con Despacho)', name: 'Sucursal Despacho Test', code: '902', isRestaurant: false, hasDispatch: true },
      { type: 'Restaurantes (Sin Despacho)', name: 'Sucursal Restaurante Test', code: '903', isRestaurant: true, hasDispatch: false }
    ]
  },
  warehouses: {
    crud: [
      { authType: 'retail', name: 'Bodega Test Ret', code: '1111', address: 'Automated Test Address Ret', description: 'Automated Test Desc Ret' },
      { authType: 'dispatch', name: 'Bodega Test Dis', code: '1112', address: 'Automated Test Address Dis', description: 'Automated Test Desc Dis' },
      { authType: 'restaurant', name: 'Bodega Test Res', code: '1113', address: 'Automated Test Address Res', description: 'Automated Test Desc Res' }
    ]
  },
  dispatchTypes: {
    crud: {
      name: "Tipo Despacho Test",
      type: "Local",
      description: "Test automatizado de tipo de despacho"
    }
  }
};
// === users-seed.js ===
export const usersSeed = {
  crud: {
    name: "test nuevo usuario",
    identity: "1283728939",
    identityType: "CEDULA",
    roleCases: [
      { label: "Cliente", roles: [/^Cliente$/i] },
      { label: "Empleado", roles: [/^Empleado$/i] },
      { label: "Proveedor", roles: [/^Proveedor$/i] },
      { label: "Cliente y Empleado", roles: [/^Cliente$/i, /^Empleado$/i] },
      { label: "Cliente y Proveedor", roles: [/^Cliente$/i, /^Proveedor$/i] },
      { label: "Empleado y Proveedor", roles: [/^Empleado$/i, /^Proveedor$/i] },
      { label: "Cliente, Empleado y Proveedor", roles: [/^Cliente$/i, /^Empleado$/i, /^Proveedor$/i] }
    ]
  }
};

export const SEED = {
  ...tenantSeed,
  ...peopleSeed,
  ...inventorySeed,
  ...financialSeed,
  ...salesSeed,
  ...restaurantSeed,
  ...extrasSeed,
  users: usersSeed,
};

export const getDynamicDocumentType = (authType) => {
  const currentSubsidiary = SEED.subsidiaries[authType].name;
  return currentSubsidiary === "Wanqara 001" 
    ? SEED.documentTypes.facturaElectronica 
    : SEED.documentTypes.recibos;
};

export const getElectronicInvoicingAuthType = () => {
  if (SEED.subsidiaries.retail.name === "Wanqara 001") return "retail";
  if (SEED.subsidiaries.restaurant.name === "Wanqara 001") return "restaurant";
  return "dispatch"; 
};

