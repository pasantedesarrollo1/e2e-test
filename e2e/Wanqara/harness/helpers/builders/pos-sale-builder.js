import { expect } from "@playwright/test";
import { SEED } from "../../config/seed.js";
import { searchAndSelectProduct } from "../../../regression/POS/harness/pos-search.js";
import { completePayment } from "../../../regression/POS/harness/pos-payment.js";
import { selectClientByCedula } from "../client-helpers.js";
import { ensureCashRegisterOpen } from "../../../regression/POS/harness/cash-register-helpers.js";
import { ensureAuthenticated } from "../auth.js";

/**
 * Patrón Builder para el Flujo de Ventas POS.
 * Evita tener funciones de configuración gigantes con callbacks.
 * Permite encadenar los pasos de la venta explícitamente.
 */
export class PosSaleBuilder {
    constructor(page, tenantBaseUrl, subsidiaryName = "Wanqara Comercios 100") {
        this.page = page;
        this.tenantBaseUrl = tenantBaseUrl;
        this.subsidiaryName = subsidiaryName;

        // Estado inicial de la venta
        this.productName = null;
        this.searchTerm = null;
        this.documentType = null;
        this.clientCedula = null;
        this.paymentMethod = SEED.paymentMethods.efectivo;
        this.printTicket = false;
        this.openDrawer = false;
        this.skipNavigation = false;

        // Custom actions if complex steps are needed between standard ones
        this.customActions = [];
    }

    /**
     * Construye una instancia del Builder alimentada por un JSON de Data-Driven Testing.
     */
    static fromJson(page, tenantBaseUrl, scenarioData) {
        const builder = new PosSaleBuilder(page, tenantBaseUrl);
        
        if (scenarioData.documentType) builder.withDocumentType(scenarioData.documentType);
        if (scenarioData.productName) builder.withProduct(scenarioData.productName, scenarioData.searchTerm);
        if (scenarioData.clientCedula) builder.withClient(scenarioData.clientCedula);
        if (scenarioData.paymentMethod) builder.withPaymentMethod(scenarioData.paymentMethod);
        if (scenarioData.printTicket) builder.withPrintedTicket(scenarioData.openDrawer);
        
        return builder;
    }

    withoutNavigation() {
        this.skipNavigation = true;
        return this;
    }

    withDocumentType(documentType) {
        this.documentType = documentType;
        return this;
    }

    withProduct(productName, searchTerm = null) {
        this.productName = productName;
        this.searchTerm = searchTerm;
        return this;
    }

    withClient(cedula) {
        this.clientCedula = cedula;
        return this;
    }

    withPaymentMethod(paymentMethod) {
        this.paymentMethod = paymentMethod;
        return this;
    }

    withPrintedTicket(openDrawer = false) {
        this.printTicket = true;
        this.openDrawer = openDrawer;
        return this;
    }

    andThen(actionFn) {
        this.customActions.push(actionFn);
        return this;
    }

    async execute() {
        const { page, tenantBaseUrl, subsidiaryName } = this;

        // 1. Navegación y Precondiciones de Caja
        if (!this.skipNavigation) {
            await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/pos/home" });
            await ensureCashRegisterOpen(page, tenantBaseUrl, "10", subsidiaryName);
            await page.waitForURL(/\/pos\/(home|restaurant-home)/);
        }

        // 2. Tipo de Documento
        if (this.documentType) {
            const documentTypeSelect = page.locator(".v-select").filter({
                hasText: /Factura|Recibo|Tipo de documento/i,
            }).first();
            const currentValue = await documentTypeSelect.innerText();
            
            if (!currentValue.includes(this.documentType)) {
                await documentTypeSelect.click();
                const option = page.getByRole("option", { name: this.documentType, exact: true });
                await option.click();
            }
        }

        // 3. Selección de Cliente
        if (this.clientCedula) {
            await selectClientByCedula(page, this.clientCedula);
        }

        // 4. Búsqueda y Selección del Producto
        if (this.productName) {
            await searchAndSelectProduct(page, { name: this.productName, searchTerm: this.searchTerm });
        }

        // 5. Ejecutar Acciones Personalizadas (Descuentos, Notas, etc.)
        for (const action of this.customActions) {
            await action(page);
        }

        // 6. Terminar Venta (Ir al Modal de Pago)
        const finishSaleButton = page.getByRole("button", { name: /Terminar Venta/i });
        await finishSaleButton.click({ force: true });
        await page.waitForURL(/\/pos\/(restaurant-)?payments/);

        // 7. Completar el Pago
        await completePayment(page, { 
            paymentMethod: this.paymentMethod, 
            printTicket: this.printTicket, 
            openDrawer: this.openDrawer 
        });
    }
}
