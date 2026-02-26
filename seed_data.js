const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Database...');

    // Delete existing standard categories/products just to cleanly restate
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});

    // 1. Create Categories
    const catImages = {
        'خضراوات': 'https://images.unsplash.com/photo-1590159764723-d3ac4628f804?q=80&w=400&auto=format&fit=crop',
        'فواكه': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=400&auto=format&fit=crop',
        'لحوم ودواجن': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=400&auto=format&fit=crop',
        'ألبان وأجبان': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=400&auto=format&fit=crop',
        'مخبوزات': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop',
        'معلبات': 'https://images.unsplash.com/photo-1605342890509-cba0636f33d7?q=80&w=400&auto=format&fit=crop',
    }

    const categoriesList = [];
    for (const [name, img] of Object.entries(catImages)) {
        const cat = await prisma.category.create({
            data: {
                name: name,
            }
        });
        categoriesList.push(cat);
        console.log(`Created Category: ${name}`);
    }

    // Helpers to find category ID
    const getCatId = (name) => categoriesList.find(c => c.name === name).category_id;

    // 2. Create Products
    const productsData = [
        {
            name: 'بندورة حمراء بلدي',
            description: 'بندورة حمراء طازجة مقطوفة يومياً من مزارعنا.',
            price: 3.5,
            cost_price: 2.0,
            sale_type: 'kg',
            stock_quantity: 50,
            image_url: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?q=80&w=400&auto=format&fit=crop',
            category_id: getCatId('خضراوات')
        },
        {
            name: 'خيار بيبي طبيعي',
            description: 'خيار طازج وصغير الحجم، مقرمش ومناسب للصلصات.',
            price: 4.0,
            cost_price: 2.5,
            sale_type: 'kg',
            stock_quantity: 35,
            image_url: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?q=80&w=400&auto=format&fit=crop',
            category_id: getCatId('خضراوات')
        },
        {
            name: 'بطاطا حلوة',
            description: 'بطاطا حلوة طازجة للمشويات.',
            price: 5.0,
            cost_price: 3.0,
            sale_type: 'kg',
            stock_quantity: 100,
            image_url: 'https://images.unsplash.com/photo-1596796939943-30b1af5d5760?q=80&w=400&auto=format&fit=crop',
            category_id: getCatId('خضراوات')
        },
        {
            name: 'موز إكوادوري نخب أول',
            description: 'موز عالي الجودة وحلو المذاق.',
            price: 6.5,
            cost_price: 4.5,
            sale_type: 'kg',
            stock_quantity: 40,
            image_url: 'https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?q=80&w=400&auto=format&fit=crop',
            category_id: getCatId('فواكه')
        },
        {
            name: 'تفاح أحمر أمريكي',
            description: 'تفاح أحمر مقرمش.',
            price: 8.0,
            cost_price: 5.0,
            sale_type: 'kg',
            stock_quantity: 80,
            image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6caa6?q=80&w=400&auto=format&fit=crop',
            category_id: getCatId('فواكه')
        },
        {
            name: 'دجاج كامل طازج',
            description: 'دجاج نظيف مقطع أو كامل جاهز للطبخ.',
            price: 18.0,
            cost_price: 14.0,
            sale_type: 'piece',
            stock_quantity: 20,
            image_url: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?q=80&w=400&auto=format&fit=crop',
            category_id: getCatId('لحوم ودواجن')
        },
        {
            name: 'حليب بقري مبستر 1 لتر',
            description: 'حليب كامل الدسم غني بالكالسيوم.',
            price: 7.0,
            cost_price: 5.5,
            sale_type: 'piece',
            stock_quantity: 60,
            image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=400&auto=format&fit=crop',
            category_id: getCatId('ألبان وأجبان')
        },
        {
            name: 'خبز قمح كامل',
            description: 'خبز طازج مصنوع من حبة القمح الكاملة.',
            price: 4.5,
            cost_price: 2.0,
            sale_type: 'piece',
            stock_quantity: 25,
            image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=400&auto=format&fit=crop',
            category_id: getCatId('مخبوزات')
        }
    ];

    for (const prod of productsData) {
        await prisma.product.create({
            data: prod
        });
        console.log(`Created Product: ${prod.name}`);
    }

    console.log('Seeding Completed successfully! 🌱');
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
