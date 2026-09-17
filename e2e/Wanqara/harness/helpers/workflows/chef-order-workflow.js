import { searchAndSelectProduct, selectTable, submitOrder } from "../../../regression/POS/POS-R/harness/chef-orders-flow.js";
import { addInStockExtra, confirmExtrasAndAddToCart, openExtrasSelection, validateOutOfStockExtra } from "../../../regression/POS/POS-R/harness/pos-extras-helpers.js";

/**
 * Patrón Workflow para Orquestación de Cocina (Chef).
 */
export class ChefOrderWorkflow {
    constructor(page) {
        this.page = page;
        this.productName = null;
        this.extrasToAdd = [];
        this.extrasToValidate = [];
        this.shouldPrintPreticket = false;
        this.customActions = [];
    }

    withProduct(name) {
        this.productName = name;
        return this;
    }

    addExtras(category, extrasArray) {
        for (const extra of extrasArray) {
            this.extrasToAdd.push({ category, extra });
        }
        return this;
    }
    
    validateOutOfStockExtra(category, extra, labelText) {
        this.extrasToValidate.push({ category, extra, labelText });
        return this;
    }

    printPreticket() {
        this.shouldPrintPreticket = true;
        return this;
    }

    andThen(actionFn) {
        this.customActions.push(actionFn);
        return this;
    }

    async executeOrder() {
        const { page } = this;
        
        const tableName = await selectTable(page);

        if (this.productName) {
            await searchAndSelectProduct(page, this.productName);
        }

        // Handle validations and additions for extras
        // Group by category to avoid opening the same category sheet multiple times
        const allCategories = new Set([
            ...this.extrasToValidate.map(e => e.category),
            ...this.extrasToAdd.map(e => e.category)
        ]);

        for (const category of allCategories) {
            await openExtrasSelection(page, category);
            
            // Validate first
            const toValidate = this.extrasToValidate.filter(e => e.category === category);
            for (const item of toValidate) {
                await validateOutOfStockExtra(page, item.extra, item.labelText);
            }

            // Add extras
            const toAdd = this.extrasToAdd.filter(e => e.category === category);
            for (const item of toAdd) {
                await addInStockExtra(page, item.extra);
            }
            
            await confirmExtrasAndAddToCart(page);
        }

        for (const action of this.customActions) {
            await action(page);
        }

        // (We pretend to print pre-ticket here if true, depending on the app's real flow)
        if (this.shouldPrintPreticket) {
            // Implementation specific to print pre-ticket
        }

        await submitOrder(page);
        
        return tableName;
    }
}
