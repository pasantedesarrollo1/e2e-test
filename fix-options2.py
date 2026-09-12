import os

path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'sale-options.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the test describe block
content = content.replace(
    'test.describe(`POS ${env.name} - Sale Options @regression`, () => {',
    'test.describe(`POS ${scenario.description} - Sale Options @${scenario.metadata.testScope}`, () => {'
)

# Fix the dynamic import of annotateTicket
content = content.replace(
'''    if (scenario.metadata && scenario.metadata.ws) {
      import("../../../harness/helpers/annotate.js").then(({ annotateTicket }) => {
         annotateTicket(test, scenario.metadata);
      }).catch(() => {});
    }''',
'''    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }'''
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
