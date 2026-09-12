import os, re
path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'sale-cancellation.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove SEED import
content = re.sub(r'import \{ SEED \} from \".+?/seed\.js\";\n', '', content)

# Replace SEED values in runPosSaleFlow
content = content.replace('SEED.products.estandar.name', 'scenario.saleParams.productName')
content = content.replace('SEED.clients.consumidorFinal.cedula', 'scenario.saleParams.clientCedula')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
