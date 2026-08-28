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
};