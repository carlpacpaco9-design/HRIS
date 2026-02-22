const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, 'src');

function renameRecursive(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
        let oldPath = path.join(dir, f.name);
        let newName = f.name;

        if (newName.includes('opcr') || newName.includes('OPCR')) {
            newName = newName.replace(/opcr/g, 'dpcr').replace(/OPCR/g, 'DPCR');
            const newPath = path.join(dir, newName);
            fs.renameSync(oldPath, newPath);
            oldPath = newPath;
        }

        if (fs.statSync(oldPath).isDirectory()) {
            renameRecursive(oldPath);
        }
    }
}

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

console.log("Renaming files and directories...");
renameRecursive(projectDir);

console.log("Replacing content...");
replaceContentRecursive(projectDir);

console.log("Done.");
