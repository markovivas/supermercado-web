import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const priceHistoryRouter = Router();

// Obter histórico de preços de um produto específico com indicação de melhor preço
priceHistoryRouter.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);

    const history = await prisma.priceHistory.findMany({
      where: { productId },
      include: { store: true },
      orderBy: { recordedAt: 'desc' },
    });

    // Encontrar último preço registrado em cada loja
    const storeLatestPrices: { [storeId: number]: { storeName: string; storeColor: string; price: number; unit: string; date: Date } } = {};
    for (const h of history) {
      if (!storeLatestPrices[h.storeId]) {
        storeLatestPrices[h.storeId] = {
          storeName: h.store.name,
          storeColor: h.store.color || '#3b82f6',
          price: h.price,
          unit: h.unit,
          date: h.recordedAt,
        };
      }
    }

    // Identificar a loja com o menor preço mais recente
    const storeList = Object.values(storeLatestPrices);
    let bestDeal = null;
    if (storeList.length > 0) {
      bestDeal = storeList.reduce((min, cur) => (cur.price < min.price ? cur : min), storeList[0]);
    }

    res.json({
      history,
      byStore: storeList,
      bestDeal,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico de preços' });
  }
});
