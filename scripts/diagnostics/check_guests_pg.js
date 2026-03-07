require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    await client.connect();
    console.log("Connected to Supabase.");

    const res = await client.query('SELECT guest_id, name, phone_number, created_at FROM guests ORDER BY created_at DESC LIMIT 5;');
    console.log("--- Last 5 Guests ---");
    console.table(res.rows);

    const res2 = await client.query('SELECT * FROM guests WHERE phone_number IS NOT NULL ORDER BY created_at DESC LIMIT 5;');
    console.log("--- Last 5 Guests with phone ---");
    console.table(res2.rows);

    const res3 = await client.query('SELECT * FROM orders ORDER BY order_id DESC LIMIT 3;');
    console.log("--- Last 3 Orders ---");
    console.table(res3.rows.map(r => ({ order_id: r.order_id, guest_id: r.guest_id, user_id: r.user_id, phone: r.shipping_phone })));

    await client.end();
}

main().catch(console.error);
