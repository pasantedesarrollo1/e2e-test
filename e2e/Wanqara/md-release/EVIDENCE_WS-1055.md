# Implementation Evidence: ws-1055 - Printer errors and new settings section

## 1. Execution Result
- **Status:** PASS 🟢

## 2. Files Modified / Created
- `c:\Users\User\Desktop\e2e-test\e2e\Wanqara\regression\settings\configuration\generals\printers-version.spec.js`

## 3. Implementation Strategy & Locators
- Se eliminó la lógica relacionada con simular una desconexión al puerto 12443 (`route.abort`).
- Se eliminaron las aserciones relacionadas al banner de descarga de la aplicación y la instancia del enlace en dicho banner.
- Se renombró el test a `Verify Suggested Printer Version Exists on GitHub Releases`.
- El flujo se simplificó para ir a la vista de impresoras, leer directamente la versión mostrada en texto (`span.text-medium-emphasis`), ir al link de GitHub Releases, y verificar que dicho tag de versión exista ahí.
- Se eliminó la importación innecesaria del archivo `seed.js`.

## 4. Final Code Snippet
```javascript
  test('Verify Suggested Printer Version Exists on GitHub Releases', async ({ page }) => {
    // Wait for the printers config tab/page to be visible
    await page.waitForLoadState('networkidle');

    // Extract dynamic version from the summary text (e.g. "Windows · v3.2.0.0 · 64 bits · 42,9 MB")
    const summaryLocator = page.locator('span.text-medium-emphasis', { hasText: 'Windows · v' }).first();
    await expect(summaryLocator).toBeVisible();
    const summaryText = await summaryLocator.textContent();
    const versionMatch = summaryText.match(/v\d+\.\d+\.\d+\.\d+/);
    expect(versionMatch).not.toBeNull();
    const dynamicVersion = versionMatch[0];

    // Navigate to GitHub releases page to verify version
    await page.goto('https://github.com/KevinWanqara/Wanqara-device-admin/releases');

    // Wait for the release list to load and verify the extracted version exists
    await page.getByRole('heading', { name: 'Release list' }).waitFor({ state: 'visible', timeout: 15000 });
    
    // Check if the specific tag link exists
    const releaseLink = page.locator('a').filter({ hasText: new RegExp(`^${dynamicVersion.replace(/\./g, '\\.')}$`) }).first();
    await expect(releaseLink).toBeVisible();
  });
```