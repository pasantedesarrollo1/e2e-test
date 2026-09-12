import os

path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'cash-register-lifecycle.spec.js')
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import re
new_end = '''    await test.step("Cierre de caja con validación de monto", async () => {
      await closeCashRegister(page, tenantBaseUrl, {
        beforeConfirm: async () => {
          await expect(page.getByText('Apertura :')).toBeVisible();
          await expect(page.locator('span').filter({ hasText: scenario.openingAmount }).first()).toBeVisible();
        }
      });
    });
      });
    });
  }
});
'''

# Use regex to find the start of the Cierre step and replace to EOF
pattern = r'    await test\.step\("Cierre de caja.*'
content = re.sub(pattern, new_end, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
