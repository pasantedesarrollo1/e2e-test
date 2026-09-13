
export const extrasSeed = {
  extrasManager: {
    category: {
      name: "Extras Alitas",
    },
    messages: {
      categoryCreated: "Categoría Creada",
      categoryDeleted: "Categoría extra eliminada",
      cannotDelete: "No se puede eliminar una categoría con productos relacionados",
      changesSaved: "Cambios de productos extra guardados",
      relationDeleted: "Relación eliminada",
      noCategories: "Aún no hay categorías",
      loadingProducts: "Cargando productos disponibles",
      outOfStockLabel: "Sin stock disponible"
    }
  }
};

export const financialSeed = {
  discount: {
    rate: "3.3337373372323",
  },
  surcharge: {
    rate: "3.3337373372323",
  }
};

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
    tallaColorVariante: { name: "test talla color",                code: "0001",         type: "TallaColor-variante" }
  }
};

export const peopleSeed = {
  clients: {
    consumidorFinal: { cedula: "0000000001" },
    carrier: {
      cedula:       "1000000001",
      identity:     "1000000001",
      identityType: "CEDULA",
      name:         "Empleado Test 1",
    },
  }
};

export const restaurantSeed = {
  restaurant: {
    cleanupReason: "Limpieza automática pre-prueba (Basura residual)",
  }
};

export const salesSeed = {
  pos: {
    warehouse: "Bodega de Ventas W001",
  },
  documentTypes: {
    facturaElectronica: "Factura electrónica",
    recibos:            "Recibos",
  },
  paymentMethods: {
    efectivo: { label: "EFECTIVO" },
  },
  sale: {
    annulmentReason: "test automatizado de anulación",
  }
};

export const tenantSeed = {
  subsidiaries: {
    retail:     { name: 'Wanqara Comercios 100', code: '100' },
    dispatch:   { name: 'Wanqara Comercios Dispatch 101', code: '101' },
    restaurant: { name: 'Wanqara 001', code: '102' }
  }
};

export const SEED = {
  ...tenantSeed,
  ...peopleSeed,
  ...inventorySeed,
  ...financialSeed,
  ...salesSeed,
  ...restaurantSeed,
  ...extrasSeed
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
