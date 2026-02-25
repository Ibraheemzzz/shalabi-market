const { execSync } = require('child_process');
console.log('Starting npm install...');
try {
    console.log(execSync('npm install', { encoding: 'utf-8' }));
    console.log('npm install finished');
} catch (e) {
    console.error('Error running npm install:', e.message);
}
