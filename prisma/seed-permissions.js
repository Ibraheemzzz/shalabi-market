require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * RBAC Permissions Seed
 * Seeds all permissions and role-permission mappings
 */

const PERMISSIONS = [
    { code: 'product.create', description: 'إنشاء منتج جديد' },
    { code: 'product.edit', description: 'تعديل منتج' },
    { code: 'product.delete', description: 'حذف منتج' },
    { code: 'product.view_all', description: 'عرض جميع المنتجات (بما فيها المخفية)' },
    { code: 'category.manage', description: 'إدارة التصنيفات (إنشاء/تعديل/حذف)' },
    { code: 'order.view', description: 'عرض جميع الطلبات' },
    { code: 'order.update_status', description: 'تغيير حالة الطلبات' },
    { code: 'order.cancel', description: 'إلغاء طلبات' },
    { code: 'user.view', description: 'عرض قائمة المستخدمين' },
    { code: 'user.edit', description: 'تعديل بيانات المستخدمين' },
    { code: 'user.ban', description: 'تفعيل/تعطيل حساب مستخدم' },
    { code: 'report.view', description: 'عرض التقارير والإحصائيات' },
    { code: 'coupon.manage', description: 'إدارة الكوبونات' },
    { code: 'settings.manage', description: 'إدارة إعدادات النظام' },
];

// Role → permission codes mapping (5-tier system)
const ROLE_PERMISSIONS = {
    SuperAdmin: PERMISSIONS.map(p => p.code), // All permissions

    ProductManager: [
        'product.create', 'product.edit', 'product.delete', 'product.view_all',
        'category.manage',
        'report.view'
    ],

    OrderManager: [
        'order.view', 'order.update_status', 'order.cancel',
        'report.view'
    ],

    Customer: [],
    Guest: []
};

async function seed() {
    console.log('🔐 Seeding RBAC permissions...\n');

    // 1. Upsert all permissions
    for (const perm of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { code: perm.code },
            update: { description: perm.description },
            create: perm
        });
        console.log(`  ✅ Permission: ${perm.code}`);
    }

    // 2. Get all permission records with IDs
    const allPerms = await prisma.permission.findMany();
    const permMap = {};
    allPerms.forEach(p => { permMap[p.code] = p.permission_id; });

    // 3. Seed role-permission mappings
    console.log('\n📋 Seeding role mappings...\n');

    for (const [role, codes] of Object.entries(ROLE_PERMISSIONS)) {
        // Clear old mappings for this role
        await prisma.rolePermission.deleteMany({ where: { role } });

        for (const code of codes) {
            await prisma.rolePermission.create({
                data: {
                    role,
                    permission_id: permMap[code]
                }
            });
        }
        console.log(`  👤 ${role}: ${codes.length} permissions`);
    }

    console.log('\n🎉 RBAC seeding complete!');
}

seed()
    .catch(e => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
