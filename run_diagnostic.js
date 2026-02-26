const { exec } = require('child_process');
const fs = require('fs');

console.log('Starting dev server...');
const child = exec('npm run dev', { cwd: 'C:\\Users\\Ibraheem\\Downloads\\project\\shalabi-market-frontend' });

const logStream = fs.createWriteStream('C:\\Users\\Ibraheem\\Downloads\\project\\shalabi-market-patched\\dev_out.log');

child.stdout.pipe(logStream);
child.stderr.pipe(logStream);

child.on('exit', (code) => {
    logStream.write('\nEXIT CODE: ' + code);
    logStream.end();
});
