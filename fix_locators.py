import os, re

with open('clean_spec.js', 'r', encoding='utf-8') as f:
    orig = f.read()

search_m = re.search(r'const searchByCode = async \(page, \{ fast = false \} = \{\}\) => \{(.*?)\};\s*const clickCard =', orig, re.DOTALL)
search_by_code_body = search_m.group(1)

click_m = re.search(r'const clickCard = async \(page, \{ fast = false \} = \{\}\) => \{(.*?)\};\s*const clickCartPlus =', orig, re.DOTALL)
click_card_body = click_m.group(1)

badge_m = re.search(r'const clickCardBadgePlus = async \(page, \{ fast = false \} = \{\}\) => \{(.*?)\};\s*test\(\"Flow 1', orig, re.DOTALL)
badge_body = badge_m.group(1)

path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'cart-duplication.spec.js')
with open(path, 'r', encoding='utf-8') as f:
    target = f.read()

target = re.sub(r'searchByCode:\s*async\s*\(page,\s*action\)\s*=>\s*\{(.*?)\}(?=\s*,?\s*clickCard:)', 
                'searchByCode: async (page, action) => {' + search_by_code_body.replace('\\\\', '\\\\\\\\') + '}', target, flags=re.DOTALL)

target = re.sub(r'clickCard:\s*async\s*\(page,\s*action\)\s*=>\s*\{(.*?)\}(?=\s*,?\s*clickCartPlus:)', 
                'clickCard: async (page, action) => {' + click_card_body.replace('\\\\', '\\\\\\\\') + '}', target, flags=re.DOTALL)

target = re.sub(r'clickCardBadgePlus:\s*async\s*\(page,\s*action\)\s*=>\s*\{(.*?)\}(?=\s*\}\s*;\s*for)', 
                'clickCardBadgePlus: async (page, action) => {' + badge_body.replace('\\\\', '\\\\\\\\') + '}', target, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(target)
