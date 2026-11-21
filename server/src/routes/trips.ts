import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const tripsRouter = Router();

// Recalcula o total de uma compra baseado nos seus itens
async function recalculateTripTotal(tripId: number) {
  const items = await prisma.purchaseItem.findMany({
    where: { tripId },
  });
  const total = items.reduce((acc, item) => acc + item.totalPrice, 0);
  await prisma.purchaseTrip.update({
    where: { id: tripId },
    data: { totalAmount: Number(total.toFixed(2)) },
  });
  return total;
}

// Obter a compra ativa em andamento (Modo "Ir às Compras" em tempo real)
tripsRouter.get('/active', async (_req: Request, res: Response) => {
  try {
    const activeTrip = await prisma.purchaseTrip.findFirst({
      where: { status: 'in_progress' },
      include: {
        store: true,
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
          orderBy: { id: 'desc' },
        },
      },
    });

    res.json(activeTrip || null);
  } catch (error) {
    console.error('Erro ao buscar compra ativa:', error);
    res.status(500).json({ error: 'Erro ao buscar compra ativa' });
  }
});

// Listar histórico de compras com filtros
tripsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, storeId, startDate, endDate } = req.query;

    const where: any = {};

    if (status) {
      where.status = String(status);
    }

    if (storeId) {
      where.storeId = Number(storeId);
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(String(startDate));
      }
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const trips = await prisma.purchaseTrip.findMany({
      where,
      include: {
        store: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar compras' });
  }
});

// Detalhes de uma compra
tripsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const trip = await prisma.purchaseTrip.findUnique({
      where: { id },
      include: {
        store: true,
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Compra não encontrada' });
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar detalhes da compra' });
  }
});

// Iniciar uma nova compra ("Ir às Compras")
tripsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { storeId, date, notes } = req.body;

    if (!storeId) {
      return res.status(400).json({ error: 'Loja é obrigatória para iniciar as compras' });
    }

    // Se já houver uma compra em andamento, verifica se o usuário deseja continuar ou criar nova
    const existingActive = await prisma.purchaseTrip.findFirst({
      where: { status: 'in_progress' },
      include: { store: true, items: { include: { product: true } } },
    });

    if (existingActive && req.body.forceNew !== true) {
      return res.json({
        alreadyActive: true,
        trip: existingActive,
      });
    }

    const newTrip = await prisma.purchaseTrip.create({
      data: {
        storeId: Number(storeId),
        date: date ? new Date(date) : new Date(),
        status: 'in_progress',
        notes: notes ? String(notes).trim() : null,
      },
      include: {
        store: true,
        items: true,
      },
    });

    res.status(201).json(newTrip);
  } catch (error) {
    console.error('Erro ao iniciar compra:', error);
    res.status(500).json({ error: 'Erro ao iniciar compra' });
  }
});

// Adicionar item ao carrinho da compra
tripsRouter.post('/:id/items', async (req: Request, res: Response) => {
  try {
    const tripId = Number(req.params.id);
    const { productId, quantity, unit, unitPrice, notes } = req.body;

    if (!productId || quantity === undefined || unitPrice === undefined) {
      return res.status(400).json({ error: 'Produto, quantidade e preço unitário são obrigatórios' });
    }

    const q = Number(quantity);
    const price = Number(unitPrice);
    const totalPrice = Number((q * price).toFixed(2));

    // Se o item já existir no carrinho, apenas incrementa ou atualiza
    const existingItem = await prisma.purchaseItem.findFirst({
      where: {
        tripId,
        productId: Number(productId),
      },
    });

    let savedItem;
    if (existingItem) {
      const newQuantity = existingItem.quantity + q;
      const newTotal = Number((newQuantity * price).toFixed(2));

      savedItem = await prisma.purchaseItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          unitPrice: price,
          totalPrice: newTotal,
          unit: unit || existingItem.unit,
        },
        include: {
          product: { include: { category: true } },
        },
      });
    } else {
      savedItem = await prisma.purchaseItem.create({
        data: {
          tripId,
          productId: Number(productId),
          quantity: q,
          unit: unit || 'un',
          unitPrice: price,
          totalPrice,
          notes: notes ? String(notes).trim() : null,
        },
        include: {
          product: { include: { category: true } },
        },
      });
    }

    const newTotalTrip = await recalculateTripTotal(tripId);

    res.status(201).json({
      item: savedItem,
      tripTotal: newTotalTrip,
    });
  } catch (error) {
    console.error('Erro ao adicionar item à compra:', error);
    res.status(500).json({ error: 'Erro ao adicionar item' });
  }
});

