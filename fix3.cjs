const fs = require('fs');

const f = 'e2e/Wanqara/regression/POS/harness/pos-sale-flow.js';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(/from\s+["']\.\.\/\.\.\/\.\.\/harness\/seed\.js["']/g, 'from "../../../harness/config/seed.js"');
content = content.replace(/from\s+["']\.\.\/\.\.\/\.\.\/harness\/urls\.js["']/g, 'from "../../../harness/config/urls.js"');
content = content.replace(/from\s+["']\.\.\/\.\.\/\.\.\/harness\/auth\.js["']/g, 'from "../../../harness/helpers/auth.js"');
content = content.replace(/from\s+["']\.\.\/\.\.\/\.\.\/harness\/client-helpers\.js["']/g, 'from "../../../harness/helpers/client-helpers.js"');

fs.writeFileSync(f, content);
console.log('Fixed', f);
