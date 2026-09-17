
const fs = require("fs");
const path = require("path");
const workspaceDir = "c:/Users/User/Desktop/e2e-test/e2e/Wanqara";

// Task 1: Update Fixtures
const fixtures = [
  { file: "harness/fixtures/pos.fixture.js", old: "page: async", new: "posEnvironment: async", ctx: "pos" },
  { file: "harness/fixtures/admin.fixture.js", old: "page: async", new: "adminApp: async", ctx: "admin" },
  { file: "harness/fixtures/stage.fixture.js", old: "page: async", new: "stageEnvironment: async", ctx: "stage" }
];

fixtures.forEach(f => {
  const p = path.join(workspaceDir, f.file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, "utf8");
    content = content.replace(f.old, f.new);
    content = content.replace(/await use\(page\);/g, `await use({ page, contextType: "${f.ctx}" });`);
    fs.writeFileSync(p, content, "utf8");
    console.log("Updated fixture:", f.file);
  }
});

// Recursive function to get all spec files
function getFiles(dir, ext, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      getFiles(p, ext, fileList);
    } else if (p.endsWith(ext)) {
      fileList.push(p);
    }
  }
  return fileList;
}

const specFiles = getFiles(path.join(workspaceDir, "regression"), ".spec.js");
let updatedCount = 0;

for (const file of specFiles) {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  let envVar = null;
  if (content.includes("fixtures/pos.fixture.js")) envVar = "posEnvironment";
  else if (content.includes("fixtures/admin.fixture.js")) envVar = "adminApp";
  else if (content.includes("fixtures/stage.fixture.js")) envVar = "stageEnvironment";

  if (envVar) {
    const pageRegex = /test\(([^,]+),\s*async\s*\(\{\s*page(,\s*[^}]+)?\s*\}\)\s*=>\s*\{/g;
    content = content.replace(pageRegex, (match, testName, rest) => {
      changed = true;
      const otherArgs = rest ? rest : "";
      return `test(${testName}, async ({ ${envVar}${otherArgs} }) => {\n      const { page } = ${envVar};`;
    });
    
    // For test.describe etc, or raw async functions
    const pageRegex2 = /async\s*\(\{\s*page(,\s*[^}]+)?\s*\}\)\s*=>\s*\{/g;
    content = content.replace(pageRegex2, (match, rest) => {
      if (match.includes("test")) return match; 
      changed = true;
      const otherArgs = rest ? rest : "";
      return `async ({ ${envVar}${otherArgs} }) => {\n      const { page } = ${envVar};`;
    });

    if (changed) {
      fs.writeFileSync(file, content, "utf8");
      updatedCount++;
    }
  }
}
console.log("Updated " + updatedCount + " spec files.");

