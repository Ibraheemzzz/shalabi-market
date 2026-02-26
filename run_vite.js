const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const cwd = path.join(__dirname, '..', 'shalabi-market-frontend');
const logStream = fs.createWriteStream(path.join(__dirname, 'vite.log'), { flags: 'a' });

const vite = spawn('node', ['./node_modules/vite/bin/vite.js'], { cwd });

vite.stdout.pipe(logStream);
vite.stderr.pipe(logStream);

vite.on('close', (code) => {
    logStream.write(`\nProcess exited with code ${code}\n`);
    logStream.end();
});

console.log('Started vite.js in background');
