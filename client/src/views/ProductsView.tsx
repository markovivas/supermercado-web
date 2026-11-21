import React, { useEffect, useState } from 'react';
import { Product, Category } from '../types';
import { api } from '../api';
import {
  Package,
  Plus,
  Search,
  Tag,
  BarChart2,
  Trash2,
  Edit2,
  X,
  Store as StoreIcon,
  Sparkles,
  Award,
} from 'lucide-react';
import { AddProductModal } from '../components/AddProductModal';

interface ProductsViewProps {
  categories: Category[];
}

export const ProductsView: React.FC<ProductsViewProps> = ({ categories }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');

  // Modais
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Comparador de Preços Modal
  const [comparisonProduct, setComparisonProduct] = useState<Product | null>(null);
  const [priceHistoryData, setPriceHistoryData] = useState<any>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [searchTerm, selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts({
        search: searchTerm || undefined,
        categoryId: selectedCategory ? Number(selectedCategory) : undefined,
      });
      setProducts(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenComparison = async (product: Product) => {
    setComparisonProduct(product);
    try {
      setLoadingComparison(true);
      const data = await api.getProductPriceHistory(product.id);
      setPriceHistoryData(data);
    } catch (err) {
      console.error('Erro ao carregar histórico de preços:', err);
    } finally {
      setLoadingComparison(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const confirm = window.confirm('Deseja excluir este produto do catálogo?');
    if (!confirm) return;

    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir produto');
    }
  };

  const handleSaveProduct = async (data: any) => {
    if (editingProduct) {
      await api.updateProduct(editingProduct.id, data);
    } else {
      await api.createProduct(data);
    }
    loadProducts();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Catálogo & Comparador de Preços</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gerencie seus itens e compare onde eles estão mais baratos entre supermercados.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsAddOpen(true);
          }}
          className="self-start sm:self-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, marca ou código de barras..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <option value="">Todas as Categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Produtos */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Carregando produtos...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Nenhum produto encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Cadastre um produto manualmente ou importe uma lista via CSV nas configurações.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px]"
                    style={{
                      backgroundColor: `${prod.category?.color || '#10b981'}15`,
                      color: prod.category?.color || '#10b981',
                    }}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {prod.category?.name || 'Geral'}
                  </span>

                  {prod.barcode && (
                    <span className="font-mono text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                      {prod.barcode}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-2 group-hover:text-emerald-700 transition-colors">
                  {prod.name}
                </h3>
                {prod.brand && (
                  <span className="text-xs text-slate-400 block">{prod.brand}</span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Preço de Referência:</span>
                  <span className="text-base font-extrabold text-slate-900">
                    R$ {prod.defaultPrice.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-slate-400">/{prod.defaultUnit}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenComparison(prod)}
                    title="Comparar Preços entre Mercados"
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Comparar</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingProduct(prod);
                      setIsAddOpen(true);
                    }}
                    title="Editar produto"
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(prod.id)}
                    title="Excluir produto"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE COMPARAÇÃO DE PREÇOS ENTRE SUPERMERCADOS */}
      {comparisonProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Comparador Inteligente</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mt-0.5">
                  {comparisonProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setComparisonProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo da Comparação */}
            <div className="p-6 space-y-4">
              {loadingComparison ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Carregando histórico em diferentes supermercados...
                </div>
              ) : !priceHistoryData || priceHistoryData.byStore?.length === 0 ? (
                <div className="p-8 text-center">
                  <StoreIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Sem histórico em lojas ainda</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Conforme você realizar compras usando o modo "Ir às Compras", os preços pagos em cada loja serão mapeados automaticamente aqui!
                  </p>
                </div>
              ) : (
                <>
                  {/* Card de Melhor Preço */}
                  {priceHistoryData.bestDeal && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                          Menor Preço Encontrado:
                        </span>
                        <div className="text-lg font-extrabold text-emerald-950">
                          R$ {priceHistoryData.bestDeal.price.toFixed(2)}{' '}
                          <span className="text-xs font-semibold text-emerald-800">
                            no {priceHistoryData.bestDeal.storeName}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tabela de Preços por Supermercado */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Último preço registrado em cada loja:
                    </span>

                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                      {priceHistoryData.byStore.map((storeData: any) => {
                        const isBest = storeData.price === priceHistoryData.bestDeal?.price;

                        return (
                          <div
                            key={storeData.storeName}
                            className={`p-3.5 flex items-center justify-between text-sm ${
                              isBest ? 'bg-emerald-50/40 font-semibold' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: storeData.storeColor }}
                              />
                              <span className="text-slate-800">{storeData.storeName}</span>
                              {isBest && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                                  Mais barato!
                                </span>
                              )}
                            </div>

                            <div className="text-right">
                              <span className="text-sm font-extrabold text-slate-900">
                                R$ {storeData.price.toFixed(2)}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {new Date(storeData.date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/80 text-right">
              <button
                type="button"
                onClick={() => setComparisonProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR/EDITAR */}
      <AddProductModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        categories={categories}
        initialData={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
};
