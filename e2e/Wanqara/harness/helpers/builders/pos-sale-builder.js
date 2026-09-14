import { ensureAuthenticated } from "../auth/auth.js";
import { selectClientByCedula } from "../people/client-helpers.js";
import { playwrightHarness } from "../../config/settings.js";

/**
 * Patrón Builder para el Flujo de Ventas POS.
 * Evita tener funciones de configuración gigantes con callbacks.
 * Permite encadenar los pasos de la venta explícitamente.
 */
export class PosSaleBuilder {
    constructor(page, tenantBaseUrl, subsidiaryName = playwrightHarness.subsidiaries.retail, deps = {}) {
        this.page = page;
        this.tenantBaseUrl = tenantBaseUrl;
        this.subsidiaryName = subsidiaryName;

        this._ensureCashRegisterOpen = deps.ensureCashRegisterOpen;
        this._completePayment = deps.completePayment;
        this._searchAndSelectProduct = deps.searchAndSelectProduct;

        // Estado inicial de la venta
        this.productName = null;
        this.searchTerm = null;
        this.documentType = null;
        this.clientCedula = null;
        this.paymentMethod = null;
        this.printTicket = false;
        this.openDrawer = false;
        this.skipNavigation = false;
        this.authType = "retail"; // Default as POS is mostly retail, but overrideable
        this.openingAmount = playwrightHarness.defaults.openingAmount;

        // Custom actions if complex steps are needed between standard ones
        this.customActions = [];
    }

    /**
     * Construye una instancia del Builder alimentada por un JSON de Data-Driven Testing.
     */
    static fromJson(page, tenantBaseUrl, scenarioData, deps = {}) {
        const builder = new PosSaleBuilder(page, tenantBaseUrl, scenarioData.subsidiaryName || playwrightHarness.subsidiaries.retail, deps);
        
        if (scenarioData.documentType) builder.withDocumentType(scenarioData.documentType);
        if (scenarioData.productName) builder.withProduct(scenarioData.productName, scenarioData.searchTerm);
        if (scenarioData.clientCedula) builder.withClient(scenarioData.clientCedula);
        if (scenarioData.paymentMethod) builder.withPaymentMethod(scenarioData.paymentMethod);
        if (scenarioData.printTicket) builder.withPrintedTicket(scenarioData.openDrawer);
        
        if (scenarioData.authType) builder.authType = scenarioData.authType;
        if (scenarioData.openingAmount) builder.openingAmount = scenarioData.openingAmount;
        
        return builder;
    }

    withoutNavigation() {
        this.skipNavigation = true;
        return this;
    }

    withDocumentType(type) {
        this.documentType = type;
        return this;
    }

    withClient(cedula) {
        this.clientCedula = cedula;
        return this;
    }

    withProduct(name, searchTerm = null) {
        this.productName = name;
        this.searchTerm = searchTerm;
        return this;
    }

    withPaymentMethod(method) {
        this.paymentMethod = method;
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
            await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/pos/home", authType: this.authType });
            if (!this._ensureCashRegisterOpen) throw new Error("ensureCashRegisterOpen helper not injected in Builder.");
            await this._ensureCashRegisterOpen(page, tenantBaseUrl, this.openingAmount, subsidiaryName, this.authType);
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
            if (!this._searchAndSelectProduct) throw new Error("searchAndSelectProduct helper not injected in Builder.");
            await this._searchAndSelectProduct(page, { name: this.productName, searchTerm: this.searchTerm });
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
        if (!this.paymentMethod) throw new Error("Payment method must be explicitly provided from JSON");
        if (!this._completePayment) throw new Error("completePayment helper not injected in Builder.");
        await this._completePayment(page, { 
            paymentMethod: this.paymentMethod, 
            printTicket: this.printTicket, 
            openDrawer: this.openDrawer 
        });
    }
}
