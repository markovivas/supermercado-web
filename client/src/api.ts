import {
  Category,
  Store,
  Product,
  PurchaseTrip,
  PurchaseItem,
  DashboardStats,
} from './types';

const BASE_URL = '/api';

export const api = {
  // Categorias
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${BASE_URL}/categories`);
    if (!res.ok) throw new Error('Erro ao carregar categorias');
    return res.json();
  },
  async createCategory(data: Partial<Category>): Promise<Category> {
    const res = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar categoria');
    }
    return res.json();
  },
  async deleteCategory(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao excluir categoria');
    }
  },

  // Lojas
  async getStores(): Promise<Store[]> {
    const res = await fetch(`${BASE_URL}/stores`);
    if (!res.ok) throw new Error('Erro ao carregar lojas');
    return res.json();
  },
  async createStore(data: Partial<Store>): Promise<Store> {
    const res = await fetch(`${BASE_URL}/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar loja');
    }
    return res.json();
  },
  async deleteStore(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/stores/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao excluir loja');
    }
  },

  // Produtos
  async getProducts(params?: { search?: string; categoryId?: number; barcode?: string }): Promise<Product[]> {
    const url = new URL(`${BASE_URL}/products`, window.location.origin);
    if (params?.search) url.searchParams.append('search', params.search);
    if (params?.categoryId) url.searchParams.append('categoryId', String(params.categoryId));
    if (params?.barcode) url.searchParams.append('barcode', params.barcode);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Erro ao carregar produtos');
    return res.json();
  },
  async lookupBarcode(barcode: string): Promise<{
    found: boolean;
    source: 'local' | 'openfoodfacts' | null;
    product: any;
  }> {
    const res = await fetch(`${BASE_URL}/products/lookup/${encodeURIComponent(barcode)}`);
    if (!res.ok) throw new Error('Erro ao consultar código de barras');
    return res.json();
  },
  async createProduct(data: any): Promise<Product> {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar produto');
    }
    return res.json();
  },
  async updateProduct(id: number, data: any): Promise<Product> {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao atualizar produto');
    }
    return res.json();
  },
  async deleteProduct(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao excluir produto');
    }
  },

  // Compras & Carrinho ao Vivo ("Ir às Compras")
  async getActiveTrip(): Promise<PurchaseTrip | null> {
    const res = await fetch(`${BASE_URL}/trips/active`);
    if (!res.ok) throw new Error('Erro ao carregar compra ativa');
    return res.json();
  },
  async startTrip(storeId: number, date?: string, forceNew?: boolean): Promise<{ alreadyActive?: boolean; trip: PurchaseTrip }> {
    const res = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, date, forceNew }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao iniciar compras');
    }
    const data = await res.json();
    return data.alreadyActive ? data : { trip: data };
  },
  async addItemToTrip(tripId: number, item: {
    productId: number;
    quantity: number;
    unit: string;
    unitPrice: number;
    notes?: string;
  }): Promise<{ item: PurchaseItem; tripTotal: number }> {
    const res = await fetch(`${BASE_URL}/trips/${tripId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao adicionar item ao carrinho');
    }
    return res.json();
  },
  async updateTripItem(tripId: number, itemId: number, data: {
    quantity?: number;
    unitPrice?: number;
    unit?: string;
    notes?: string;
  }): Promise<{ item: PurchaseItem; tripTotal: number }> {
    const res = await fetch(`${BASE_URL}/trips/${tripId}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao atualizar item');
    return res.json();
  },
  async removeTripItem(tripId: number, itemId: number): Promise<{ tripTotal: number }> {
    const res = await fetch(`${BASE_URL}/trips/${tripId}/items/${itemId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao remover item');
    return res.json();
  },
  async completeTrip(tripId: number, notes?: string): Promise<PurchaseTrip> {
    const res = await fetch(`${BASE_URL}/trips/${tripId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error('Erro ao finalizar compra');
    return res.json();
  },
  async cancelTrip(tripId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/trips/${tripId}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Erro ao cancelar compra');
  },
  async deleteTrip(tripId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/trips/${tripId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir histórico de compra');
  },
  async getTripsHistory(): Promise<PurchaseTrip[]> {
    const res = await fetch(`${BASE_URL}/trips?status=completed`);
    if (!res.ok) throw new Error('Erro ao carregar histórico');
    return res.json();
  },
  async getTripDetails(id: number): Promise<PurchaseTrip> {
    const res = await fetch(`${BASE_URL}/trips/${id}`);
    if (!res.ok) throw new Error('Erro ao carregar detalhes da compra');
    return res.json();
  },

  // Comparador de Preços
  async getProductPriceHistory(productId: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/price-history/product/${productId}`);
    if (!res.ok) throw new Error('Erro ao carregar histórico de preços');
    return res.json();
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${BASE_URL}/dashboard/stats`);
    if (!res.ok) throw new Error('Erro ao carregar estatísticas');
    return res.json();
  },

  // Importar / Exportar CSV
  async importCsv(file: File): Promise<{ message: string; imported: number; updated: number; skipped: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/csv/import/products`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao importar CSV');
    }
    return res.json();
  },
};
