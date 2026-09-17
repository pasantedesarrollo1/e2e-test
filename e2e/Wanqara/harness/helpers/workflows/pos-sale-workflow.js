
import { PosNormalSaleStrategy } from "./strategies/pos-normal-sale-strategy.js";

/**
 * Patrón Workflow para el Flujo de Ventas POS.
 * Evita tener funciones de configuración gigantes con callbacks.
 * Permite encadenar los pasos de la venta explícitamente.
 */
export class PosSaleWorkflow {
    constructor(page, subsidiaryName, subsidiaryCode, strategy = new PosNormalSaleStrategy()) {
        if (!subsidiaryName) throw new Error("PosSaleWorkflow requiere subsidiaryName explícito (no default fallback).");
        if (!subsidiaryCode) throw new Error("PosSaleWorkflow requiere subsidiaryCode explícito (no default fallback).");

        this.page = page;
        this.subsidiaryName = subsidiaryName;
        this.subsidiaryCode = subsidiaryCode;
        this.strategy = strategy;

        // Estado inicial de la venta
        this.productName = null;
        this.searchTerm = null;
        this.documentType = null;
        this.clientCedula = null;
        this.paymentMethod = null;
        this.printTicket = false;
        this.openDrawer = false;
        this.printPdf = false;
        this.skipNavigation = false;
        this.openingAmount = "";
        this.targetPath = null;

        // Custom actions if complex steps are needed between standard ones
        this.customActions = [];
    }

    /**
     * Construye una instancia del Workflow alimentada por un JSON de Data-Driven Testing.
     */
    static fromJson(page, scenarioData) {
        const workflow = new PosSaleWorkflow(
            page, 
            scenarioData.subsidiaryName, 
            scenarioData.subsidiaryCode
        );
        
        if (scenarioData.documentType) workflow.withDocumentType(scenarioData.documentType);
        if (scenarioData.productName) workflow.withProduct(scenarioData.productName, scenarioData.searchTerm);
        if (scenarioData.clientCedula) workflow.withClient(scenarioData.clientCedula);
        if (scenarioData.paymentMethod) workflow.withPaymentMethod(scenarioData.paymentMethod);
        if (scenarioData.printTicket !== undefined || scenarioData.openDrawer !== undefined || scenarioData.printPdf !== undefined) {
            workflow.withDocumentOptions({
                printTicket: scenarioData.printTicket ?? false,
                openDrawer: scenarioData.openDrawer ?? false,
                printPdf: scenarioData.printPdf ?? false
            });
        }
        
        if (scenarioData.openingAmount) workflow.openingAmount = scenarioData.openingAmount;
        if (scenarioData.targetPath) workflow.withTargetPath(scenarioData.targetPath);
        
        return workflow;
    }

    withoutNavigation() {
        this.skipNavigation = true;
        return this;
    }

    withTargetPath(path) {
        this.targetPath = path;
        return this;
    }

    withDocumentType(type) {
        this.documentType = type;
        return this;
    }

    withOpeningAmount(amount) {
        this.openingAmount = amount;
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

    withDocumentOptions({ printTicket = false, openDrawer = false, printPdf = false } = {}) {
        this.printTicket = printTicket;
        this.openDrawer = openDrawer;
        this.printPdf = printPdf;
        return this;
    }

    andThen(actionFn) {
        this.customActions.push(actionFn);
        return this;
    }

    buildPayload() {
        return Object.freeze({
            page: this.page,
            subsidiaryName: this.subsidiaryName,
            subsidiaryCode: this.subsidiaryCode,
            skipNavigation: this.skipNavigation,
            targetPath: this.targetPath,
            documentType: this.documentType,
            clientCedula: this.clientCedula,
            productName: this.productName,
            searchTerm: this.searchTerm,
            paymentMethod: this.paymentMethod,
            printTicket: this.printTicket,
            openDrawer: this.openDrawer,
            printPdf: this.printPdf,
            openingAmount: this.openingAmount,
            customActions: Object.freeze([...this.customActions]),
        });
    }

    async execute() {
        if (!this.strategy) throw new Error("Strategy is required for execution");
        return this.strategy.execute(this.buildPayload());
    }
}
