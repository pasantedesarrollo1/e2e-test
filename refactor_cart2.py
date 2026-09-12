import os, re
path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'sale-cart.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace getDynamicDocumentType invocation
content = content.replace('getDynamicDocumentType(scenario.authType)', 'scenario.cartParams.dynamicDocumentType')

# Remove SEED, getDynamicDocumentType import
content = re.sub(r'import \{ SEED, getDynamicDocumentType \} from \".+?/seed\.js\";\n', '', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
