import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { productsRouter } from './routes/products.js';
import { categoriesRouter } from './routes/categories.js';
import { storesRouter } from './routes/stores.js';
import { tripsRouter } from './routes/trips.js';
import { priceHistoryRouter } from './routes/priceHistory.js';
import { dashboardRouter } from './routes/dashboard.js';
import { csvRouter } from './routes/csv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/stores', storesRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/price-history', priceHistoryRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/csv', csvRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Servir frontend compilado em produção se existir
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Supermercado Web API rodando. Inicie o client com "npm run dev".');
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
});
