import os, re
path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'sale-cart.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace addStandardProduct to accept productName
content = content.replace(
    'async function addStandardProduct(page) {\n  await searchAndSelectProduct(page, { name: SEED.products.estandar.name });\n}',
    'async function addStandardProduct(page, productName) {\n  await searchAndSelectProduct(page, { name: productName });\n}'
)

# Update calls to addStandardProduct(page) to addStandardProduct(page, scenario.cartParams.productName)
content = content.replace('await addStandardProduct(page);', 'await addStandardProduct(page, scenario.cartParams.productName);')

# Replace restrictedAmount
content = content.replace('SEED.sale.restrictedAmount', 'scenario.cartParams.restrictedAmount')

# Replace test.cedula
content = content.replace('SEED.clients.test.cedula', 'scenario.cartParams.testClientCedula')

# Replace productName in dynamic doc type block
content = content.replace('productName: SEED.products.estandar.name,', 'productName: scenario.cartParams.productName,')

# Remove SEED from imports completely if getDynamicDocumentType is also removed? 
# Wait, getDynamicDocumentType is imported from seed.js. 
# "no tome nada de los seed" means I should not import `getDynamicDocumentType` either!
# How do we handle dynamicDocumentType? It should be passed in JSON.
