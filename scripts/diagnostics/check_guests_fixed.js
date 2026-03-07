require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Guests...");
    const guests = await prisma.guest.findMany({
        orderBy: { created_at: 'desc' },
        take: 3
    });
    console.log("--- 3 Last Guests ---");
    console.log(JSON.stringify(guests, null, 2));

    console.log("\nChecking Guests with phone_number !== null...");
    const guestsWithPhone = await prisma.guest.findMany({
        where: { phone_number: { not: null } },
        orderBy: { created_at: 'desc' },
        take: 3
    });
    console.log("--- Guests with phone ---");
    console.log(JSON.stringify(guestsWithPhone, null, 2));

    console.log("Done.");
}

main().finally(() => prisma.$disconnect());
