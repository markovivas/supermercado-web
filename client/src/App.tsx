import { useState, useEffect } from 'react';
import { Store, Category, PurchaseTrip } from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { LiveCartView } from './views/LiveCartView';
import { DashboardView } from './views/DashboardView';
import { TripsHistoryView } from './views/TripsHistoryView';
import { ProductsView } from './views/ProductsView';
import { SettingsView } from './views/SettingsView';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('cart');
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTrip, setActiveTrip] = useState<PurchaseTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [storesData, categoriesData, activeTripData] = await Promise.all([
        api.getStores(),
        api.getCategories(),
        api.getActiveTrip(),
      ]);

      setStores(storesData);
      setCategories(categoriesData);
      setActiveTrip(activeTripData);
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshActiveTrip = async () => {
    try {
      const trip = await api.getActiveTrip();
      setActiveTrip(trip);
    } catch (err) {
      console.error('Erro ao atualizar compra ativa:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 pb-20 md:pb-8">
      {/* Navbar Superior & Bottom Bar Mobile */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hasActiveTrip={!!activeTrip}
        activeTripTotal={activeTrip?.totalAmount || 0}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Iniciando Supermercado Web...</p>
          </div>
        ) : (
          <>
            {currentTab === 'cart' && (
              <LiveCartView
                stores={stores}
                categories={categories}
                activeTrip={activeTrip}
                onTripUpdated={refreshActiveTrip}
                onNavigateToHistory={() => setCurrentTab('history')}
              />
            )}

            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigateToHistory={() => setCurrentTab('history')}
                onNavigateToCart={() => setCurrentTab('cart')}
              />
            )}

            {currentTab === 'history' && <TripsHistoryView />}

            {currentTab === 'products' && (
              <ProductsView categories={categories} />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                stores={stores}
                categories={categories}
                onRefreshData={loadInitialData}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