// Atualizar item do carrinho (quantidade, preço)
tripsRouter.put('/:id/items/:itemId', async (req: Request, res: Response) => {
  try {
    const tripId = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    const { quantity, unitPrice, unit, notes } = req.body;

    const currentItem = await prisma.purchaseItem.findUnique({ where: { id: itemId } });
    if (!currentItem || currentItem.tripId !== tripId) {
      return res.status(404).json({ error: 'Item não encontrado na compra' });
    }

    const q = quantity !== undefined ? Number(quantity) : currentItem.quantity;
    const price = unitPrice !== undefined ? Number(unitPrice) : currentItem.unitPrice;
    const totalPrice = Number((q * price).toFixed(2));

    const updatedItem = await prisma.purchaseItem.update({
      where: { id: itemId },
      data: {
        quantity: q,
        unitPrice: price,
        totalPrice,
        unit: unit || currentItem.unit,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : currentItem.notes,
      },
      include: {
        product: { include: { category: true } },
      },
    });

    const newTotalTrip = await recalculateTripTotal(tripId);

    res.json({
      item: updatedItem,
      tripTotal: newTotalTrip,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
});

// Remover item do carrinho
tripsRouter.delete('/:id/items/:itemId', async (req: Request, res: Response) => {
  try {
    const tripId = Number(req.params.id);
    const itemId = Number(req.params.itemId);

    await prisma.purchaseItem.delete({
      where: { id: itemId },
    });

    const newTotalTrip = await recalculateTripTotal(tripId);

    res.json({
      success: true,
      tripTotal: newTotalTrip,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover item' });
  }
});

// Finalizar Compra (Fecha o carrinho, atualiza status e alimenta o Histórico de Preços)
tripsRouter.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const tripId = Number(req.params.id);
    const { notes } = req.body;

    const trip = await prisma.purchaseTrip.findUnique({
      where: { id: tripId },
      include: { items: true },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Compra não encontrada' });
    }

    const total = await recalculateTripTotal(tripId);

    // 1. Atualiza status da compra
    const completedTrip = await prisma.purchaseTrip.update({
      where: { id: tripId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        totalAmount: total,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : trip.notes,
      },
      include: {
        store: true,
        items: {
          include: {
            product: { include: { category: true } },
          },
        },
      },
    });

    // 2. Grava histórico de preços para cada produto nesta loja
    for (const item of trip.items) {
      await prisma.priceHistory.create({
        data: {
          productId: item.productId,
          storeId: trip.storeId,
          price: item.unitPrice,
          unit: item.unit,
          recordedAt: new Date(),
        },
      });

      // Também atualiza o preço padrão do produto se for maior que zero
      if (item.unitPrice > 0) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            defaultPrice: item.unitPrice,
            defaultUnit: item.unit,
          },
        });
      }
    }

    res.json(completedTrip);
  } catch (error) {
    console.error('Erro ao finalizar compra:', error);
    res.status(500).json({ error: 'Erro ao finalizar compra' });
  }
});

// Cancelar compra
tripsRouter.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const tripId = Number(req.params.id);
    await prisma.purchaseTrip.update({
      where: { id: tripId },
      data: { status: 'cancelled' },
    });
    res.json({ success: true, message: 'Compra cancelada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cancelar compra' });
  }
});

// Deletar compra
tripsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tripId = Number(req.params.id);
    await prisma.purchaseTrip.delete({
      where: { id: tripId },
    });
    res.json({ success: true, message: 'Compra excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir compra' });
  }
});
