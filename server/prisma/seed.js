import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de categorias padrão...');

  // Categorias Padrão
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

  console.log('Seed de categorias concluído com sucesso!');
  console.log('Lojas, produtos e compras foram mantidos zerados para importação inicial.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
