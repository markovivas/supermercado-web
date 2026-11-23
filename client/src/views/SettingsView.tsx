import React, { useState } from 'react';
import { Store, Category } from '../types';
import { api } from '../api';
import {
  Settings,
  Store as StoreIcon,
  Tag,
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Pencil,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  X,
  Save,
} from 'lucide-react';

interface SettingsViewProps {
  stores: Store[];
  categories: Category[];
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  stores,
  categories,
  onRefreshData,
}) => {
  // Estados para nova loja
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeColor, setStoreColor] = useState('#2563eb');

  // Estados para editar loja
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editColor, setEditColor] = useState('#2563eb');
  const [editOrder, setEditOrder] = useState<number>(1);
  const [savingEdit, setSavingEdit] = useState(false);

  // Estados para nova categoria
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#10b981');

  // Estados para importação CSV de Produtos
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Estados para importação CSV de Supermercados
  const [csvStoresFile, setCsvStoresFile] = useState<File | null>(null);
  const [importingStores, setImportingStores] = useState(false);
  const [importStoresMessage, setImportStoresMessage] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Criar loja
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;

    try {
      await api.createStore({
        name: storeName.trim(),
        address: storeAddress.trim() || null,
        phone: storePhone.trim() || null,
        color: storeColor,
      });
      setStoreName('');
      setStoreAddress('');
      setStorePhone('');
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar loja');
    }
  };

  // Abrir modal de edição
  const openEditModal = (store: Store) => {
    setEditingStore(store);
    setEditName(store.name);
    setEditAddress(store.address || '');
    setEditPhone(store.phone || '');
    setEditColor(store.color || '#2563eb');
    setEditOrder(store.order || 1);
  };

  // Salvar edição de loja
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore || !editName.trim()) return;

    try {
      setSavingEdit(true);
      setErrorMsg(null);
      await api.updateStore(editingStore.id, {
        name: editName.trim(),
        address: editAddress.trim() || null,
        phone: editPhone.trim() || null,
        color: editColor,
        order: Number(editOrder),
      });
      setEditingStore(null);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar supermercado');
    } finally {
      setSavingEdit(false);
    }
  };

  // Mover loja (subir, descer, ir para topo ou ir para fim)
  const handleMoveStore = async (id: number, direction: 'up' | 'down' | 'top' | 'bottom') => {
    try {
      setErrorMsg(null);
      await api.moveStore(id, direction);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao reposicionar supermercado');
    }
  };

  // Excluir loja
  const handleDeleteStore = async (id: number) => {
    const confirm = window.confirm('Deseja excluir esta loja?');
    if (!confirm) return;

    try {
      await api.deleteStore(id);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir loja');
    }
  };

  // Criar categoria
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      await api.createCategory({
        name: categoryName.trim(),
        color: categoryColor,
      });
      setCategoryName('');
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar categoria');
    }
  };

  // Excluir categoria
  const handleDeleteCategory = async (id: number) => {
    const confirm = window.confirm('Deseja excluir esta categoria?');
    if (!confirm) return;

    try {
      await api.deleteCategory(id);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir categoria');
    }
  };

  // Importar CSV de Produtos
  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    try {
      setImporting(true);
      setErrorMsg(null);
      setImportMessage(null);
      const res = await api.importCsv(csvFile);
      setImportMessage(res.message);
      setCsvFile(null);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao importar arquivo');
    } finally {
      setImporting(false);
    }
  };

  // Importar CSV de Supermercados
  const handleImportStoresCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvStoresFile) return;

    try {
      setImportingStores(true);
      setErrorMsg(null);
      setImportStoresMessage(null);
      const res = await api.importStoresCsv(csvStoresFile);
      setImportStoresMessage(res.message);
      setCsvStoresFile(null);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao importar arquivo de supermercados');
    } finally {
      setImportingStores(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          <span>Configurações & Importação CSV</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Gerencie seus supermercados favoritos, categorias de produtos e dados em CSV.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3.5 rounded-2xl border border-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SEÇÃO 1: IMPORTAR E EXPORTAR CSV */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <span>Importação e Exportação de Dados (CSV)</span>
        </div>
        <p className="text-xs text-slate-500">
          Exporte e importe seus produtos, histórico de compras e supermercados em formato CSV (compatível com Excel).
        </p>

        {/* Exportar */}
        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Dados em CSV</span>
          </h3>
          <p className="text-xs text-slate-500">
            Baixe seus dados para abrir em planilhas ou guardar backups locais.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href="/api/csv/export/stores"
              download
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Exportar Supermercados (.csv)</span>
            </a>
            <a
              href="/api/csv/export/products"
              download
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar Produtos (.csv)</span>
            </a>
            <a
              href="/api/csv/export/purchases"
              download
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Exportar Compras (.csv)</span>
            </a>
          </div>
        </div>

        {/* Importar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Importar Supermercados */}
          <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/30 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Importar Supermercados (.csv)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Formato esperado: <code>Nome;Endereço;Telefone;Cor;Ordem</code>
            </p>
            <form onSubmit={handleImportStoresCsv} className="space-y-3">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvStoresFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
              />

              <button
                type="submit"
                disabled={!csvStoresFile || importingStores}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{importingStores ? 'Importando...' : 'Importar Supermercados'}</span>
              </button>

              {importStoresMessage && (
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{importStoresMessage}</span>
                </div>
              )}
            </form>
          </div>

          {/* Importar Produtos */}
          <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Importar Produtos (.csv)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Formato esperado: <code>Nome;Categoria;Preço;Unidade;Código</code>
            </p>
            <form onSubmit={handleImportCsv} className="space-y-3">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer"
              />

              <button
                type="submit"
                disabled={!csvFile || importing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{importing ? 'Importando...' : 'Importar Produtos'}</span>
              </button>

              {importMessage && (
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{importMessage}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: GERENCIAR LOJAS & SUPERMERCADOS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <StoreIcon className="w-5 h-5 text-emerald-600" />
            <span>Lojas e Supermercados ({stores.length})</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span>Dica: Use as setas para colocar seus favoritos no topo!</span>
          </div>
        </div>

        {/* Formulário Adicionar Loja */}
        <form onSubmit={handleCreateStore} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Adicionar Novo Supermercado:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              required
              placeholder="Nome da loja (ex: Supermercados BH)"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <input
              type="text"
              placeholder="Endereço (opcional)"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <input
              type="text"
              placeholder="Telefone (opcional)"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <div className="flex gap-2">
              <input
                type="color"
                value={storeColor}
                onChange={(e) => setStoreColor(e.target.value)}
                title="Cor do crachá da loja"
                className="w-10 h-10 rounded-xl cursor-pointer p-0.5 border border-slate-200 bg-white shrink-0"
              />
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Loja</span>
              </button>
            </div>
          </div>
        </form>

        {/* Lista Ordenada de Lojas */}
        {stores.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
            <StoreIcon className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Nenhum supermercado cadastrado</p>
            <p className="text-xs text-slate-500">
              Cadastre um supermercado no formulário acima ou importe sua planilha CSV.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stores.map((s, index) => (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl border border-slate-100 bg-white flex flex-col justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="flex flex-col items-center justify-center shrink-0 pt-0.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-2xs mb-1"
                        style={{ backgroundColor: s.color || '#3b82f6' }}
                      />
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-800 truncate">{s.name}</span>
                        {index === 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ★ 1º Lugar
                          </span>
                        )}
                      </div>
                      {s.address && (
                        <span className="text-xs text-slate-500 block truncate">
                          {s.address}
                        </span>
                      )}
                      {s.phone && s.phone !== 'Não informado' && (
                        <span className="text-[11px] text-slate-400 block truncate">
                          📞 {s.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botões de Ação: Editar e Excluir */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(s)}
                      title="Editar supermercado"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStore(s.id)}
                      title="Excluir supermercado"
                      className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Barra de Reordenação Rápida */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
                  <span className="text-[11px] font-medium text-slate-400">Posição:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveStore(s.id, 'top')}
                      disabled={index === 0}
                      title="Colocar em 1º lugar (Favorito)"
                      className="px-2 py-1 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 border border-slate-200/60"
                    >
                      <ChevronsUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Topo</span>
                    </button>
                    <button
                      onClick={() => handleMoveStore(s.id, 'up')}
                      disabled={index === 0}
                      title="Subir uma posição"
                      className="p-1 text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none border border-slate-200/60"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveStore(s.id, 'down')}
                      disabled={index === stores.length - 1}
                      title="Descer uma posição"
                      className="p-1 text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none border border-slate-200/60"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveStore(s.id, 'bottom')}
                      disabled={index === stores.length - 1}
                      title="Colocar em último lugar"
                      className="px-2 py-1 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 border border-slate-200/60"
                    >
                      <span>Fim</span>
                      <ChevronsDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO 3: GERENCIAR CATEGORIAS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
          <Tag className="w-5 h-5 text-emerald-600" />
          <span>Categorias de Produtos ({categories.length})</span>
        </div>

        {/* Formulário Adicionar Categoria */}
        <form onSubmit={handleCreateCategory} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Adicionar Nova Categoria:
          </h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              placeholder="Nome da categoria (ex: Hortifrúti, Padaria...)"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <div className="flex gap-2">
              <input
                type="color"
                value={categoryColor}
                onChange={(e) => setCategoryColor(e.target.value)}
                title="Cor da categoria"
                className="w-10 h-10 rounded-xl cursor-pointer p-0.5 border border-slate-200 bg-white"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Categoria</span>
              </button>
            </div>
          </div>
        </form>

        {/* Lista de Categorias */}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="px-3.5 py-1.5 rounded-xl border border-slate-100 bg-white shadow-2xs flex items-center gap-2 text-xs font-semibold text-slate-800"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: c.color || '#10b981' }}
              />
              <span>{c.name}</span>
              <button
                onClick={() => handleDeleteCategory(c.id)}
                title="Excluir categoria"
                className="p-1 text-slate-300 hover:text-red-600 rounded transition-colors ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE EDIÇÃO DE LOJA */}
      {editingStore && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-lg text-slate-900">Editar Supermercado</h3>
              </div>
              <button
                onClick={() => setEditingStore(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome do Supermercado:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Endereço:
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Ex: Av. Rei Pelé, 851"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Telefone:
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Ex: (35) 3231-4437"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ordem / Posição:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editOrder}
                    onChange={(e) => setEditOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cor do Crachá:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer p-0.5 border border-slate-200 bg-white"
                  />
                  <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                    {editColor}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingEdit ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
