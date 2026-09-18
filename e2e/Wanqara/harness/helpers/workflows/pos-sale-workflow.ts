/* eslint-disable */
import { PosNormalSaleStrategy } from "@/e2e/Wanqara/harness/helpers/workflows/strategies/pos-normal-sale-strategy.js";
import type { Page } from "@playwright/test";

export interface PosDocumentOptions {
    printTicket?: boolean;
    openDrawer?: boolean;
    printPdf?: boolean;
}

export interface PosSaleStrategyPayload {
    page: Page;
    subsidiaryName: string;
    subsidiaryCode: string;
    skipNavigation: boolean;
    targetPath: string | null;
    documentType: string | null;
    clientCedula: string | null;
    productName: string | null;
    searchTerm: string | null;
    paymentMethod: string | null;
    printTicket: boolean;
    openDrawer: boolean;
    printPdf: boolean;
    openingAmount: string;
    customActions: ReadonlyArray<(page: Page) => Promise<void>>;
}

export interface PosSaleStrategy {
    execute(payload: PosSaleStrategyPayload): Promise<void>;
}

export class PosSaleWorkflow {
    private page: Page;
    private subsidiaryName: string;
    private subsidiaryCode: string;
    private strategy: PosSaleStrategy;

    private productName: string | null = null;
    private searchTerm: string | null = null;
    private documentType: string | null = null;
    private clientCedula: string | null = null;
    private paymentMethod: string | null = null;
    private printTicket: boolean = false;
    private openDrawer: boolean = false;
    private printPdf: boolean = false;
    private skipNavigation: boolean = false;
    private openingAmount: string = "";
    private targetPath: string | null = null;
    private customActions: Array<(page: Page) => Promise<void>> = [];

    constructor(page: Page, subsidiaryName: string, subsidiaryCode: string, strategy: PosSaleStrategy = new PosNormalSaleStrategy()) {
        if (!subsidiaryName) throw new Error("PosSaleWorkflow requiere subsidiaryName explícito (no default fallback).");
        if (!subsidiaryCode) throw new Error("PosSaleWorkflow requiere subsidiaryCode explícito (no default fallback).");

        this.page = page;
        this.subsidiaryName = subsidiaryName;
        this.subsidiaryCode = subsidiaryCode;
        this.strategy = strategy;
    }

    static fromJson(page: Page, scenarioData: Record<string, any>): PosSaleWorkflow {
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
        
        if (scenarioData.openingAmount) workflow.withOpeningAmount(scenarioData.openingAmount);
        if (scenarioData.targetPath) workflow.withTargetPath(scenarioData.targetPath);
        
        return workflow;
    }

    withoutNavigation(): this {
        this.skipNavigation = true;
        return this;
    }

    withTargetPath(path: string): this {
        this.targetPath = path;
        return this;
    }

    withDocumentType(type: string): this {
        this.documentType = type;
        return this;
    }

    withOpeningAmount(amount: string): this {
        this.openingAmount = amount;
        return this;
    }

    withClient(cedula: string): this {
        this.clientCedula = cedula;
        return this;
    }

    withProduct(name: string, searchTerm: string | null = null): this {
        this.productName = name;
        this.searchTerm = searchTerm;
        return this;
    }

    withPaymentMethod(method: string): this {
        this.paymentMethod = method;
        return this;
    }

    withDocumentOptions({ printTicket = false, openDrawer = false, printPdf = false }: PosDocumentOptions = {}): this {
        this.printTicket = printTicket;
        this.openDrawer = openDrawer;
        this.printPdf = printPdf;
        return this;
    }

    andThen(actionFn: (page: Page) => Promise<void>): this {
        this.customActions.push(actionFn);
        return this;
    }

    buildPayload(): PosSaleStrategyPayload {
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

    async execute(): Promise<void> {
        if (!this.strategy) throw new Error("Strategy is required for execution");
        return this.strategy.execute(this.buildPayload());
    }
}
