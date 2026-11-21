import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const categoriesRouter = Router();

// Listar todas as categorias com contagem de produtos
categoriesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Criar categoria
categoriesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const category = await prisma.category.create({
      data: {
        name: String(name).trim(),
        color: color || '#10b981',
        icon: icon || 'shopping-bag',
      },
    });
    res.status(201).json(category);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Categoria já existe' });
    }
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Atualizar categoria
categoriesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, color, icon } = req.body;

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name ? String(name).trim() : undefined,
        color: color || undefined,
        icon: icon || undefined,
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// Deletar categoria
categoriesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return res.status(400).json({
        error: `Não é possível excluir. Existem ${productsCount} produtos vinculados a esta categoria.`,
      });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});
