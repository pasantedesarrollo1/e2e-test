import os
path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'sale-options.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('env.fixture', 'scenario.fixture')
content = content.replace('env.paymentUrl', 'new RegExp(scenario.paymentUrlPattern)')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
