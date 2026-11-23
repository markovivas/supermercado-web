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
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lojas' });
  }
});

// Reordenar lojas em lote
storesRouter.put('/reorder/batch', async (req: Request, res: Response) => {
  try {
    const { storeIds } = req.body;
    if (!Array.isArray(storeIds)) {
      return res.status(400).json({ error: 'storeIds deve ser um array de IDs' });
    }

    await prisma.$transaction(
      storeIds.map((id, index) =>
        prisma.store.update({
          where: { id: Number(id) },
          data: { order: index + 1 },
        })
      )
    );

    res.json({ success: true, message: 'Ordem atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao reordenar lojas' });
  }
});

// Mover loja (subir, descer, ir para topo ou ir para fim)
storesRouter.post('/:id/move', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { direction } = req.body; // 'up' | 'down' | 'top' | 'bottom'

    const allStores = await prisma.store.findMany({
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });

    const currentIndex = allStores.findIndex((s) => s.id === id);
    if (currentIndex === -1) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    const reordered = [...allStores];
    const [movedStore] = reordered.splice(currentIndex, 1);

    if (direction === 'top') {
      reordered.unshift(movedStore);
    } else if (direction === 'bottom') {
      reordered.push(movedStore);
    } else if (direction === 'up') {
      const newIndex = Math.max(0, currentIndex - 1);
      reordered.splice(newIndex, 0, movedStore);
    } else if (direction === 'down') {
      const newIndex = Math.min(reordered.length, currentIndex + 1);
      reordered.splice(newIndex, 0, movedStore);
    }

    await prisma.$transaction(
      reordered.map((store, index) =>
        prisma.store.update({
          where: { id: store.id },
          data: { order: index + 1 },
        })
      )
    );

    const updatedList = await prisma.store.findMany({
      include: {
        _count: {
          select: { trips: true },
        },
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });

    res.json(updatedList);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao mover loja' });
  }
});

// Criar loja
storesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, address, phone, color, order } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome da loja é obrigatório' });
    }

    let finalOrder = order !== undefined ? Number(order) : undefined;
    if (finalOrder === undefined) {
      const last = await prisma.store.findFirst({ orderBy: { order: 'desc' } });
      finalOrder = (last?.order ?? 0) + 1;
    }

    const store = await prisma.store.create({
      data: {
        name: String(name).trim(),
        address: address ? String(address).trim() : null,
        phone: phone ? String(phone).trim() : null,
        color: color || '#3b82f6',
        order: finalOrder,
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
    const { name, address, phone, color, order } = req.body;

    const updated = await prisma.store.update({
      where: { id },
      data: {
        name: name ? String(name).trim() : undefined,
        address: address !== undefined ? (address ? String(address).trim() : null) : undefined,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : undefined,
        color: color || undefined,
        order: order !== undefined ? Number(order) : undefined,
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
