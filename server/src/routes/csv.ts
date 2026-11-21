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
