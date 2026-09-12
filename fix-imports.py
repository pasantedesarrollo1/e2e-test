import os
path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'POS-C', 'sale-inventory-dispatch.spec.js')
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the import line first
content = content.replace('import { runPosSaleFlow } from "../harness/pos-sale-flow.js";\nimport { selectFirstVariant, selectFirstSerie } from "../harness/pos-products.js";\n', '')

# Insert it before CALLBACK_MAP
content = content.replace('const CALLBACK_MAP = {', 
'''import { runPosSaleFlow } from "../harness/pos-sale-flow.js";
import { selectFirstVariant, selectFirstSerie } from "../harness/pos-products.js";

const CALLBACK_MAP = {''')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
