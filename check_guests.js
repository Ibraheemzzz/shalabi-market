const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const guests = await prisma.guest.findMany({
        orderBy: { created_at: 'desc' },
        take: 5
    });
    console.log('--- Last 5 Guests ---');
    console.dir(guests, { depth: null });

    const orders = await prisma.order.findMany({
        orderBy: { order_id: 'desc' },
        take: 3,
        select: {
            order_id: true,
            user_id: true,
            guest_id: true,
            shipping_first_name: true,
            shipping_phone: true
        }
    });
    console.log('--- Last 3 Orders ---');
    console.dir(orders, { depth: null });
}

main().finally(() => prisma.$disconnect());
