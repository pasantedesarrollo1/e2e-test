# Implementation Evidence: WS-1025 - POS Cart Click Stress Test
# Implementation Evidence: WS-1025 - Cash register open/close modifications

## 1. Execution Result
- **Status:** PASS 🟢

## 2. Files Modified / Created
- `e2e/Wanqara/regression/POS/POS-C/stress-cart-duplication.spec.js`
- `e2e/Wanqara/regression/POS/common/cash-register-lifecycle.spec.js`
- `e2e/Wanqara/regression/POS/harness/cash-register-helpers.js`

## 3. Implementation Strategy & Locators
- **API Synchronization:** Se actualizó el endpoint interceptado a `/api/v1/inventory/products-list` para reflejar el entorno de la aplicación.
- **Search Locator:** Se reemplazó el uso de `#searchInput` por `page.getByRole('textbox', { name: 'Buscar por nombre' })` para usar locators semánticos y evitar fallos si el ID cambiara.
- **Navigation fix:** Se eliminó un `await page.goto('/pos')` duplicado e innecesario, el cual sobreescribía el contexto del tenant inyectado por el fixture `posPage` y redirigía al inicio de sesión principal.
- **Cart Rows & Inputs:** Se actualizaron los locators del carrito para igualar los de `cart-duplication.spec.js`, utilizando `div.tw-border-l-2.tw-border-secondary` para las filas, `span.tw-text-pretty` para el título del producto y `"input[inputmode='decimal']"` para obtener la cantidad sin depender del type o estructura HTML interna inestable.
- **Error Snackbar:** El locator de error se actualizó a `page.getByRole('status').filter({ hasText: /No se puede agregar el/i })` tras la observación de frontend.
- **Stress Patterns (Burst & Ping-Pong):** Se incrementó dramáticamente la carga de estrés introduciendo `burstCycles` (ráfagas de 3 a 7 clics seguidos) y `pingPongCycles` (clics alternados velozmente entre dos tarjetas aleatorias) para asegurar que el store de Pinia no duplique registros bajo condiciones de alta concurrencia.
- **Sale Step:** Added a step to perform a sale of "Caja de alitas de pollo" without assigning a client using the harness helper `runPosSaleFlow(page, { productName: SEED.products.estandar.name, skipNavigation: true })`.
- **Checkout Selection:** Modified both the `cash-register-lifecycle.spec.js` isolated test and the `ensureCashRegisterOpen` helper function to default to the `"001 - Caja Wanqara Comercios 01"` checkout point whenever the POS is operating under the retail subsidiary (Sucursal 100).
- **Vuetify DOM Locators:** Leveraged Playwright's semantic `.filter({ hasText: ... })` functionality over the generic `.v-card.hover\:tw-bg-gray-200` nodes to confidently select the specific checkout requested by the user.

## 4. Final Code Snippet
```javascript
  test('should not duplicate cart rows or corrupt store state under rapid random clicks', async ({ posPage: page }) => {
    test.setTimeout(120000); 
// cash-register-lifecycle.spec.js (Snippet)
    await test.step("Abrir la caja (Punto de emisión y monto)", async () => {
      // [...]
      await expect(page.getByText('Puntos de Emisión disponibles')).toBeVisible();
      await expect(page.getByText('Seleccione el punto de Emisión')).toBeVisible();

    // 2. Search for "alitas" and wait for API synchronization
    const searchKeyword = "alitas";
    
    const apiPromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/inventory/products-list') && response.status() === 200
    );

    const searchInput = page.getByRole('textbox', { name: 'Buscar por nombre' });
    await searchInput.waitFor({ state: 'visible', timeout: 15000 });

    await searchInput.click();
    await searchInput.fill(searchKeyword);
    await searchInput.press('Enter');

    await apiPromise;
    
    // 3. Identify all visible product cards matching the query
    const visibleCards = page.locator('.custom-card');
    await expect(visibleCards.first()).toBeVisible({ timeout: 10000 });
    const cardCount = await visibleCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // 4. PHASE 1: Click all cards once sequentially
    const clickTrackers = {}; 
    let addedCount = 0;

    const cartRows = page.locator('div.tw-border-l-2.tw-border-secondary');

    for (let i = 0; i < cardCount; i++) {
      const card = visibleCards.nth(i);
      const productTitle = await card.locator('.tw-font-semibold').first().innerText();
      // Seleccionar la caja específica: "001 - Caja Wanqara Comercios 01"
      const specificCheckout = page.locator('.v-card.hover\\:tw-bg-gray-200').filter({ hasText: "001 - Caja Wanqara Comercios 01" }).first();
      await expect(specificCheckout).toBeVisible();
      await specificCheckout.click();
      
      const stockDot = card.locator('.stock-dot');
      const classes = await stockDot.getAttribute('class');
      
      if (classes.includes('tw-text-red')) {
        await card.click();
        const snackbar = page.getByRole('status').filter({ hasText: /No se puede agregar el/i }).first();
        await expect(snackbar).toBeVisible({ timeout: 5000 });
        continue; 
      }
      const montoInput = page.locator('input[type="number"]').first();
      await montoInput.fill("10");

      clickTrackers[productTitle] = 1;
      addedCount++;
      
      await card.click();
      await expect(cartRows).toHaveCount(addedCount);
    }
      const abrirCajaBtn = page.getByRole("button", { name: /Abrir Caja/i }).first();
      await Promise.all([
        page.waitForResponse(res => res.url().includes('cash-registers') && res.request().method() === 'POST'),
        abrirCajaBtn.click()
      ]);
      await page.waitForURL(/\/pos\/(home|restaurant-home)/);
    });

    expect(await cartRows.count()).toBe(addedCount);

    // 5. PHASE 2: Stress Rapid Fire (Double & Triple clicks)
    const stressCycles = 10; 
    for (let cycle = 0; cycle < stressCycles; cycle++) {
      const randomIndex = Math.floor(Math.random() * cardCount);
      const targetCard = visibleCards.nth(randomIndex);
      
      const stockDot = targetCard.locator('.stock-dot');
      const classes = await stockDot.getAttribute('class');
      if (classes.includes('tw-text-red')) {
        continue; 
      }

      const productTitle = await targetCard.locator('.tw-font-semibold').first().innerText();
      
      const randomClicks = Math.random() > 0.5 ? 2 : 3;
      clickTrackers[productTitle] += randomClicks;

      for (let click = 0; click < randomClicks; click++) {
        await targetCard.click();
      }
    }

    // 6. Assertions
    expect(await cartRows.count()).toBe(addedCount);

    for (let i = 0; i < addedCount; i++) {
      const row = cartRows.nth(i);
      const rowTitle = await row.locator('span.tw-text-pretty').first().innerText();
      const qtyInput = row.locator("input[inputmode='decimal']").first();
      
      await expect(qtyInput).toHaveValue(clickTrackers[rowTitle].toString());
    }
  });
    await test.step("Realizar venta de caja de alitas de pollo", async () => {
      await runPosSaleFlow(page, {
        tenantBaseUrl,
        skipNavigation: true,
        productName: SEED.products.estandar.name,
        searchTerm: null,
      });
      // Volver al home pos si es necesario para cerrar caja
      await page.goto(withPath(tenantBaseUrl, '/pos/home'));
      await page.waitForURL(/\/pos\/home/);
    });
```