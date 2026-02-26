// Quick module load test
const fs = require('fs');
let output = '';
try {
    require('./src/modules/users/users.controller');
    output += 'users.controller OK\n';
    require('./src/modules/users/admin.users.routes');
    output += 'admin.users.routes OK\n';
    require('./src/modules/users/users.routes');
    output += 'users.routes OK\n';
    require('./src/modules/orders/orders.controller');
    output += 'orders.controller OK\n';
    require('./src/modules/orders/orders.routes');
    output += 'orders.routes OK\n';
    require('./src/modules/cart/cart.controller');
    output += 'cart.controller OK\n';
    require('./src/modules/cart/cart.routes');
    output += 'cart.routes OK\n';
    require('./src/modules/auth/auth.controller');
    output += 'auth.controller OK\n';
    require('./src/modules/auth/auth.routes');
    output += 'auth.routes OK\n';
    output += '\nALL MODULES LOADED SUCCESSFULLY\n';
} catch (e) {
    output += 'ERROR: ' + e.message + '\n' + e.stack + '\n';
}
fs.writeFileSync('test_result.txt', output);
console.log(output);
process.exit(0);
