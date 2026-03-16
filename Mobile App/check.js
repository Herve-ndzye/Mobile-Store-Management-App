const { execSync } = require('child_process');
const fs = require('fs');
try {
    const out = execSync('npx tsc --noEmit', { encoding: 'utf-8' });
    fs.writeFileSync('tsc-out.json', JSON.stringify({ success: true, out }));
} catch (e) {
    fs.writeFileSync('tsc-out.json', JSON.stringify({ success: false, stdout: e.stdout, stderr: e.stderr }));
}
