import os, re
path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'pos-cross-sales.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove SEED import
content = re.sub(r'import \{ SEED \} from \".+?/seed\.js\";\n', '', content)

# Replace SEED values in retail-sale
content = content.replace('SEED.documentTypes.recibos', 'scenario.saleParams.documentType')
content = content.replace('SEED.products.estandar.name', 'scenario.saleParams.productName')
content = content.replace('SEED.paymentMethods.efectivo', 'scenario.saleParams.paymentMethod')

# Replace createChefOrder to pass params
content = content.replace('await createChefOrder(chefPage);', 'await createChefOrder(chefPage, { productName: scenario.chefOrderParams.productName });')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
