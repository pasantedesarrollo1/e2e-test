import fs from 'fs';
import path from 'path';

export async function extractFinancialData(page, scenarioName) {
  console.log(`\n[EXTRACTOR] Evaluando activación para: "${scenarioName}" | EXTRACT_FINANCIALS = ${process.env.EXTRACT_FINANCIALS}`);
  
  if (process.env.EXTRACT_FINANCIALS !== 'true') {
    console.log(`[EXTRACTOR] 🚫 Omitido. La variable de entorno no es 'true'.`);
    return;
  }

  console.log(`[EXTRACTOR] 🚀 ¡Activado! Escuchando red para atrapar el cobro...`);

  page.on('request', request => {
    const url = request.url();
    const method = request.method();

    if (url.includes('/api/') && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      if (!url.includes('/sales') && !url.includes('/orders') && !url.includes('/payments')) return;

      console.log(`[EXTRACTOR] 🔎 Petición interesante detectada: ${method} ${url}`);
      
      try {
        const postData = request.postDataJSON();
        console.log(`[EXTRACTOR] 📦 Payload de la petición contiene las llaves:`, postData ? Object.keys(postData) : 'Ninguna');

        if (postData && postData.summary && postData.details && postData.details.length > 0) {
          console.log(`[EXTRACTOR] ✅ ¡Payload financiero encontrado! Procesando datos...`);
          
          const summary = postData.summary;
          const detail = postData.details[0]; 
          const tipRaw = postData.additional_tip;
          
          const toCurrency = (val) => val ? `$${parseFloat(val).toFixed(2)}` : "$0.00";

          let impuestosCalc = 0;
          if (summary.total && summary.subtotal) {
            impuestosCalc = parseFloat(summary.total) - parseFloat(summary.subtotal);
          }

          const extracted = {
            ui: {
              descuentos: summary.discount ? toCurrency(summary.discount) : undefined,
              subtotal: toCurrency(summary.subtotal),
              impuestos: toCurrency(impuestosCalc),
              total: toCurrency(summary.total),
              propina: (tipRaw !== undefined && tipRaw !== null) ? toCurrency(tipRaw) : undefined
            },
            detail: {
              price: detail.price ? String(detail.price) : undefined,
              discount: detail.discount ? String(detail.discount) : undefined,
              taxedDiscount: detail.taxedDiscount ? String(detail.taxedDiscount) : undefined,
              total: detail.total ? String(detail.total) : undefined,
              taxedTotal: detail.taxedTotal ? String(detail.taxedTotal) : undefined,
              taxedPrice: detail.taxedPrice ? String(detail.taxedPrice) : undefined
            },
            summary: {
              discount: summary.discount ? String(summary.discount) : undefined,
              subtotal: summary.subtotal ? String(summary.subtotal) : undefined,
              total: summary.total ? String(summary.total) : undefined,
              additional_tip: (tipRaw !== undefined && tipRaw !== null) ? String(tipRaw) : undefined
            }
          };

          Object.keys(extracted.ui).forEach(key => extracted.ui[key] === undefined && delete extracted.ui[key]);
          Object.keys(extracted.detail).forEach(key => extracted.detail[key] === undefined && delete extracted.detail[key]);
          Object.keys(extracted.summary).forEach(key => extracted.summary[key] === undefined && delete extracted.summary[key]);

          const outFilePath = path.resolve(process.cwd(), 'extracted-financial-seeds.json');
          const outputObj = { [scenarioName]: extracted };
          
          fs.appendFileSync(outFilePath, JSON.stringify(outputObj, null, 2) + ',\n');
          console.log(`[EXTRACTOR] 🟢 Datos extraídos y guardados en: ${outFilePath}`);
        } else {
          console.log(`[EXTRACTOR] ⚠️ El payload no contiene 'summary' o 'details'. Se ignora.`);
        }
      } catch (error) {
        console.log(`[EXTRACTOR] ❌ Error al leer o procesar el JSON de la petición:`, error.message);
      }
    }
  });
}
