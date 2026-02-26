// Quick test to check if backend API works
async function test() {
    try {
        const res = await fetch('http://localhost:3001/api/categories');
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }

    try {
        const res2 = await fetch('http://localhost:3001/api/products?limit=8');
        const data2 = await res2.json();
        console.log('\nProducts Status:', res2.status);
        console.log('Products Response:', JSON.stringify(data2, null, 2));
    } catch (e) {
        console.error('Products Error:', e.message);
    }
}
test();
