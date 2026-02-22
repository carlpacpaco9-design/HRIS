const fs = require('fs');
const path = require('path');

function fixFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
        const fullPath = path.join(dir, f.name);
        if (f.isDirectory()) {
            fixFiles(fullPath);
        } else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Fix catch (err: any)
            content = content.replace(/catch\s*\(\s*err\s*:\s*any\s*\)/g, 'catch (err: unknown)');

            // We can also fix return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
            // instead of error: err.message
            content = content.replace(/error:\s*err\.message/g, "error: err instanceof Error ? err.message : 'An error occurred'");

            if (original !== content) {
                fs.writeFileSync(fullPath, content);
                console.log(`Fixed ${fullPath}`);
            }
        }
    }
}

fixFiles(path.join(__dirname, 'src'));
console.log("Done");
