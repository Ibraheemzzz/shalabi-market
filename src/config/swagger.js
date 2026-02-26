const swaggerJsDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Shalabi Market API',
            version: '1.0.0',
            description: `
## سوق الشلبي — توثيق الـ API

واجهة برمجة تطبيقات متجر سوق الشلبي الإلكتروني.

### المصادقة (Authentication)
استخدم Bearer Token في الـ Header:
\`Authorization: Bearer <token>\`

### الأدوار والصلاحيات (RBAC)
| الدور | الصلاحيات |
|-------|-----------|
| **SuperAdmin** | كل الصلاحيات |
| **Admin** | كل شيء عدا إعدادات النظام |
| **ProductManager** | منتجات + تصنيفات + تقارير |
| **OrderManager** | طلبات + تقارير |
| **Support** | عرض طلبات + مستخدمين |
| **Customer** | شراء وتقييم |
| **Guest** | تصفح فقط |

### رموز الاستجابة
| الكود | المعنى |
|-------|--------|
| 200 | نجاح |
| 201 | تم الإنشاء |
| 400 | خطأ في البيانات |
| 401 | غير مصادق |
| 403 | غير مصرّح |
| 404 | غير موجود |
| 409 | تعارض (مكرّر) |
| 429 | طلبات كثيرة |
| 500 | خطأ في السيرفر |
      `,
            contact: {
                name: 'Shalabi Market Support'
            }
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Development Server'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'أدخل الـ JWT Token'
                }
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object', nullable: true }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        user_id: { type: 'integer' },
                        phone_number: { type: 'string', example: '0599123456' },
                        name: { type: 'string', example: 'أحمد' },
                        role: { type: 'string', enum: ['SuperAdmin', 'Admin', 'ProductManager', 'OrderManager', 'Support', 'Customer', 'Guest'] },
                        permissions: { type: 'array', items: { type: 'string' }, example: ['product.create', 'product.edit'] },
                        points: { type: 'integer' },
                        daily_streak: { type: 'integer' },
                        is_verified: { type: 'boolean' },
                        is_active: { type: 'boolean' }
                    }
                },
                LoginStep1: {
                    type: 'object',
                    required: ['phone_number'],
                    properties: {
                        phone_number: { type: 'string', pattern: '^05\\d{8}$', example: '0599123456', description: '10 أرقام تبدأ بـ 05' }
                    }
                },
                LoginStep2: {
                    type: 'object',
                    required: ['phone_number', 'password'],
                    properties: {
                        phone_number: { type: 'string', example: '0599123456' },
                        password: { type: 'string', example: 'MyPass123' }
                    }
                },
                Register: {
                    type: 'object',
                    required: ['phone_number', 'name', 'password'],
                    properties: {
                        phone_number: { type: 'string', pattern: '^05\\d{8}$', example: '0599123456' },
                        name: { type: 'string', example: 'أحمد محمد' },
                        password: { type: 'string', minLength: 8, example: 'MyPass123', description: '8 أحرف على الأقل، حرف كبير وصغير ورقم' }
                    }
                },
                VerifyOtp: {
                    type: 'object',
                    required: ['phone_number', 'otp_code'],
                    properties: {
                        phone_number: { type: 'string', example: '0599123456' },
                        otp_code: { type: 'string', example: '123456' }
                    }
                },
                ResetPassword: {
                    type: 'object',
                    required: ['phone_number', 'otp_code', 'new_password'],
                    properties: {
                        phone_number: { type: 'string', example: '0599123456' },
                        otp_code: { type: 'string', example: '123456' },
                        new_password: { type: 'string', example: 'NewPass123' }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        product_id: { type: 'integer' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        cost_price: { type: 'number' },
                        stock: { type: 'integer' },
                        category_id: { type: 'integer' },
                        image_url: { type: 'string' },
                        is_active: { type: 'boolean' }
                    }
                },
                Category: {
                    type: 'object',
                    properties: {
                        category_id: { type: 'integer' },
                        name: { type: 'string' },
                        description: { type: 'string' }
                    }
                },
                Order: {
                    type: 'object',
                    properties: {
                        order_id: { type: 'integer' },
                        user_id: { type: 'integer' },
                        status: { type: 'string', enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'] },
                        total: { type: 'number' },
                        final_total: { type: 'number' }
                    }
                }
            }
        },
        tags: [
            { name: 'Auth', description: 'المصادقة — تسجيل، دخول، OTP، استعادة كلمة المرور' },
            { name: 'Users', description: 'الملف الشخصي — تعديل الاسم، كلمة المرور، رقم الهاتف' },
            { name: 'Products', description: 'المنتجات — عرض وبحث' },
            { name: 'Categories', description: 'التصنيفات — عرض' },
            { name: 'Cart', description: 'سلة المشتريات' },
            { name: 'Orders', description: 'الطلبات — إنشاء ومتابعة' },
            { name: 'Reviews', description: 'التقييمات' },
            { name: 'Wishlist', description: 'قائمة الرغبات' },
            { name: 'Admin - Users', description: '👑 إدارة المستخدمين (user.view / user.ban)' },
            { name: 'Admin - Products', description: '👑 إدارة المنتجات (product.create / edit / delete)' },
            { name: 'Admin - Categories', description: '👑 إدارة التصنيفات (category.manage)' },
            { name: 'Admin - Orders', description: '👑 إدارة الطلبات (order.view / update_status)' },
            { name: 'Admin - Reviews', description: '👑 إدارة التقييمات (product.edit)' },
            { name: 'Admin - Reports', description: '👑 التقارير والإحصائيات (report.view)' }
        ]
    },
    apis: ['./src/modules/**/*.routes.js']
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
