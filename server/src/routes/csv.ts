import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../db.js';

export const csvRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

// Exportar Produtos em CSV (100% compatível com o formato do plugin antigo)
csvRouter.get('/export/products', async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    const header = 'Nome;Categoria;Preço Padrão;Unidade Padrão;Código de Barras';
    const rows = products.map((p) => {
      const priceStr = p.defaultPrice.toFixed(2).replace('.', ',');
      return `"${p.name}";"${p.category.name}";"${priceStr}";"${p.defaultUnit}";"${p.barcode || ''}"`;
    });

    const csvContent = '\uFEFF' + [header, ...rows].join('\r\n'); // BOM para acentuação correta no Excel

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="produtos_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar produtos' });
  }
});

// Exportar Compras em CSV
csvRouter.get('/export/purchases', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.purchaseItem.findMany({
      include: {
        product: { include: { category: true } },
        trip: { include: { store: true } },
      },
      orderBy: { trip: { date: 'desc' } },
    });

    const header = 'Data;Hora;Produto;Código de Barras;Categoria;Quantidade;Unidade;Preço Unitário;Total;Loja;Observações';
    const rows = items.map((item) => {
      const date = new Date(item.trip.date);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().split(' ')[0];
      const unitPriceStr = item.unitPrice.toFixed(2).replace('.', ',');
      const totalStr = item.totalPrice.toFixed(2).replace('.', ',');

      return `"${dateStr}";"${timeStr}";"${item.product.name}";"${item.product.barcode || ''}";"${item.product.category.name}";"${item.quantity}";"${item.unit}";"${unitPriceStr}";"${totalStr}";"${item.trip.store.name}";"${item.notes || ''}"`;
    });

    const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="compras_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar compras' });
  }
});

// Exportar Lojas/Supermercados em CSV
csvRouter.get('/export/stores', async (_req: Request, res: Response) => {
  try {
    const stores = await prisma.store.findMany({
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });

    const header = 'Nome;Endereço;Telefone;Cor;Ordem';
    const rows = stores.map((s) => {
      return `"${s.name}";"${s.address || ''}";"${s.phone || ''}";"${s.color || '#3b82f6'}";"${s.order}"`;
    });

    const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="supermercados_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar supermercados' });
  }
});

// Importar Lojas/Supermercados via CSV
csvRouter.post('/import/stores', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const content = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      return res.status(400).json({ error: 'Arquivo CSV vazio ou sem dados' });
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line
        .split(separator)
        .map((col) => col.replace(/^"(.*)"$/, '$1').trim());

      if (columns.length < 1) {
        skipped++;
        continue;
      }

      const name = columns[0];
      const address = columns[1] || null;
      const phone = columns[2] || null;
      const color = columns[3] || '#3b82f6';
      const orderRaw = columns[4] ? parseInt(columns[4], 10) : undefined;

      if (!name) {
        skipped++;
        continue;
      }

      // Procura loja existente por nome e endereço (se fornecido) ou por nome
      let existing = null;
      if (address) {
        existing = await prisma.store.findFirst({
          where: { name, address },
        });
      }
      if (!existing) {
        existing = await prisma.store.findFirst({
          where: { name },
        });
      }

      if (existing) {
        await prisma.store.update({
          where: { id: existing.id },
          data: {
            address: address !== null ? address : existing.address,
            phone: phone !== null ? phone : existing.phone,
            color: color || existing.color,
            order: orderRaw !== undefined && !isNaN(orderRaw) ? orderRaw : existing.order,
          },
        });
        updated++;
      } else {
        const lastStore = await prisma.store.findFirst({ orderBy: { order: 'desc' } });
        const finalOrder = orderRaw !== undefined && !isNaN(orderRaw) ? orderRaw : (lastStore?.order ?? 0) + 1;

        await prisma.store.create({
          data: {
            name,
            address: address || null,
            phone: phone || null,
            color: color || '#3b82f6',
            order: finalOrder,
          },
        });
        imported++;
      }
    }

    res.json({
      success: true,
      message: `Importação de supermercados concluída: ${imported} novos, ${updated} atualizados, ${skipped} ignorados.`,
      imported,
      updated,
      skipped,
    });
  } catch (error) {
    console.error('Erro na importação de CSV de lojas:', error);
    res.status(500).json({ error: 'Erro ao processar arquivo CSV de supermercados' });
  }
});

// Importar Produtos via CSV
csvRouter.post('/import/products', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const content = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      return res.status(400).json({ error: 'Arquivo CSV vazio ou sem dados' });
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Detectar separador (; ou ,)
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parsing simples de CSV com aspas
      const columns = line
        .split(separator)
        .map((col) => col.replace(/^"(.*)"$/, '$1').trim());

      if (columns.length < 2) {
        skipped++;
        continue;
      }

      const name = columns[0];
      const categoryName = columns[1] || 'Geral';
      const priceRaw = columns[2] || '0';
      const unit = columns[3] || 'un';
      const barcode = columns[4] ? columns[4].trim() : null;

      if (!name) {
        skipped++;
        continue;
      }

      const price = parseFloat(priceRaw.replace(',', '.')) || 0;

      // Garantir categoria
      let category = await prisma.category.findUnique({ where: { name: categoryName } });
      if (!category) {
        category = await prisma.category.create({
          data: { name: categoryName },
        });
      }

      // Verificar existência por código de barras ou nome
      let existing = null;
      if (barcode) {
        existing = await prisma.product.findUnique({ where: { barcode } });
      }
      if (!existing) {
        existing = await prisma.product.findFirst({ where: { name } });
      }

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            defaultPrice: price > 0 ? price : existing.defaultPrice,
            defaultUnit: unit || existing.defaultUnit,
            barcode: barcode || existing.barcode,
            categoryId: category.id,
          },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            name,
            categoryId: category.id,
            defaultPrice: price,
            defaultUnit: unit,
            barcode: barcode || null,
          },
        });
        imported++;
      }
    }

    res.json({
      success: true,
      message: `Importação concluída: ${imported} produtos novos, ${updated} atualizados, ${skipped} ignorados.`,
      imported,
      updated,
      skipped,
    });
  } catch (error) {
    console.error('Erro na importação de CSV:', error);
    res.status(500).json({ error: 'Erro ao processar arquivo CSV' });
  }
});
