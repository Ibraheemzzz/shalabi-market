const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api';

async function request(endpoint, method = 'GET', body = null, token = null) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
}

async function run() {
    console.log('🚀 Starting Comprehensive API Tests (Postman Collection Replica)...');

    let adminToken, userToken, guestToken;
    let categoryId, productId, orderId, reviewId;
    let adminPhone = '050' + Math.floor(1000000 + Math.random() * 9000000).toString();
    let userPhone = '051' + Math.floor(1000000 + Math.random() * 9000000).toString();
    let userId;
    const password = 'password123';

    try {
        console.log('\n================📂 AUTH ================');

        // 1. Register Admin
        await request('/auth/register', 'POST', { phone_number: adminPhone, name: 'Admin User', password });
        let otpRecord = await prisma.otpCode.findFirst({ where: { phone_number: adminPhone }, orderBy: { created_at: 'desc' } });
        await request('/auth/verify-otp', 'POST', { phone_number: adminPhone, otp_code: otpRecord.otp_code });
        await prisma.user.update({ where: { phone_number: adminPhone }, data: { role: 'Admin' } });

        let res = await request('/auth/login', 'POST', { phone_number: adminPhone, password });
        adminToken = res.data.data.token;
        console.log(`[Admin Login] ${adminToken ? '✅' : '❌'}`);

        // 2. Register & Setup Regular User
        await request('/auth/register', 'POST', { phone_number: userPhone, name: 'Regular User', password });
        otpRecord = await prisma.otpCode.findFirst({ where: { phone_number: userPhone }, orderBy: { created_at: 'desc' } });
        await request('/auth/verify-otp', 'POST', { phone_number: userPhone, otp_code: otpRecord.otp_code });

        res = await request('/auth/login', 'POST', { phone_number: userPhone, password });
        userToken = res.data.data.token;
        userId = res.data.data.user.user_id;
        console.log(`[User Login] ${userToken ? '✅' : '❌'}`);

        // 3. Create Guest Session
        res = await request('/auth/guest', 'POST', {});
        guestToken = res.data.data.token;
        console.log(`[Create Guest Session] ${guestToken ? '✅' : '❌'}`);

        // 4. Get Current User
        res = await request('/auth/me', 'GET', null, userToken);
        console.log(`[Get Current User] ${res.status === 200 ? '✅' : '❌'}`);


        console.log('\n================📂 USERS ================');
        res = await request('/users/profile', 'GET', null, userToken);
        console.log(`[Get Profile] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request('/users/profile', 'PUT', { name: 'Updated Name', phone_number: userPhone }, userToken);
        console.log(`[Update Profile] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request('/admin/users', 'GET', null, adminToken);
        console.log(`[Admin - Get All Users] ${res.status === 200 ? '✅' : '❌'}`);

        if (userId) {
            res = await request(`/admin/users/${userId}`, 'GET', null, adminToken);
            console.log(`[Admin - Get User by ID] ${res.status === 200 ? '✅' : '❌'}`);

            res = await request(`/admin/users/${userId}/status`, 'PUT', { is_active: false }, adminToken);
            console.log(`[Admin - Toggle User Status] ${res.status === 200 ? '✅' : '❌'}`);
            await request(`/admin/users/${userId}/status`, 'PUT', { is_active: true }, adminToken); // restore
        }


        console.log('\n================📂 CATEGORIES ================');
        res = await request('/admin/categories', 'POST', { name: `Test Cat ${Date.now()}` }, adminToken);
        categoryId = res.data?.data?.category_id;
        console.log(`[Admin - Create Category] ${categoryId ? '✅' : '❌'}`);

        res = await request(`/admin/categories/${categoryId}`, 'PUT', { name: `Updated Cat ${Date.now()}` }, adminToken);
        console.log(`[Admin - Update Category] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request('/categories');
        console.log(`[Get Category Tree] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request('/categories/list');
        console.log(`[Get Flat Category List] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request(`/categories/${categoryId}`);
        console.log(`[Get Category by ID] ${res.status === 200 ? '✅' : '❌'}`);


        console.log('\n================📂 PRODUCTS ================');
        res = await request('/admin/products', 'POST', {
            name: `Test Product ${Date.now()}`,
            price: 50.00,
            cost_price: 30.00,
            sale_type: 'piece',
            stock_quantity: 10,
            category_id: categoryId
        }, adminToken);
        productId = res.data?.data?.product_id;
        console.log(`[Admin - Create Product] ${productId ? '✅' : '❌'}`);

        res = await request(`/admin/products/${productId}`, 'PUT', { price: 55.00 }, adminToken);
        console.log(`[Admin - Update Product] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request(`/admin/products/${productId}/stock`, 'POST', { quantity_change: 20, reason: 'admin_add' }, adminToken);
        console.log(`[Admin - Adjust Stock] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request(`/admin/products/${productId}/stock-history`, 'GET', null, adminToken);
        console.log(`[Admin - Get Stock History] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request('/products');
        console.log(`[Get Products] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request(`/products/${productId}`);
        console.log(`[Get Product by ID] ${res.status === 200 ? '✅' : '❌'}`);


        console.log('\n================📂 CART ================');
        res = await request('/cart/items', 'POST', { product_id: productId, quantity: 2 }, userToken);
        console.log(`[Add to Cart] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request('/cart', 'GET', null, userToken);
        console.log(`[Get Cart] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request(`/cart/items/${productId}`, 'PUT', { quantity: 3 }, userToken);
        console.log(`[Update Cart Item] ${res.status === 200 ? '✅' : '❌'}`);

        // Add dummy product to test cart item removal
        res = await request('/admin/products', 'POST', { name: `Dummy ${Date.now()}`, price: 10, sale_type: 'piece', stock_quantity: 10, category_id: categoryId }, adminToken);
        const dummyProdId = res.data?.data?.product_id;
        await request('/cart/items', 'POST', { product_id: dummyProdId, quantity: 1 }, userToken);

        res = await request(`/cart/items/${dummyProdId}`, 'DELETE', null, userToken);
        console.log(`[Remove from Cart] ${res.status === 200 ? '✅' : '❌'}`);


        console.log('\n================📂 ORDERS ================');
        res = await request('/orders', 'POST', {
            items: [{ product_id: productId, quantity: 1 }],
            shipping_city: 'City A',
            shipping_street: 'Street B',
            shipping_building: 'Bldg C',
            shipping_phone: userPhone
        }, userToken);
        orderId = res.data?.data?.order_id;
        console.log(`[Place Order] ${orderId ? '✅' : '❌'}`);

        res = await request('/orders', 'GET', null, userToken);
        console.log(`[Get My Orders] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request(`/orders/${orderId}`, 'GET', null, userToken);
        console.log(`[Get Order by ID] ${res.status === 200 ? '✅' : '❌'}`);

        res = await request('/admin/orders/all', 'GET', null, adminToken);
        console.log(`[Admin - Get All Orders] ${res.status === 200 ? '✅' : '❌'}`);

        // Must transition Created → Shipped → Delivered
        res = await request(`/admin/orders/${orderId}/status`, 'PUT', { status: 'Shipped' }, adminToken);
        console.log(`[Admin - Change Order Status → Shipped] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request(`/admin/orders/${orderId}/status`, 'PUT', { status: 'Delivered' }, adminToken);
        console.log(`[Admin - Change Order Status → Delivered] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request(`/admin/orders/${orderId}/history`, 'GET', null, adminToken);
        console.log(`[Admin - Get Order History] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);


        console.log('\n================📂 REVIEWS ================');
        res = await request(`/products/${productId}/reviews`, 'POST', { rating: 5, comment: 'Excellent product!' }, userToken);
        console.log(`[Create Review] ${res.status === 201 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);
        // We know from prisma that user_id and product_id form a composite unique, so we fetch it from db to get ID for testing
        const reviewRecord = await prisma.productReview.findFirst({ where: { user_id: userId, product_id: productId } });
        reviewId = reviewRecord?.review_id;

        res = await request(`/products/${productId}/reviews`, 'GET');
        console.log(`[Get Product Reviews] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        if (reviewId) {
            res = await request(`/reviews/${reviewId}`, 'PUT', { rating: 4, comment: 'Good product' }, userToken);
            console.log(`[Update Review] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

            res = await request(`/admin/reviews`, 'GET', null, adminToken);
            console.log(`[Admin - Get All Reviews] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

            res = await request(`/admin/reviews/${reviewId}/hide`, 'PUT', { is_hidden: true }, adminToken);
            console.log(`[Admin - Toggle Review Visibility] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

            res = await request(`/reviews/${reviewId}`, 'DELETE', null, userToken);
            console.log(`[Delete Review] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);
        } else {
            console.log('Skipping review updates - review creation failed');
        }

        console.log('\n================📂 WISHLIST ================');
        res = await request(`/wishlist/${productId}`, 'POST', null, userToken);
        console.log(`[Add to Wishlist] ${res.status === 200 || res.status === 201 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request(`/wishlist/${productId}`, 'GET', null, userToken);
        console.log(`[Check Wishlist Status] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request('/wishlist', 'GET', null, userToken);
        console.log(`[Get Wishlist] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request(`/wishlist/${productId}`, 'DELETE', null, userToken);
        console.log(`[Remove from Wishlist] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);


        console.log('\n================📂 REPORTS (ADMIN) ================');
        res = await request('/admin/reports/dashboard-summary', 'GET', null, adminToken);
        console.log(`[Dashboard Summary] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request('/admin/reports/sales', 'GET', null, adminToken);
        console.log(`[Sales Report] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request('/admin/reports/top-products', 'GET', null, adminToken);
        console.log(`[Top Products] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request('/admin/reports/low-stock', 'GET', null, adminToken);
        console.log(`[Low Stock Products] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request('/admin/reports/category-sales', 'GET', null, adminToken);
        console.log(`[Category Sales] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request('/admin/reports/order-status', 'GET', null, adminToken);
        console.log(`[Order Status Distribution] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request('/admin/reports/profit', 'GET', null, adminToken);
        console.log(`[Profit Report] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        console.log('\n================📂 CLEANUP ================');

        // Clean Cart first
        res = await request('/cart', 'DELETE', null, userToken);
        console.log(`[Clear Cart] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        // Delete order-related data via Prisma (order_items FK blocks product/category delete)
        if (orderId) {
            await prisma.orderStatusHistory.deleteMany({ where: { order_id: orderId } });
            await prisma.payment.deleteMany({ where: { order_id: orderId } });
            await prisma.orderItem.deleteMany({ where: { order_id: orderId } });
            await prisma.order.delete({ where: { order_id: orderId } });
            console.log(`[Cleanup Order Data] ✅`);
        }

        // Now safe to delete products and category
        res = await request(`/admin/products/${dummyProdId}`, 'DELETE', null, adminToken);
        console.log(`[Admin - Delete Dummy Product] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request(`/admin/products/${productId}`, 'DELETE', null, adminToken);
        console.log(`[Admin - Delete Product] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        res = await request(`/admin/categories/${categoryId}`, 'DELETE', null, adminToken);
        console.log(`[Admin - Delete Category] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        // Logout
        res = await request('/auth/logout', 'POST', null, userToken);
        console.log(`[Logout] ${res.status === 200 ? '✅' : '❌ ' + JSON.stringify(res.data)}`);

        console.log('\n🎉 Comprehensive Tests Completed!');

    } catch (err) {
        console.error('\n❌ Test script failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
