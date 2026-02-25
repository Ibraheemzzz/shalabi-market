const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

async function runTest() {
    console.log('--- Testing OTP Registration Flow ---');

    // Random phone number
    const phoneNumber = `059${Math.floor(1000000 + Math.random() * 8999999)}`;
    const password = 'securepassword123';

    try {
        // 1. Register User
        console.log(`\n1. Registering new user (${phoneNumber})...`);
        const regRes = await request('/auth/register', 'POST', {
            phone_number: phoneNumber,
            name: 'OTP Test User',
            password
        });
        console.log(`   Response Status: ${regRes.status}`);
        console.log(`   Message: ${regRes.data?.message}`);

        if (regRes.status !== 201) throw new Error('Registration failed');

        // 2. Attempt Login (Should fail because unverified)
        console.log(`\n2. Attempting login before verification...`);
        const loginFailRes = await request('/auth/login', 'POST', {
            phone_number: phoneNumber,
            password
        });
        console.log(`   Response Status: ${loginFailRes.status}`);
        console.log(`   Message: ${loginFailRes.data?.message}`);

        if (loginFailRes.status !== 403 || !loginFailRes.data.message.includes('not verified')) {
            throw new Error('Login should have been blocked for unverified user');
        }

        // 3. Get OTP from Database directly (since we are testing)
        console.log(`\n3. Fetching OTP from database...`);
        const otpRecord = await prisma.otpCode.findFirst({
            where: { phone_number: phoneNumber },
            orderBy: { created_at: 'desc' }
        });
        console.log(`   Retrieved OTP: ${otpRecord?.otp_code}`);

        if (!otpRecord) throw new Error('OTP not found in DB');

        // 4. Verify OTP
        console.log(`\n4. Verifying OTP...`);
        const verifyRes = await request('/auth/verify-otp', 'POST', {
            phone_number: phoneNumber,
            otp_code: otpRecord.otp_code
        });
        console.log(`   Response Status: ${verifyRes.status}`);

        if (verifyRes.status !== 200 || !verifyRes.data?.data?.token) {
            throw new Error('OTP Verification failed or no token returned');
        }
        console.log('   ✅ Verification successful! Token received.');

        // 5. Attempt Login again (Should succeed)
        console.log(`\n5. Attempting login after verification...`);
        const loginPassRes = await request('/auth/login', 'POST', {
            phone_number: phoneNumber,
            password
        });
        console.log(`   Response Status: ${loginPassRes.status}`);

        if (loginPassRes.status !== 200 || !loginPassRes.data?.data?.token) {
            throw new Error('Login failed after verification');
        }
        console.log('   ✅ Login successful!');

        console.log('\n--- All OTP Tests Passed Successfully! ---');

    } catch (error) {
        console.error('\n❌ Test Flow Failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
