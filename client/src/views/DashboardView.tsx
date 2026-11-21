import React, { useEffect, useState } from 'react';
import { DashboardStats } from '../types';
import { api } from '../api';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Store as StoreIcon,
  Calendar,
  CreditCard,
  PieChart,
  Receipt,
  ArrowRight,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToHistory: () => void;
  onNavigateToCart: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToHistory,
  onNavigateToCart,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Calculando estatísticas de compras...</p>
      </div>
    );
  }

  if (!stats) return null;

  const { summary, byCategory, byStore, recentTrips } = stats;

  const diffMonth = summary.totalSpentLastMonth > 0
    ? ((summary.totalSpent - summary.totalSpentLastMonth) / summary.totalSpentLastMonth) * 100
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Cabeçalho do Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-emerald-600" />
            <span>Dashboard Financeiro</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 capitalize">
            Visão geral de {summary.monthName}
          </p>
        </div>

        <button
          onClick={onNavigateToCart}
          className="self-start sm:self-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Fazer Compras Agora</span>
        </button>
      </div>

      {/* CARDS DE RESUMO (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gasto no Mês */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Total Gasto no Mês</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            R$ {summary.totalSpent.toFixed(2)}
          </div>
          {summary.totalSpentLastMonth > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs font-medium">
              {diffMonth <= 0 ? (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {Math.abs(diffMonth).toFixed(1)}% menor que mês passado
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {diffMonth.toFixed(1)}% maior que mês passado
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quantidade de Idas ao Supermercado */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Idas ao Mercado</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {summary.tripCount} {summary.tripCount === 1 ? 'compra' : 'compras'}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {summary.totalItemsCount} produtos no total
          </p>
        </div>

        {/* Ticket Médio por Compra */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Ticket Médio por Ida</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            R$ {summary.avgTicket.toFixed(2)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Gasto médio por visita
          </p>
        </div>

        {/* Mês Anterior */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Mês Anterior</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-700">
            R$ {summary.totalSpentLastMonth.toFixed(2)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Gasto total fechado
          </p>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: GASTOS POR CATEGORIA E POR LOJA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Categoria */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-base">Gastos por Categoria</h2>
            <span className="text-xs text-slate-400">Onde vai seu dinheiro</span>
          </div>

          {byCategory.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Nenhuma compra registrada neste mês.</p>
          ) : (
            <div className="space-y-3.5">
              {byCategory.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                    <span className="font-bold text-slate-900">
                      R$ {cat.total.toFixed(2)}{' '}
                      <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color || '#10b981',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribuição por Supermercado / Loja */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-base">Gastos por Supermercado</h2>
            <span className="text-xs text-slate-400">Lojas mais frequentadas</span>
          </div>

          {byStore.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Nenhuma compra registrada neste mês.</p>
          ) : (
            <div className="space-y-3">
              {byStore.map((store) => (
                <div
                  key={store.name}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: store.color }}
                    />
                    <div>
                      <span className="font-bold text-sm text-slate-800">{store.name}</span>
                      <span className="block text-[11px] text-slate-400">
                        {store.tripCount} {store.tripCount === 1 ? 'ida' : 'idas'} ao mercado
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-extrabold text-sm text-slate-900">
                    R$ {store.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ÚLTIMAS COMPRAS REGISTRADAS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Últimas Compras Concluídas</span>
          </h2>
          <button
            onClick={onNavigateToHistory}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
          >
            <span>Ver Histórico Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTrips.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Nenhuma compra concluída ainda.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={onNavigateToHistory}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs"
                    style={{ backgroundColor: trip.store.color || '#3b82f6' }}
                  >
                    <StoreIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{trip.store.name}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(trip.date).toLocaleDateString('pt-BR')} • {trip._count?.items ?? 0} itens
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-sm text-slate-900">
                    R$ {trip.totalAmount.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">Concluída</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
