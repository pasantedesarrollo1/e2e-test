import os
path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'sale-options.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'import { test, expect } from "../harness/pos-fixtures.js";\n',
    'import { test, expect } from "../harness/pos-fixtures.js";\nimport { annotateTicket } from "../../../harness/helpers/annotate.js";\n'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
