import { configureTenantForAuthType } from "./subsidiary-initializer.js";

/**
 * Patrón Facade: EnvironmentOrchestrator
 * Se encarga de aplicar reconciliación de estado idempotente antes
 * de empezar las pruebas. Toma la configuración deseada y la aplica
 * al Tenant actual, creando o modificando lo que falte.
 */
export async function ensureEnvironmentIsReady(page, businessConfig, authType, tenantBaseUrl) {
    console.log(`[Orchestrator] Validando precondiciones de entorno para: ${authType}...`);
    
    let configChanged = false;

    // 1. Validar y reconciliar estado de la sucursal (Despachos, Tipo de negocio, etc.)
    const subsidiaryChanged = await configureTenantForAuthType(page, { 
        tenantBaseUrl, 
        authType 
    });
    
    if (subsidiaryChanged) configChanged = true;

    // 2. Futuras validaciones (Apertura de Caja, Inventario Mínimo, etc.)
    // if (businessConfig.requireOpenCashRegister) {
    //     await CashRegisterInitializer.ensureOpen(page, tenantBaseUrl, authType);
    // }
    
    // if (businessConfig.requireBaseCatalog) {
    //     await ProductInitializer.ensureBaseCatalog(page, tenantBaseUrl);
    // }

    return configChanged;
}
