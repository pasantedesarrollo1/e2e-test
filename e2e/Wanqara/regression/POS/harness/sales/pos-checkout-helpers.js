
export async function captureSaleMutation(page) {
  return page.waitForRequest(
    (req) =>
      req.method() === "POST" &&
      /\/pos\/sales(\/restaurant)?$/.test(new URL(req.url()).pathname.replace(/\/$/, "")),
    { timeout: 30000 },
  );
}

export async function selectDocumentTypePos(page, documentType) {
  if (!documentType) return;
  const documentTypeSelect = page.locator(".v-select").filter({
    hasText: /Factura|Recibo|Tipo de documento/i,
  }).first();
  
  const currentValue = await documentTypeSelect.innerText();
  
  if (!currentValue.includes(documentType)) {
    await documentTypeSelect.click();
    const option = page.getByRole("option", { name: documentType, exact: true });
    await option.click();
  }
}

export async function clickFinishSale(page) {
  const finishSaleButton = page.getByRole("button", { name: /Terminar Venta/i });
  await finishSaleButton.click({ force: true });
  await page.waitForURL(/\/pos\/(restaurant-)?payments/);
}
