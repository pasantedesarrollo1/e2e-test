const fs = require('fs');

const f = 'e2e/Wanqara/regression/POS/POS-R/harness/pos-orders-common.js';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(/from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/harness\/ui-helpers\.js["']/g, 'from "../../../../harness/helpers/ui-helpers.js"');
content = content.replace(/from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/harness\/auth\.js["']/g, 'from "../../../../harness/helpers/auth.js"');
content = content.replace(/from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/harness\/chef-auth\.js["']/g, 'from "../../../../harness/helpers/chef-auth.js"');
content = content.replace(/from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/harness\/settings\.js["']/g, 'from "../../../../harness/config/settings.js"');
content = content.replace(/from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/harness\/seed\.js["']/g, 'from "../../../../harness/config/seed.js"');

fs.writeFileSync(f, content);
console.log('Fixed', f);
