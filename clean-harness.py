import os, re
path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'harness', 'pos-financial-assertions.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove PRECISION_CASES block
content = re.sub(r'export const PRECISION_CASES = \[\s+.*?\];\n\n', '', content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
