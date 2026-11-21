import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Iniciando seed do banco de dados...');
    // 1. Categorias Padrão
    const defaultCategories = [
        { name: 'Padaria', color: '#f59e0b', icon: 'croissant' },
        { name: 'Açougue & Carnes', color: '#ef4444', icon: 'beef' },
        { name: 'Hortifrúti', color: '#10b981', icon: 'apple' },
        { name: 'Laticínios & Ovos', color: '#06b6d4', icon: 'milk' },
        { name: 'Bebidas', color: '#8b5cf6', icon: 'wine' },
        { name: 'Limpeza', color: '#3b82f6', icon: 'sparkles' },
        { name: 'Higiene & Beleza', color: '#ec4899', icon: 'smile' },
        { name: 'Enlatados & Molhos', color: '#f97316', icon: 'soup' },
        { name: 'Grãos & Cereais', color: '#d97706', icon: 'wheat' },
        { name: 'Congelados', color: '#6366f1', icon: 'snowflake' },
        { name: 'Doces & Sobremesas', color: '#fb7185', icon: 'cookie' },
        { name: 'Pet Shop', color: '#14b8a6', icon: 'paw-print' },
    ];
    for (const cat of defaultCategories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat,
        });
    }
    // 2. Lojas / Supermercados Padrão
    const defaultStores = [
        { name: 'Carrefour Hiper', address: 'Av. Principal, 1000', color: '#2563eb' },
        { name: 'Assaí Atacadista', address: 'Rodovia Km 12', color: '#ea580c' },
        { name: 'Atacadão', address: 'Av. dos Trabalhadores, 500', color: '#f59e0b' },
        { name: 'Pão de Açúcar', address: 'Rua das Flores, 250', color: '#16a34a' },
        { name: 'Mercadinho do Bairro', address: 'Rua de Casa, 42', color: '#8b5cf6' },
        { name: 'Feira Livre', address: 'Praça Central', color: '#059669' },
    ];
    for (const store of defaultStores) {
        await prisma.store.upsert({
            where: { name: store.name },
            update: {},
            create: store,
        });
    }
    // Obter categorias e lojas inseridas para associar produtos
    const padaria = await prisma.category.findUnique({ where: { name: 'Padaria' } });
    const hortifruti = await prisma.category.findUnique({ where: { name: 'Hortifrúti' } });
    const laticinios = await prisma.category.findUnique({ where: { name: 'Laticínios & Ovos' } });
    const graos = await prisma.category.findUnique({ where: { name: 'Grãos & Cereais' } });
    const carnes = await prisma.category.findUnique({ where: { name: 'Açougue & Carnes' } });
    const bebidas = await prisma.category.findUnique({ where: { name: 'Bebidas' } });
    const carrefour = await prisma.store.findUnique({ where: { name: 'Carrefour Hiper' } });
    const assai = await prisma.store.findUnique({ where: { name: 'Assaí Atacadista' } });
    // 3. Produtos Iniciais Demonstrativos com Preços e Códigos EAN reais
    const sampleProducts = [
        {
            name: 'Arroz Branco Tipo 1 5kg',
            barcode: '7891000100103',
            categoryId: graos?.id || 1,
            defaultUnit: 'pct',
            defaultPrice: 28.90,
            brand: 'Camil',
        },
        {
            name: 'Feijão Preto Tipo 1 1kg',
            barcode: '7891000200202',
            categoryId: graos?.id || 1,
            defaultUnit: 'pct',
            defaultPrice: 7.80,
            brand: 'Kicaldo',
        },
        {
            name: 'Leite Integral 1L',
            barcode: '7891000300301',
            categoryId: laticinios?.id || 1,
            defaultUnit: 'l',
            defaultPrice: 5.49,
            brand: 'Itambé',
        },
        {
            name: 'Café Torrado e Moído 500g',
            barcode: '7891000400400',
            categoryId: graos?.id || 1,
            defaultUnit: 'pct',
            defaultPrice: 18.50,
            brand: 'Pilão',
        },
        {
            name: 'Pão Francês',
            barcode: '7891000500509',
            categoryId: padaria?.id || 1,
            defaultUnit: 'kg',
            defaultPrice: 19.90,
            brand: 'Própria',
        },
        {
            name: 'Banana Prata',
            barcode: '7891000600608',
            categoryId: hortifruti?.id || 1,
            defaultUnit: 'kg',
            defaultPrice: 6.99,
            brand: 'Horti',
        },
        {
            name: 'Peito de Frango Resfriado 1kg',
            barcode: '7891000700707',
            categoryId: carnes?.id || 1,
            defaultUnit: 'kg',
            defaultPrice: 17.90,
            brand: 'Sadia',
        },
        {
            name: 'Suco de Laranja Integral 900ml',
            barcode: '7891000800806',
            categoryId: bebidas?.id || 1,
            defaultUnit: 'un',
            defaultPrice: 9.90,
            brand: 'Natural One',
        },
    ];
    for (const prod of sampleProducts) {
        const createdProd = await prisma.product.upsert({
            where: { barcode: prod.barcode },
            update: {},
            create: prod,
        });
        // Inserir histórico de preço inicial para comparação
        if (carrefour) {
            await prisma.priceHistory.create({
                data: {
                    productId: createdProd.id,
                    storeId: carrefour.id,
                    price: prod.defaultPrice,
                    unit: prod.defaultUnit,
                    recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
                },
            });
        }
        if (assai) {
            await prisma.priceHistory.create({
                data: {
                    productId: createdProd.id,
                    storeId: assai.id,
                    price: Number((prod.defaultPrice * 0.93).toFixed(2)), // 7% mais barato no atacado
                    unit: prod.defaultUnit,
                    recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
                },
            });
        }
    }
    // 4. Inserir uma compra concluída recente para o dashboard ter métricas ricas de demonstração
    if (carrefour && sampleProducts.length >= 4) {
        const existingTrip = await prisma.purchaseTrip.findFirst();
        if (!existingTrip) {
            const trip = await prisma.purchaseTrip.create({
                data: {
                    storeId: carrefour.id,
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    status: 'completed',
                    totalAmount: 96.68,
                    notes: 'Compras de reposição da semana',
                    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                },
            });
            const prods = await prisma.product.findMany({ take: 4 });
            for (const p of prods) {
                await prisma.purchaseItem.create({
                    data: {
                        tripId: trip.id,
                        productId: p.id,
                        quantity: 2,
                        unit: p.defaultUnit,
                        unitPrice: p.defaultPrice,
                        totalPrice: p.defaultPrice * 2,
                    },
                });
            }
        }
    }
    console.log('Seed concluído com sucesso!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
