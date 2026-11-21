import React, { useEffect, useState } from 'react';
import { PurchaseTrip } from '../types';
import { api } from '../api';
import {
  History,
  Store as StoreIcon,
  Calendar,
  Receipt,
  X,
  Trash2,
  Tag,
  ArrowRight,
} from 'lucide-react';

export const TripsHistoryView: React.FC = () => {
  const [trips, setTrips] = useState<PurchaseTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<PurchaseTrip | null>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await api.getTripsHistory();
      setTrips(data);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (tripId: number) => {
    try {
      const details = await api.getTripDetails(tripId);
      setSelectedTrip(details);
    } catch (err) {
      console.error('Erro ao abrir detalhes:', err);
    }
  };

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: number) => {
    e.stopPropagation();
    const confirm = window.confirm('Tem certeza que deseja excluir esta compra do histórico?');
    if (!confirm) return;

    try {
      await api.deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      if (selectedTrip?.id === tripId) {
        setSelectedTrip(null);
      }
    } catch (err) {
      console.error('Erro ao excluir compra:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-emerald-600" />
          <span>Histórico de Compras</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Consulte todas as suas idas ao supermercado e veja os itens de cada nota.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Carregando histórico...</div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Nenhuma compra concluída ainda</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Quando você finalizar uma sessão no "Ir às Compras", ela aparecerá arquivada aqui com o recibo detalhado.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
          {trips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => handleOpenDetails(trip.id)}
              className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: trip.store.color || '#3b82f6' }}
                >
                  <StoreIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>{trip.store.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(trip.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span>•</span>
                    <span>{trip._count?.items ?? trip.items?.length ?? 0} produtos</span>
                    {trip.notes && <span>• {trip.notes}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-slate-900">
                    R$ {trip.totalAmount.toFixed(2)}
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Concluída
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteTrip(e, trip.id)}
                  title="Excluir do histórico"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <ArrowRight className="w-4 h-4 text-slate-300 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE RECIBO / CUPOM DETALHADO DA COMPRA */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Header Recibo */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedTrip.store.color || '#3b82f6' }}
                >
                  <StoreIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{selectedTrip.store.name}</h3>
                  <p className="text-xs text-slate-400">
                    {new Date(selectedTrip.date).toLocaleDateString('pt-BR')}
                    {selectedTrip.completedAt && ` • ${new Date(selectedTrip.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrip(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Itens do Recibo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Itens Adquiridos ({selectedTrip.items.length}):
              </div>

              {selectedTrip.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50/40 flex items-center justify-between text-sm"
                >
                  <div>
                    <div className="font-bold text-slate-900">{item.product.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
                        style={{
                          backgroundColor: `${item.product.category?.color || '#10b981'}15`,
                          color: item.product.category?.color || '#10b981',
                        }}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {item.product.category?.name || 'Geral'}
                      </span>
                      <span>
                        {item.quantity} {item.unit} × R$ {item.unitPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-extrabold text-slate-900">
                    R$ {item.totalPrice.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé com Total */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                  Total Pago:
                </span>
                <span className="text-2xl font-black text-slate-900">
                  R$ {selectedTrip.totalAmount.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
              >
                Fechar Recibo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
