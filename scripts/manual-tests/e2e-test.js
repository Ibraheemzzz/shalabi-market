const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api';

async function request(endpoint, method = 'GET', body = null, token = null) {
    const headers = {};
    if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) {
        options.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
}

async function run() {
    console.log('--- E2E API Test Suite ---');
    let adminToken, customerToken;
    let categoryId, productId, cartId, orderId;

    try {
        // 1. Health Check
        let res = await request('/health');
        console.log(`[Health] ${res.status === 200 ? '✅' : '❌'} - ${res.status}`);

        // 2. Setup Admin User
        const adminPhone = '050' + Math.floor(1000000 + Math.random() * 9000000).toString();
        res = await request('/auth/register', 'POST', {
            phone_number: adminPhone,
            name: 'Admin User',
            password: 'password123'
        });
        console.log(`[Admin Reg] ${res.status === 201 ? '✅' : '❌'} - ${res.status}`, res.data);

        if (res.status === 201) {
            await prisma.user.update({
                where: { phone_number: adminPhone },
                data: { role: 'Admin', is_verified: true }
            });
        }

        res = await request('/auth/login', 'POST', { phone_number: adminPhone, password: 'password123' });
        adminToken = res.data?.data?.token;
        console.log(`[Admin Login] ${adminToken ? '✅' : '❌'} - Token retrieved`);

        // 3. Create Category (Admin)
        res = await request('/admin/categories', 'POST', {
            name: `Category ${Date.now()}`
        }, adminToken);
        categoryId = res.data?.data?.category_id;
        console.log(`[Create Category] ${categoryId ? '✅' : '❌'} - ID: ${categoryId}`);

        // 4. Create Product (Admin)
        res = await request('/admin/products', 'POST', {
            name: `Product ${Date.now()}`,
            price: 15.50,
            cost_price: 10.00,
            sale_type: 'piece',
            stock_quantity: 100,
            category_id: categoryId
        }, adminToken);
        productId = res.data?.data?.product_id;
        console.log(`[Create Product] ${productId ? '✅' : '❌'} - ID: ${productId}`);

        // Adjust Stock
        if (productId) {
            res = await request(`/admin/products/${productId}/stock`, 'POST', {
                quantity_change: 50,
                reason: 'admin_add'
            }, adminToken);
            console.log(`[Adjust Stock] ${res.status === 200 ? '✅' : '❌'} - ${res.status}`);
        }

        // 5. Setup Customer
        const customerPhone = '051' + Math.floor(1000000 + Math.random() * 9000000).toString();
        res = await request('/auth/register', 'POST', {
            phone_number: customerPhone,
            name: 'Customer User',
            password: 'password123'
        });

        // Fetch and verify OTP for customer
        const otpRecord = await prisma.otpCode.findFirst({
            where: { phone_number: customerPhone },
            orderBy: { created_at: 'desc' }
        });

        if (otpRecord) {
            await request('/auth/verify-otp', 'POST', {
                phone_number: customerPhone,
                otp_code: otpRecord.otp_code
            });
        }

        res = await request('/auth/login', 'POST', { phone_number: customerPhone, password: 'password123' });
        customerToken = res.data?.data?.token;
        console.log(`[Customer Setup] ${customerToken ? '✅' : '❌'} - Token retrieved`);

        // 6. Public Lists
        res = await request('/categories');
        console.log(`[List Categories] ${Array.isArray(res.data?.data) ? '✅' : '❌'} - Current count: ${res.data?.data?.length}`);

        res = await request('/products');
        console.log(`[List Products] ${Array.isArray(res.data?.data) || Array.isArray(res.data?.data?.items) ? '✅' : '❌'} - Data:`, res.data?.data?.items?.length || 'unknown');

        // 7. Cart Operations
        res = await request('/cart/items', 'POST', {
            product_id: productId,
            quantity: 2
        }, customerToken);
        console.log(`[Add to Cart] ${res.status === 200 ? '✅' : '❌'} - ${res.status}`);

        res = await request('/cart', 'GET', null, customerToken);
        cartId = res.data?.data?.cart_id;
        console.log(`[Get Cart] ${cartId ? '✅' : '❌'} - Has items: ${res.data?.data?.items?.length > 0}`);

        // 8. Order Placement
        res = await request('/orders', 'POST', {
            items: [{ product_id: productId, quantity: 2 }],
            shipping_city: 'Test City',
            shipping_street: 'Test St',
            shipping_building: 'Bldg 1',
            shipping_phone: customerPhone
        }, customerToken);
        orderId = res.data?.data?.order_id;
        console.log(`[Place Order] ${orderId ? '✅' : '❌'} - Order ID: ${orderId}`);

        // 9. Admin view Orders
        res = await request('/admin/orders/all', 'GET', null, adminToken);
        console.log(`[Admin View Orders] ${Array.isArray(res.data?.data?.orders) || Array.isArray(res.data?.data?.items) || Array.isArray(res.data?.data) ? '✅' : '❌'}`);

        // 10. Cleanup
        console.log('--- Tests Completed ---');
    } catch (err) {
        console.error('❌ Test script failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
