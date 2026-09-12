import { expect } from "@playwright/test";
import { searchReceivableAccount, fillSingleReceivablePayment } from "../../../payments/multiple-payment/harness/multiple-receivables-helpers.js";
import { clickTableRowAction } from "../../../../../../harness/helpers/crud-helpers.js";

export async function processPaymentAndVerifyPrinter(page, { cedula, amount, description, paymentMethodRegex }) {
  await searchReceivableAccount(page, cedula);
  
  const firstRow = page.locator(".v-data-table__tr").first();
  await expect(firstRow).toBeVisible({ timeout: 15_000 });
  await clickTableRowAction(page, firstRow, "Agregar Abono");

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

  const postData = printerRequest.postDataJSON();
  expect(postData.data.amount).toBe(parseFloat(amount));
}
