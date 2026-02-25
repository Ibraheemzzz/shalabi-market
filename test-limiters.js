const API_URL = 'http://localhost:3001/api';

async function request(endpoint, method = 'POST', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
}

async function run() {
    console.log('--- Testing API Rate Limiters ---');

    try {
        // 1. Test Login Limiter (Max 10 failed attempts)
        console.log('\n[Login Limiter] Triggering > 10 failed login attempts:');
        let loginHitLimit = false;
        for (let i = 1; i <= 12; i++) {
            const res = await request('/auth/login', 'POST', {
                phone_number: '0599999999',
                password: 'wrongpassword'
            });
            console.log(` Attempt ${i}: Status ${res.status}`);
            if (res.status === 429) {
                loginHitLimit = true;
                console.log(` ✅ Successfully triggered 429 Too Many Requests at attempt ${i}:`, res.data.message);
                break;
            }
        }
        if (!loginHitLimit) console.log(' ❌ Failed to hit login rate limit');

        // 2. Test Guest Limiter (Max 5 creations per IP per hour)
        console.log('\n[Guest Limiter] Triggering > 5 guest session creations:');
        let guestHitLimit = false;
        for (let i = 1; i <= 7; i++) {
            const res = await request('/auth/guest', 'POST', {});
            console.log(` Attempt ${i}: Status ${res.status}`);
            if (res.status === 429) {
                guestHitLimit = true;
                console.log(` ✅ Successfully triggered 429 Too Many Requests at attempt ${i}:`, res.data.message);
                break;
            }
        }
        if (!guestHitLimit) console.log(' ❌ Failed to hit guest rate limit');

        console.log('\n--- Rate Limiter Tests Completed ---');
    } catch (err) {
        console.error('Test script failed:', err);
    }
}

run();
