export interface Category {
  id: number;
  name: string;
  color?: string;
  icon?: string;
  _count?: {
    products: number;
  };
}

export interface Store {
  id: number;
  name: string;
  address?: string | null;
  color?: string;
  _count?: {
    trips: number;
  };
}

export interface Product {
  id: number;
  name: string;
  barcode?: string | null;
  categoryId: number;
  category: Category;
  defaultUnit: string;
  defaultPrice: number;
  brand?: string | null;
  imageUrl?: string | null;
  priceHistory?: PriceHistory[];
}

export interface PurchaseItem {
  id: number;
  tripId: number;
  productId: number;
  product: Product;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string | null;
}

export interface PurchaseTrip {
  id: number;
  storeId: number;
  store: Store;
  date: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  totalAmount: number;
  notes?: string | null;
  items: PurchaseItem[];
  createdAt: string;
  completedAt?: string | null;
  _count?: {
    items: number;
  };
}

export interface PriceHistory {
  id: number;
  productId: number;
  storeId: number;
  store: Store;
  price: number;
  unit: string;
  recordedAt: string;
}

export interface DashboardStats {
  summary: {
    totalSpent: number;
    totalSpentLastMonth: number;
    tripCount: number;
    totalItemsCount: number;
    avgTicket: number;
    monthName: string;
  };
  byCategory: Array<{
    name: string;
    color: string;
    total: number;
    count: number;
    percentage: number;
  }>;
  byStore: Array<{
    name: string;
    color: string;
    total: number;
    tripCount: number;
  }>;
  recentTrips: PurchaseTrip[];
}
