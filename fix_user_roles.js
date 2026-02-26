const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE users DROP CONSTRAINT IF EXISTS role_check`);
        console.log('Old role_check constraint dropped.');

        await prisma.$executeRawUnsafe(`ALTER TABLE users ADD CONSTRAINT role_check CHECK (role IN ('Admin', 'ProductManager', 'OrderManager', 'Customer', 'Guest'))`);
        console.log('New role_check constraint added with the 4 admin roles + Customer.');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
