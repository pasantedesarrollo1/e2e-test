const fs = require('fs');
const path = require('path');

const setups = ['retail', 'restaurant', 'dispatch'];
setups.forEach(type => {
  const f = `e2e/Wanqara/harness/setups/${type}.setup.js`;
  if (!fs.existsSync(f)) return;
  
  let content = fs.readFileSync(f, 'utf8');
  
  const injection = `
  // --- INICIO DE CACHÉ INTELIGENTE ---
  if (fs.existsSync(sessionPath)) {
    try {
      const stats = fs.statSync(sessionPath);
      // Validamos si la sesión tiene menos de 12 horas de antigüedad
      const isFresh = (Date.now() - stats.mtimeMs) < 12 * 60 * 60 * 1000;
      const content = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      
      // Si el archivo existe, es reciente y tiene cookies válidas, nos saltamos todo el login
      if (isFresh && content.cookies && content.cookies.length > 0) {
        console.log(\`[Setup] Caché activa encontrada para \${authType}. Saltando login ⚡\`);
        return; 
      }
    } catch (e) {
      console.log(\`[Setup] No se pudo leer la caché para \${authType}, iniciando sesión normalmente...\`);
    }
  }
  // --- FIN DE CACHÉ INTELIGENTE ---
`;

  // Evitamos inyectarlo dos veces
  if (!content.includes('INICIO DE CACHÉ INTELIGENTE')) {
    content = content.replace(
      /fs\.mkdirSync\(path\.dirname\(sessionPath\), \{ recursive: true \}\);/,
      `fs.mkdirSync(path.dirname(sessionPath), { recursive: true });\n${injection}`
    );
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Inyectado caché en ${f}`);
  }
});

// Chef auth setup:
const chefFile = 'e2e/Wanqara/harness/setups/chef-auth.setup.js';
if (fs.existsSync(chefFile)) {
  let content = fs.readFileSync(chefFile, 'utf8');
  const injectionChef = `
  // --- INICIO DE CACHÉ INTELIGENTE ---
  if (fs.existsSync(CHEF_SESSION_PATH)) {
    try {
      const stats = fs.statSync(CHEF_SESSION_PATH);
      const isFresh = (Date.now() - stats.mtimeMs) < 12 * 60 * 60 * 1000;
      const content = JSON.parse(fs.readFileSync(CHEF_SESSION_PATH, 'utf8'));
      if (isFresh && content.cookies && content.cookies.length > 0) {
        console.log(\`[Setup] Caché activa encontrada para CHEF. Saltando login ⚡\`);
        return; 
      }
    } catch (e) {
      // ignore
    }
  }
  // --- FIN DE CACHÉ INTELIGENTE ---
`;
  if (!content.includes('INICIO DE CACHÉ INTELIGENTE')) {
    content = content.replace(
      /fs\.mkdirSync\(path\.dirname\(CHEF_SESSION_PATH\), \{ recursive: true \}\);/,
      `fs.mkdirSync(path.dirname(CHEF_SESSION_PATH), { recursive: true });\n${injectionChef}`
    );
    fs.writeFileSync(chefFile, content, 'utf8');
    console.log(`Inyectado caché en ${chefFile}`);
  }
}
