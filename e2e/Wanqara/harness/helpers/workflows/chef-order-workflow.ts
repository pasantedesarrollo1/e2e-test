import { searchAndSelectProduct, selectTable, submitOrder } from "@/e2e/Wanqara/regression/POS/POS-R/harness/chef-orders-flow.js";
import { addInStockExtra, confirmExtrasAndAddToCart, openExtrasSelection, validateOutOfStockExtra } from "@/e2e/Wanqara/regression/POS/POS-R/harness/pos-extras-helpers.js";
import type { Page } from "@playwright/test";

export interface ExtraItem {
    category: string;
    extra: string;
    labelText?: string;
}

export class ChefOrderWorkflow {
    private page: Page;
    private productName: string | null = null;
    private extrasToAdd: ExtraItem[] = [];
    private extrasToValidate: ExtraItem[] = [];
    private shouldPrintPreticket: boolean = false;
    private customActions: Array<(page: Page) => Promise<void>> = [];

    constructor(page: Page) {
        this.page = page;
    }

    withProduct(name: string): this {
        this.productName = name;
        return this;
    }

    addExtras(category: string, extrasArray: string[]): this {
        for (const extra of extrasArray) {
            this.extrasToAdd.push({ category, extra });
        }
        return this;
    }
    
    validateOutOfStockExtra(category: string, extra: string, labelText: string): this {
        this.extrasToValidate.push({ category, extra, labelText });
        return this;
    }

    printPreticket(): this {
        this.shouldPrintPreticket = true;
        return this;
    }

    andThen(actionFn: (page: Page) => Promise<void>): this {
        this.customActions.push(actionFn);
        return this;
    }

    async executeOrder(): Promise<string> {
        const { page } = this;
        
        const tableName = await selectTable(page);

        if (this.productName) {
            await searchAndSelectProduct(page, this.productName);
        }

        const allCategories = new Set<string>([
            ...this.extrasToValidate.map(e => e.category),
            ...this.extrasToAdd.map(e => e.category)
        ]);

        for (const category of allCategories) {
            await openExtrasSelection(page, category);
            
            const toValidate = this.extrasToValidate.filter(e => e.category === category);
            for (const item of toValidate) {
                await validateOutOfStockExtra(page, item.extra, item.labelText!);
            }

            const toAdd = this.extrasToAdd.filter(e => e.category === category);
            for (const item of toAdd) {
                await addInStockExtra(page, item.extra);
            }
            
            await confirmExtrasAndAddToCart(page);
        }

        for (const action of this.customActions) {
            await action(page);
        }

        if (this.shouldPrintPreticket) {
            //
        }

        await submitOrder(page);
        
        return tableName;
    }
}
