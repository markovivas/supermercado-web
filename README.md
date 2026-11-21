# 🛒 Supermercado Web (v2.0)

> Sistema Web Standalone e Mobile-First para Controle Inteligente de Compras de Supermercado, Carrinho ao Vivo e Comparador de Preços.
> *(Recriação completa e desacoplada do antigo plugin WordPress)*

---

## ✨ Principais Funcionalidades

1. **Modo "Ir às Compras" em Tempo Real (Live Cart)**:
   - Inicie uma ida ao supermercado escolhendo a loja (Carrefour, Assaí, Atacadão, etc.).
   - Conforme coloca os itens no carrinho físico, busque pelo nome ou bipe com a câmera.
   - Visor com **Total Acumulado ao Vivo** na tela para saber o total antes de passar no caixa.
   - Ajuste rápido de quantidades (+/- ou valores fracionados como `1.250 kg`).
   - Persistência automática do carrinho (continua intacto mesmo se fechar o navegador).
2. **Leitor de Código de Barras com Câmera (Html5-QRCode)**:
   - Aponte a câmera do smartphone ou webcam para ler o código EAN-13/EAN-8 do produto.
   - Suporte a digitação manual de código de barras.
3. **Consulta Automática na Open Food Facts**:
   - Ao ler um código de barras de um produto novo, o sistema consulta a base mundial de alimentos e preenche o nome e a marca automaticamente.
4. **Comparador Histórico de Preços entre Supermercados**:
   - Cada compra finalizada alimenta automaticamente o histórico de preços.
   - Permite consultar um produto e descobrir onde ele está mais barato atualmente.
5. **Dashboard Financeiro Completo**:
   - Gastos do mês atual vs mês anterior.
   - Distribuição de despesas por categoria (Açougue, Hortifrúti, Padaria, Limpeza, etc.).
   - Ranking de supermercados mais frequentados e ticket médio por visita.
6. **Importação e Exportação CSV**:
   - Exportação de produtos e compras em formato CSV compatível com Excel.
   - Importação de CSV compatível com a base anterior do plugin WordPress.

---

## 🛠️ Stack Tecnológica

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Html5-QRCode, Canvas-Confetti.
- **Backend**: Node.js, Express, TypeScript, Multer.
- **Banco de Dados**: SQLite gerenciado com Prisma ORM.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18 ou superior) e npm instalados.

### 1. Instalação das dependências
Na raiz do projeto:
```bash
npm install
```

### 2. Banco de dados inicial (SQLite)
Gera o banco SQLite e popula com categorias, lojas e produtos de exemplo:
```bash
npm run seed
```

### 3. Modo Desenvolvimento
Inicia o backend (porta `3001`) e o frontend Vite (porta `3000`) simultaneamente:
```bash
npm run dev
```
Acesse no navegador: **`http://localhost:3000`**

### 4. Modo Produção
Para compilar e rodar a aplicação unificada em uma única porta:
```bash
npm run build
npm start
```
Acesse no navegador: **`http://localhost:3001`**

---

## 📁 Estrutura do Repositório

```text
├── client/                     # Aplicação Frontend SPA (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/         # Navbar, BarcodeScannerModal, AddProductModal
│   │   ├── views/              # LiveCartView, DashboardView, ProductsView, etc.
│   │   ├── api.ts              # Cliente HTTP REST
│   │   └── types.ts            # Tipagens TypeScript
│   └── index.html
├── server/                     # Backend API (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma       # Modelos do Banco (Product, Trip, Item, Store, Category)
│   │   └── seed.ts             # Dados padrão iniciais
│   └── src/
│       ├── routes/             # Rotas de Produtos, Compras, Histórico, Dashboard, CSV
│       └── index.ts            # Servidor Express
└── _legacy_wordpress_plugin/   # Código original do plugin WordPress (preservado)
```
