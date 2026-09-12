import os, re
path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'sale-financial-precision.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove SEED from imports
content = re.sub(r'import \{ SEED \} from \".+?/seed\.js\";\n', '', content)

# Update PRECISION_CASES import 
content = content.replace('PRECISION_CASES,\n', '')

# Remove mappedSurchargeProducts logic that uses SEED
content = re.sub(r'    const mappedSurchargeProducts = scenario\.surchargeProducts\.map\(.*?\}\)\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'    const surchargePrecision = .*?;\n', '', content, flags=re.DOTALL)
content = re.sub(r'    const surchargePrecisionHoliday = .*?;\n', '', content, flags=re.DOTALL)

# In the runAllProductsSurchargeFlow function:
content = content.replace('await test.step(`Apply ${SEED.surcharge.name}`, async () => {', 'await test.step(`Apply ${surchargeName}`, async () => {')

content = content.replace(
    'async function runAllProductsSurchargeFlow(page, { productsToAdd, precision, precisionHoliday, requiresClient }) {',
    'async function runAllProductsSurchargeFlow(page, { productsToAdd, precision, precisionHoliday, requiresClient, surchargeName }) {'
)

# Replace the describe titles
content = re.sub(r'POS \$\{scenario\.description\} - Financial Calculation Accuracy with \$\{SEED\.discount\.name\}', 'POS ${scenario.description} - Financial Calculation Accuracy with ${scenario.discountName}', content)
content = re.sub(r'POS \$\{scenario\.description\} - Financial Calculation Accuracy with \$\{SEED\.surcharge\.name\}', 'POS ${scenario.description} - Financial Calculation Accuracy with ${scenario.surchargeName}', content)

# Iterate over scenario.discountCases instead of PRECISION_CASES
content = content.replace(
    'for (const { key, product, afterProductSelect } of PRECISION_CASES) {',
    'for (const { key, product, afterProductSelect, precision, precisionHoliday } of scenario.discountCases) {'
)

# And update runFinancialPrecisionFlow params:
content = content.replace(
'''          await runFinancialPrecisionFlow(page, {
            product,
            afterProductSelect,
            applyModifier: applyGeneralDiscount,
            precision: SEED.discount.precision[key],
            precisionHoliday: SEED.discount.precisionHoliday
              ? SEED.discount.precisionHoliday[key]
              : undefined,
          });''',
'''          await runFinancialPrecisionFlow(page, {
            product,
            afterProductSelect,
            applyModifier: applyGeneralDiscount,
            precision,
            precisionHoliday,
          });'''
)

# And in the runAllProductsSurchargeFlow execution:
content = content.replace(
'''        await runAllProductsSurchargeFlow(page, {
          productsToAdd: mappedSurchargeProducts,
          precision: surchargePrecision,
          precisionHoliday: surchargePrecisionHoliday,
          requiresClient: SEED.clients.consumidorFinal.cedula,
        });''',
'''        
        const mappedSurchargeProducts = scenario.surchargeProducts.map(sp => ({
          product: { type: sp.productType, name: sp.productName },
          afterSelect: sp.afterSelectFn ? functionMap[sp.afterSelectFn] : null
        }));

        await runAllProductsSurchargeFlow(page, {
          productsToAdd: mappedSurchargeProducts,
          precision: scenario.surchargePrecision,
          precisionHoliday: scenario.surchargePrecisionHoliday,
          requiresClient: scenario.surchargeClientCedula,
          surchargeName: scenario.surchargeName,
        });'''
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
