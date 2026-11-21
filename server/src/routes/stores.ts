import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const storesRouter = Router();

// Listar lojas
storesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        _count: {
          select: { trips: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lojas' });
  }
});

// Criar loja
storesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, address, color } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome da loja é obrigatório' });
    }

    const store = await prisma.store.create({
      data: {
        name: String(name).trim(),
        address: address ? String(address).trim() : null,
        color: color || '#3b82f6',
      },
    });
    res.status(201).json(store);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Loja já cadastrada' });
    }
    res.status(500).json({ error: 'Erro ao criar loja' });
  }
});

// Atualizar loja
storesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, address, color } = req.body;

    const updated = await prisma.store.update({
      where: { id },
      data: {
        name: name ? String(name).trim() : undefined,
        address: address !== undefined ? (address ? String(address).trim() : null) : undefined,
        color: color || undefined,
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar loja' });
  }
});

// Deletar loja
storesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const tripsCount = await prisma.purchaseTrip.count({ where: { storeId: id } });
    if (tripsCount > 0) {
      return res.status(400).json({
        error: `Não é possível excluir. Existem ${tripsCount} compras vinculadas a esta loja.`,
      });
    }

    await prisma.store.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar loja' });
  }
});
