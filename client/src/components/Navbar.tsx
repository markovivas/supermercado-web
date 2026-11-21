import React from 'react';
import { ShoppingCart, LayoutDashboard, History, Package, Settings } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  hasActiveTrip: boolean;
  activeTripTotal?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  hasActiveTrip,
  activeTripTotal = 0,
}) => {
  const tabs = [
    {
      id: 'cart',
      label: 'Ir às Compras',
      icon: ShoppingCart,
      badge: hasActiveTrip ? `R$ ${activeTripTotal.toFixed(2)}` : null,
      highlight: hasActiveTrip,
    },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'settings', label: 'Ajustes & CSV', icon: Settings },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            onClick={() => onSelectTab('cart')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                Supermercado <span className="text-emerald-600">Web</span>
              </span>
              <span className="text-xs text-slate-500 font-medium block">Controle & Carrinho ao Vivo</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>

                  {tab.badge && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-emerald-600 text-white rounded-full shadow-xs animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (App Feel) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 flex justify-around items-center shadow-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-xs transition-colors ${
                isActive ? 'text-emerald-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                {tab.highlight && tab.id === 'cart' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-ping" />
                )}
              </div>
              <span className="text-[11px] leading-tight">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
