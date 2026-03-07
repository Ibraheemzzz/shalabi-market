const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS order_status_check`);
        console.log('Old constraint dropped.');
        await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD CONSTRAINT order_status_check CHECK (status IN ('Created', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'))`);
        console.log('New constraint added with Confirmed status.');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
