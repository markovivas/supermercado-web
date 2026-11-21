import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // Compras concluídas neste mês
    const currentMonthTrips = await prisma.purchaseTrip.findMany({
      where: {
        status: 'completed',
        date: { gte: startOfMonth, lte: endOfMonth },
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

    // Compras do mês anterior para comparação percentual
    const lastMonthTrips = await prisma.purchaseTrip.findMany({
      where: {
        status: 'completed',
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });

    const totalSpentCurrentMonth = currentMonthTrips.reduce((acc, t) => acc + t.totalAmount, 0);
    const totalSpentLastMonth = lastMonthTrips.reduce((acc, t) => acc + t.totalAmount, 0);

    const totalItemsCount = currentMonthTrips.reduce((acc, t) => acc + t.items.length, 0);
    const tripCount = currentMonthTrips.length;
    const avgTicket = tripCount > 0 ? totalSpentCurrentMonth / tripCount : 0;

    // Gastos por categoria
    const categoryTotals: { [name: string]: { name: string; color: string; total: number; count: number } } = {};
    for (const trip of currentMonthTrips) {
      for (const item of trip.items) {
        const catName = item.product.category?.name || 'Outros';
        const catColor = item.product.category?.color || '#94a3b8';
        if (!categoryTotals[catName]) {
          categoryTotals[catName] = { name: catName, color: catColor, total: 0, count: 0 };
        }
        categoryTotals[catName].total += item.totalPrice;
        categoryTotals[catName].count += 1;
      }
    }

    const byCategory = Object.values(categoryTotals)
      .map((c) => ({
        ...c,
        total: Number(c.total.toFixed(2)),
        percentage: totalSpentCurrentMonth > 0 ? Number(((c.total / totalSpentCurrentMonth) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Gastos por loja
    const storeTotals: { [name: string]: { name: string; color: string; total: number; tripCount: number } } = {};
    for (const trip of currentMonthTrips) {
      const storeName = trip.store.name;
      const storeColor = trip.store.color || '#3b82f6';
      if (!storeTotals[storeName]) {
        storeTotals[storeName] = { name: storeName, color: storeColor, total: 0, tripCount: 0 };
      }
      storeTotals[storeName].total += trip.totalAmount;
      storeTotals[storeName].tripCount += 1;
    }

    const byStore = Object.values(storeTotals)
      .map((s) => ({
        ...s,
        total: Number(s.total.toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total);

    // Últimas 5 compras gerais
    const recentTrips = await prisma.purchaseTrip.findMany({
      where: { status: 'completed' },
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        store: true,
        _count: { select: { items: true } },
      },
    });

    res.json({
      summary: {
        totalSpent: Number(totalSpentCurrentMonth.toFixed(2)),
        totalSpentLastMonth: Number(totalSpentLastMonth.toFixed(2)),
        tripCount,
        totalItemsCount,
        avgTicket: Number(avgTicket.toFixed(2)),
        monthName: startOfMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      },
      byCategory,
      byStore,
      recentTrips,
    });
  } catch (error) {
    console.error('Erro ao gerar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao gerar dados do dashboard' });
  }
});
