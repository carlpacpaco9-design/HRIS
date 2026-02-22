const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, 'src');

function replaceContentRecursive(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
        const fullPath = path.join(dir, f.name);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceContentRecursive(fullPath);
        } else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx') || f.name.endsWith('.css') || f.name.endsWith('.json')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content.replace(/OPCR/g, 'DPCR').replace(/opcr/g, 'dpcr');
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`Updated content: ${fullPath}`);
            }
        }
    }
}

console.log("Replacing content...");
replaceContentRecursive(projectDir);
console.log("Done.");
