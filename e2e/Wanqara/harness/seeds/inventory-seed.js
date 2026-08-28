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
  }
};