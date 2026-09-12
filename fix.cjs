const fs = require('fs');
const path = require('path');

const dir = 'e2e/Wanqara/harness/setups';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => path.join(dir, f));

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/from\s+["']\.\/auth\.js["']/g, 'from "../helpers/auth.js"');
    content = content.replace(/from\s+["']\.\/chef-auth\.js["']/g, 'from "../helpers/chef-auth.js"');
    content = content.replace(/from\s+["']\.\/settings\.js["']/g, 'from "../config/settings.js"');
    content = content.replace(/from\s+["']\.\/seed\.js["']/g, 'from "../config/seed.js"');
    content = content.replace(/from\s+["']\.\/urls\.js["']/g, 'from "../config/urls.js"');
    content = content.replace(/from\s+["']\.\/tenant-setup\.js["']/g, 'from "../preconditions/subsidiary-guarantor.js"');
    fs.writeFileSync(f, content);
    console.log('Fixed', f);
});
