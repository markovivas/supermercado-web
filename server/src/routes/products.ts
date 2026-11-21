import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const productsRouter = Router();

// Listar produtos com suporte a busca e categoria
productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, categoryId, barcode } = req.query;

    const where: any = {};

    if (barcode) {
      where.barcode = String(barcode).trim();
    } else if (search) {
      const term = String(search).trim();
      where.OR = [
        { name: { contains: term } },
        { barcode: { contains: term } },
        { brand: { contains: term } },
      ];
    }

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 5,
          include: { store: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Tenta adivinhar a categoria interna baseada nos tags do Open Food Facts
function mapCategoryFromTags(tags: string[] = []): string | null {
  const text = tags.join(' ').toLowerCase();
  if (text.includes('dairy') || text.includes('lait') || text.includes('queijo') || text.includes('leite') || text.includes('iogurte') || text.includes('laticinio')) {
    return 'Laticínios & Ovos';
  }
  if (text.includes('beverage') || text.includes('boisson') || text.includes('suco') || text.includes('refrigerante') || text.includes('bebida') || text.includes('cerveja')) {
    return 'Bebidas';
  }
  if (text.includes('bread') || text.includes('boulangerie') || text.includes('pao') || text.includes('bolo') || text.includes('padaria')) {
    return 'Padaria';
  }
  if (text.includes('meat') || text.includes('viande') || text.includes('carne') || text.includes('frango') || text.includes('bife') || text.includes('acougue')) {
    return 'Açougue & Carnes';
  }
  if (text.includes('fruit') || text.includes('vegetable') || text.includes('legume') || text.includes('hortifruti') || text.includes('verdura')) {
    return 'Hortifrúti';
  }
  if (text.includes('grain') || text.includes('cereal') || text.includes('arroz') || text.includes('feijao') || text.includes('grao') || text.includes('pasta') || text.includes('massa')) {
    return 'Grãos & Cereais';
  }
  if (text.includes('sweet') || text.includes('biscuit') || text.includes('chocolat') || text.includes('doce') || text.includes('biscoito') || text.includes('sobremesa')) {
    return 'Doces & Sobremesas';
  }
  if (text.includes('cleaning') || text.includes('limpeza') || text.includes('detergente') || text.includes('sabao')) {
    return 'Limpeza';
  }
  return null;
}

// Buscar produto por código de barras (Local com fallback para Open Food Facts)
productsRouter.get('/lookup/:barcode', async (req: Request, res: Response) => {
  try {
    const cleanBarcode = String(req.params.barcode).trim();

    // 1. Tentar busca no banco local primeiro
    const localProduct = await prisma.product.findFirst({
      where: { barcode: cleanBarcode },
      include: {
        category: true,
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 3,
          include: { store: true },
        },
      },
    });

    if (localProduct) {
      return res.json({
        found: true,
        source: 'local',
        product: localProduct,
        message: 'Produto encontrado no seu banco de dados local.',
      });
    }

    // 2. Se não encontrou e tem formato de EAN (8 a 14 dígitos), consulta Open Food Facts
    if (/^\d{8,14}$/.test(cleanBarcode)) {
      const urls = [
        `https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`,
        `https://br.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`,
      ];

      for (const url of urls) {
        try {
          const offResponse = await fetch(url, {
            headers: { 'User-Agent': 'SupermercadoWeb/2.0 (contato@supermercadoweb.local)' },
            signal: AbortSignal.timeout(4000),
          });

          if (offResponse.ok) {
            const offData = (await offResponse.json()) as any;
            if (offData && offData.status === 1 && offData.product) {
              const p = offData.product;
              const productName = p.product_name || p.product_name_pt || p.brands || `Produto ${cleanBarcode}`;
              const brand = p.brands || '';
              const imageUrl = p.image_front_small_url || p.image_url || null;

              // Tentar mapear categoria
              const tags = [...(p.categories_tags || []), ...(p.categories_hierarchy || []), p.categories || ''];
              const guessedCategoryName = mapCategoryFromTags(tags);
              let categoryId: number | null = null;

              if (guessedCategoryName) {
                const matchedCategory = await prisma.category.findUnique({
                  where: { name: guessedCategoryName },
                });
                if (matchedCategory) {
                  categoryId = matchedCategory.id;
                }
              }

              // Se não encontrou categoria específica, tenta pegar a primeira disponível
              if (!categoryId) {
                const firstCat = await prisma.category.findFirst();
                categoryId = firstCat?.id ?? 1;
              }

              return res.json({
                found: true,
                source: 'openfoodfacts',
                product: {
                  id: null,
                  name: productName,
                  barcode: cleanBarcode,
                  brand,
                  imageUrl,
                  defaultUnit: 'un',
                  defaultPrice: 0,
                  categoryId,
                },
                message: 'Produto localizado na base mundial do Open Food Facts!',
              });
            }
          }
        } catch (apiErr) {
          console.warn(`Timeout ou falha ao consultar ${url}:`, apiErr);
        }
      }
    }

    return res.json({
      found: false,
      source: null,
      product: {
        barcode: cleanBarcode,
      },
      message: `Código ${cleanBarcode} não encontrado no Open Food Facts. Produtos de marcas próprias ou regionais (como redes locais) frequentemente não constam na base aberta mundial. Você pode cadastrá-lo agora.`,
    });
  } catch (error) {
    console.error('Erro no lookup de código de barras:', error);
    res.status(500).json({ error: 'Erro ao buscar código de barras' });
  }
});

// Obter detalhes de um produto
productsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          include: { store: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// Criar produto
productsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, barcode, categoryId, defaultUnit, defaultPrice, brand, imageUrl } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
    }

    const cleanBarcode = barcode ? String(barcode).trim() : null;

    if (cleanBarcode) {
      const exists = await prisma.product.findUnique({ where: { barcode: cleanBarcode } });
      if (exists) {
        return res.status(409).json({ error: 'Já existe um produto com este código de barras' });
      }
    }

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        barcode: cleanBarcode,
        categoryId: Number(categoryId),
        defaultUnit: defaultUnit || 'un',
        defaultPrice: defaultPrice ? Number(defaultPrice) : 0,
        brand: brand ? String(brand).trim() : null,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
      },
      include: { category: true },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Atualizar produto
productsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, barcode, categoryId, defaultUnit, defaultPrice, brand, imageUrl } = req.body;

    const cleanBarcode = barcode ? String(barcode).trim() : null;

    if (cleanBarcode) {
      const exists = await prisma.product.findFirst({
        where: {
          barcode: cleanBarcode,
          NOT: { id },
        },
      });
      if (exists) {
        return res.status(409).json({ error: 'Já existe outro produto com este código de barras' });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name ? String(name).trim() : undefined,
        barcode: cleanBarcode !== undefined ? cleanBarcode : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        defaultUnit: defaultUnit || undefined,
        defaultPrice: defaultPrice !== undefined ? Number(defaultPrice) : undefined,
        brand: brand !== undefined ? (brand ? String(brand).trim() : null) : undefined,
        imageUrl: imageUrl !== undefined ? (imageUrl ? String(imageUrl).trim() : null) : undefined,
      },
      include: { category: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Deletar produto
productsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Produto removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});
