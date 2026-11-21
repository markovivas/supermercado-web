import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  Category,
  Product,
  PurchaseTrip,
} from '../types';
import { api } from '../api';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Camera,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  ArrowRight,
  Store as StoreIcon,
  Tag,
  AlertCircle,
  Globe,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { AddProductModal } from '../components/AddProductModal';
import { PriceInput, QuantityInput } from '../components/NumericInputs';

interface LiveCartViewProps {
  stores: Store[];
  categories: Category[];
  activeTrip: PurchaseTrip | null;
  onTripUpdated: () => void;
  onNavigateToHistory: () => void;
}

export const LiveCartView: React.FC<LiveCartViewProps> = ({
  stores,
  categories,
  activeTrip,
  onTripUpdated,
  onNavigateToHistory,
}) => {
  // Estados para iniciar nova compra
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');
  const [tripDate, setTripDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tripNotes, setTripNotes] = useState('');

  // Estados de busca e adição rápida
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Modais
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [initialProductData, setInitialProductData] = useState<any>(null);

  // Feedback e Loading
  const [loadingAction, setLoadingAction] = useState(false);
  const [bannerAlert, setBannerAlert] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [justAddedId, setJustAddedId] = useState<number | null>(null);

  const searchBoxRef = useRef<HTMLDivElement>(null);

  const isBarcodePattern = /^\d{8,14}$/.test(searchTerm.trim());

  // Inicializar loja selecionada padrão
  useEffect(() => {
    if (stores.length > 0 && selectedStoreId === '') {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores]);

  // Fechar dropdown de busca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca de produtos com debounce
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.getProducts({ search: searchTerm.trim() });
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const showAlert = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setBannerAlert({ message, type });
    setTimeout(() => setBannerAlert(null), 6000);
  };

  // 1. Iniciar nova compra
  const handleStartTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) return;

    try {
      setLoadingAction(true);
      const res = await api.startTrip(Number(selectedStoreId), tripDate);
      if (res.alreadyActive) {
        showAlert('Já existe uma compra em andamento. Retomando...', 'info');
      } else {
        showAlert('Ida ao supermercado iniciada! Adicione seus itens conforme os coloca no carrinho.', 'success');
      }
      onTripUpdated();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao iniciar compras', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // 2. Adicionar produto existente ao carrinho
  const handleAddProductToCart = async (product: Product) => {
    if (!activeTrip) return;

    try {
      setLoadingAction(true);
      const defaultPrice = product.defaultPrice !== undefined && product.defaultPrice > 0 ? product.defaultPrice : 0;
      const res = await api.addItemToTrip(activeTrip.id, {
        productId: product.id,
        quantity: 1,
        unit: product.defaultUnit || 'un',
        unitPrice: defaultPrice,
      });

      setJustAddedId(res.item.id);
      setTimeout(() => setJustAddedId(null), 1000);

      setSearchTerm('');
      setShowSearchResults(false);
      showAlert(`+1 "${product.name}" adicionado ao carrinho!`, 'success');
      onTripUpdated();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao adicionar item', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // 3. Processar Código de Barras (Scanner ou Entrada Direta)
  const handleBarcodeScanned = async (barcode: string) => {
    setIsScannerOpen(false);
    setShowSearchResults(false);
    if (!activeTrip) return;

    showAlert(`Consultando código de barras: ${barcode}...`, 'info');

    try {
      setLoadingAction(true);
      const lookup = await api.lookupBarcode(barcode);

      if (lookup.found && lookup.source === 'local') {
        // Encontrado no banco local -> adiciona direto ao carrinho!
        await handleAddProductToCart(lookup.product);
      } else if (lookup.found && lookup.source === 'openfoodfacts') {
        // Encontrado no Open Food Facts -> abre modal com dados preenchidos da API
        setInitialProductData({
          name: lookup.product.name,
          barcode: lookup.product.barcode,
          brand: lookup.product.brand,
          imageUrl: lookup.product.imageUrl,
          defaultUnit: lookup.product.defaultUnit || 'un',
          defaultPrice: lookup.product.defaultPrice || 0,
          categoryId: lookup.product.categoryId,
        });
        setIsAddProductOpen(true);
        showAlert(`🎉 Encontrado no Open Food Facts: "${lookup.product.name}"! Confirme o preço para adicioná-lo.`, 'success');
      } else {
        // Não encontrado no Open Food Facts (ex: produto de marca própria como BH)
        setInitialProductData({
          barcode,
          name: '',
          defaultUnit: 'un',
          defaultPrice: 0,
        });
        setIsAddProductOpen(true);
        showAlert(
          `Código ${barcode} não foi localizado na base mundial do Open Food Facts (marcas próprias como BH frequentemente não estão cadastradas lá). Digite o nome do produto abaixo para salvá-lo!`,
          'info'
        );
      }
    } catch (err: any) {
      showAlert(err.message || 'Erro ao consultar código', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Tecla Enter no campo de busca
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const term = searchTerm.trim();

      if (/^\d{8,14}$/.test(term)) {
        // É um código de barras: dispara lookup direto!
        handleBarcodeScanned(term);
      } else if (searchResults.length > 0) {
        // Tem produtos encontrados: adiciona o primeiro
        handleAddProductToCart(searchResults[0]);
      }
    }
  };

  // 4. Salvar produto recém cadastrado e colocá-lo imediatamente no carrinho
  const handleSaveAndAddProduct = async (productData: any) => {
    const createdProduct = await api.createProduct(productData);
    if (activeTrip) {
      await handleAddProductToCart(createdProduct);
    }
  };

  // 5. Ajustar quantidade (+ / -)
  const handleUpdateQuantity = async (itemId: number, currentQty: number, delta: number) => {
    if (!activeTrip) return;
    const newQty = Number((currentQty + delta).toFixed(3));

    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      await api.updateTripItem(activeTrip.id, itemId, { quantity: newQty });
      onTripUpdated();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao atualizar quantidade', 'error');
    }
  };

  // 6. Atualizar preço ou unidade de um item do carrinho
  const handleUpdatePrice = async (itemId: number, newPrice: number) => {
    if (!activeTrip || newPrice < 0) return;
    try {
      await api.updateTripItem(activeTrip.id, itemId, { unitPrice: newPrice });
      onTripUpdated();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao atualizar preço', 'error');
    }
  };

  const handleUpdateUnit = async (itemId: number, newUnit: string) => {
    if (!activeTrip) return;
    try {
      await api.updateTripItem(activeTrip.id, itemId, { unit: newUnit });
      onTripUpdated();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao atualizar unidade', 'error');
    }
  };

  // 7. Remover item do carrinho
  const handleRemoveItem = async (itemId: number) => {
    if (!activeTrip) return;
    try {
      await api.removeTripItem(activeTrip.id, itemId);
      onTripUpdated();
      showAlert('Item removido do carrinho.', 'info');
    } catch (err: any) {
      showAlert(err.message || 'Erro ao remover item', 'error');
    }
  };

  // 8. Finalizar Compra
  const handleCompleteTrip = async () => {
    if (!activeTrip) return;

    if (activeTrip.items.length === 0) {
      showAlert('Seu carrinho está vazio! Adicione pelo menos um item antes de finalizar.', 'error');
      return;
    }

    const confirm = window.confirm(
      `Finalizar compras no valor de R$ ${activeTrip.totalAmount.toFixed(2)}?\n\nOs preços serão gravados no seu histórico para comparação futura!`
    );
    if (!confirm) return;

    try {
      setLoadingAction(true);
      await api.completeTrip(activeTrip.id, tripNotes);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      showAlert('🎉 Compra finalizada com sucesso! Histórico de preços atualizado.', 'success');
      onTripUpdated();
      setTimeout(() => {
        onNavigateToHistory();
      }, 1200);
    } catch (err: any) {
      showAlert(err.message || 'Erro ao finalizar compra', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // 9. Cancelar Compra
  const handleCancelTrip = async () => {
    if (!activeTrip) return;
    const confirm = window.confirm('Deseja realmente cancelar esta compra em andamento? O carrinho será descartado.');
    if (!confirm) return;

    try {
      setLoadingAction(true);
      await api.cancelTrip(activeTrip.id);
      showAlert('Compra cancelada.', 'info');
      onTripUpdated();
    } catch (err: any) {
      showAlert(err.message || 'Erro ao cancelar compra', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // ==========================================
  // RENDER: TELA INICIAL (QUANDO NÃO HÁ COMPRA ATIVA)
  // ==========================================
  if (!activeTrip) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          <div className="text-center max-w-md mx-auto mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Modo "Ir às Compras"
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Selecione o supermercado e comece a registrar os itens no carrinho em tempo real. Você saberá o total exato antes de chegar no caixa!
            </p>
          </div>

          <form onSubmit={handleStartTrip} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <StoreIcon className="w-4 h-4 text-emerald-600" />
                Qual supermercado ou loja você está visitando?
              </label>
              <select
                required
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-base font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.address ? `— ${s.address}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Data da Ida ao Mercado:
                </label>
                <input
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Observações / Objetivo:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Compras da semana, churrasco..."
                  value={tripNotes}
                  onChange={(e) => setTripNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingAction || stores.length === 0}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 group hover:scale-[1.01]"
            >
              <span>{loadingAction ? 'Iniciando...' : 'Iniciar Carrinho de Compras'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Dicas de Recursos */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500">
            <div className="flex items-start gap-2.5">
              <Camera className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Bipe o código de barras com a câmera do celular no corredor.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Busca automática na base Open Food Facts para novos itens.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Atualiza o comparador de preços automaticamente ao finalizar.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: TELA DE CARRINHO ATIVO (EM ANDAMENTO)
  // ==========================================
  const totalItemsCount = activeTrip.items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4">
      {/* Alerta / Toast Feedback */}
      {bannerAlert && (
        <div
          className={`p-3.5 rounded-2xl text-sm font-medium flex items-start sm:items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            bannerAlert.type === 'success'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : bannerAlert.type === 'error'
              ? 'bg-red-100 text-red-900 border border-red-300'
              : 'bg-blue-100 text-blue-900 border border-blue-300'
          }`}
        >
          {bannerAlert.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />}
          {bannerAlert.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 sm:mt-0" />}
          {bannerAlert.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />}
          <span className="flex-1">{bannerAlert.message}</span>
        </div>
      )}

      {/* STICKY TOP BANNER: TOTAL ACUMULADO AO VIVO */}
      <div className="sticky top-16 z-30 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-emerald-700/20 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                <StoreIcon className="w-3.5 h-3.5" />
                {activeTrip.store.name}
              </span>
              <span className="text-xs text-white/80 font-medium">
                {new Date(activeTrip.date).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <p className="text-xs text-emerald-100 uppercase tracking-wider font-semibold mt-1">
              Total no Carrinho:
            </p>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              R$ {activeTrip.totalAmount.toFixed(2)}
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="px-3 py-1 rounded-xl bg-white/20 text-xs sm:text-sm font-semibold backdrop-blur-xs">
              {activeTrip.items.length} {activeTrip.items.length === 1 ? 'produto' : 'produtos'} ({totalItemsCount.toFixed(totalItemsCount % 1 === 0 ? 0 : 2)} un/kg)
            </span>
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleCompleteTrip}
                disabled={loadingAction}
                className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Finalizar Compra</span>
              </button>
              <button
                onClick={handleCancelTrip}
                title="Descartar carrinho"
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE ADIÇÃO RÁPIDA: BUSCA + SCANNER */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200/80">
        <div className="flex gap-2 relative" ref={searchBoxRef}>
          {/* Campo de Busca com Autocomplete e Reconhecimento de Código de Barras */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (searchResults.length > 0 || isBarcodePattern) setShowSearchResults(true);
              }}
              placeholder="Digite o nome ou código de barras (Enter para buscar)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
            {isSearching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 animate-spin">
                ⏳
              </span>
            )}

            {/* Dropdown de Resultados ou Ação de Código de Barras */}
            {showSearchResults && (searchResults.length > 0 || isBarcodePattern) && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-40 max-h-80 overflow-y-auto">
                {/* Opção Rápida de Buscar Código no Open Food Facts se for numérico */}
                {isBarcodePattern && (
                  <div
                    onClick={() => handleBarcodeScanned(searchTerm.trim())}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100/80 cursor-pointer flex items-center justify-between border-b border-emerald-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs sm:text-sm">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span>Consultar código <strong>{searchTerm.trim()}</strong> no Open Food Facts</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                      Pressione Enter ↵
                    </span>
                  </div>
                )}

                {/* Produtos Locais */}
                {searchResults.length > 0 && (
                  <>
                    <div className="p-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Produtos no Catálogo ({searchResults.length}):
                    </div>
                    {searchResults.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleAddProductToCart(prod)}
                        className="p-3 hover:bg-emerald-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-900">{prod.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{ backgroundColor: prod.category?.color || '#10b981' }}
                            />
                            <span>{prod.category?.name}</span>
                            {prod.barcode && <span className="font-mono text-[11px]">[{prod.barcode}]</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-700">
                            R$ {prod.defaultPrice.toFixed(2)}
                          </div>
                          <span className="text-[11px] text-slate-400">por {prod.defaultUnit}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Botão de Câmera / Barcode Scanner */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Escanear</span>
          </button>

          {/* Botão de Criar Novo Produto Rápido */}
          <button
            type="button"
            onClick={() => {
              setInitialProductData(null);
              setIsAddProductOpen(true);
            }}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 transition-colors shrink-0"
            title="Novo Produto"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* LISTA DE ITENS NO CARRINHO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            <span>Itens no Carrinho ({activeTrip.items.length})</span>
          </div>
          <span className="text-xs text-slate-400">
            Ajuste a quantidade e o preço diretamente
          </span>
        </div>

        {activeTrip.items.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Seu carrinho está vazio</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Utilize a barra de busca acima ou o botão "Escanear" com a câmera para começar a registrar seus produtos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {activeTrip.items.map((item, index) => {
              const isHighlight = justAddedId === item.id;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={item.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isHighlight
                      ? 'bg-emerald-50/80'
                      : isEven
                      ? 'bg-white'
                      : 'bg-slate-50/60'
                  } hover:bg-emerald-50/30`}
                >
                  {/* Informações do Produto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base leading-snug truncate">
                        {item.product.name}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px]"
                        style={{
                          backgroundColor: `${item.product.category?.color || '#10b981'}15`,
                          color: item.product.category?.color || '#10b981',
                        }}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {item.product.category?.name || 'Geral'}
                      </span>

                      {item.product.barcode && (
                        <span className="font-mono text-[11px] text-slate-400">
                          {item.product.barcode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controles de Quantidade, Preço Unitário e Subtotal */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    {/* Stepper de Quantidade */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-l-xl transition-colors"
                        title="Diminuir"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <QuantityInput
                        value={item.quantity}
                        onChange={(newQty) => handleUpdateQuantity(item.id, 0, newQty)}
                        className="w-14 text-center text-sm font-bold text-slate-800 border-x border-slate-100 py-1 focus:outline-hidden"
                      />

                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-r-xl transition-colors"
                        title="Aumentar"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Unidade */}
                    <select
                      value={item.unit}
                      onChange={(e) => handleUpdateUnit(item.id, e.target.value)}
                      className="px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                    >
                      <option value="un">un</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="ml">ml</option>
                      <option value="cx">cx</option>
                      <option value="pct">pct</option>
                      <option value="dz">dz</option>
                    </select>

                    {/* Preço Unitário */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400 font-semibold">R$</span>
                      <PriceInput
                        value={item.unitPrice}
                        onChange={(newPrice) => handleUpdatePrice(item.id, newPrice)}
                        className="w-20 px-2 py-1 rounded-xl border border-slate-200 text-sm font-semibold text-right focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>

                    {/* Subtotal do Item */}
                    <div className="w-20 text-right">
                      <span className="text-sm font-extrabold text-slate-900 block">
                        R$ {item.totalPrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Remover */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover do carrinho"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL SCANNER DE CÓDIGO DE BARRAS */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
      />

      {/* MODAL CADASTRAR/EDITAR PRODUTO */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        categories={categories}
        initialData={initialProductData}
        onSave={handleSaveAndAddProduct}
      />
    </div>
  );
};
