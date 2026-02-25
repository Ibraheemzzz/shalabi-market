const { execSync } = require('child_process');
const fs = require('fs');
const cmd = process.argv.slice(2).join(' ');
const out = { cmd, timestamp: Date.now() };
try {
    out.stdout = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    out.success = true;
} catch (e) {
    out.success = false;
    out.error = e.message;
    out.stdout = e.stdout ? e.stdout.toString() : '';
    out.stderr = e.stderr ? e.stderr.toString() : '';
}
fs.writeFileSync('output.json', JSON.stringify(out, null, 2));
console.log('Done writing output.json');
