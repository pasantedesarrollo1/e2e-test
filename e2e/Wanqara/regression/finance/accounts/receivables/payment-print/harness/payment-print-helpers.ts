import { expect, type Page } from "@playwright/test";
import { clickTableRowAction } from "@/e2e/Wanqara/harness/helpers/crud/crud-helpers.js";
import { ACTION_TOOLTIPS } from "@/e2e/Wanqara/harness/helpers/ui/action-tooltips.js";
import { fillSingleReceivablePayment, searchReceivableAccount } from "@/e2e/Wanqara/regression/finance/accounts/payments/multiple-payment/harness/multiple-receivables-helpers.js";

export interface PaymentPrintOptions {
  cedula: string;
  amount: string | number;
  description: string;
  paymentMethodRegex: string;
}

export async function processPaymentAndVerifyPrinter(page: Page, { cedula, amount, description, paymentMethodRegex }: PaymentPrintOptions): Promise<void> {
  await searchReceivableAccount(page, cedula);
  
  const firstRow = page.locator(".v-data-table__tr").first();
  await expect(firstRow).toBeVisible({ timeout: 15_000 });
  await clickTableRowAction(page, firstRow, ACTION_TOOLTIPS.receivableAccounts.addPayment);

  const pagarBtn = await fillSingleReceivablePayment(page, {
    amount,
    description,
    paymentMethodRegex: new RegExp(paymentMethodRegex, "i")
  });

  const payPromise = page.waitForResponse(res => 
    res.url().includes('/api/v1/accounting/payments/pay-receivable-account/') && 
    res.status() === 200
  );

  const printerPromise = page.waitForRequest(req => 
    req.url().includes('/receiptPrinter/payment-ticket') && 
    req.method() === 'POST'
  );

  await pagarBtn.click();
  
  await payPromise;
  const printerRequest = await printerPromise;

  const postData = printerRequest.postDataJSON() as { data: { amount: string | number } };
  expect(Number(postData.data.amount)).toBe(parseFloat(String(amount)));
}
