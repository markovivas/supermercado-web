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
  const [storeColor, setStoreColor] = useState('#2563eb');

  // Estados para nova categoria
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#10b981');

  // Estados para importação CSV
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Criar loja
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;

    try {
      await api.createStore({
        name: storeName.trim(),
        address: storeAddress.trim() || null,
        color: storeColor,
      });
      setStoreName('');
      setStoreAddress('');
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar loja');
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

  // Importar CSV
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
          Compatível com o formato CSV do plugin legado anterior (Nome; Categoria; Preço Padrão; Unidade Padrão; Código de Barras).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Exportar */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Exportar Dados</span>
            </h3>
            <p className="text-xs text-slate-500">
              Baixe seus dados para abrir no Excel ou guardar como backup.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
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
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exportar Compras (.csv)</span>
              </a>
            </div>
          </div>

          {/* Importar */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Importar Produtos via CSV</span>
            </h3>
            <form onSubmit={handleImportCsv} className="space-y-3">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />

              <button
                type="submit"
                disabled={!csvFile || importing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{importing ? 'Processando...' : 'Iniciar Importação'}</span>
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
        <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
          <StoreIcon className="w-5 h-5 text-emerald-600" />
          <span>Lojas e Supermercados ({stores.length})</span>
        </div>

        {/* Formulário Adicionar Loja */}
        <form onSubmit={handleCreateStore} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Adicionar Novo Supermercado:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Nome da loja (ex: Assaí Atacadista)"
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
            <div className="flex gap-2">
              <input
                type="color"
                value={storeColor}
                onChange={(e) => setStoreColor(e.target.value)}
                title="Cor do crachá da loja"
                className="w-10 h-10 rounded-xl cursor-pointer p-0.5 border border-slate-200 bg-white"
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

        {/* Lista de Lojas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {stores.map((s) => (
            <div
              key={s.id}
              className="p-3.5 rounded-2xl border border-slate-100 bg-white flex items-center justify-between shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color || '#3b82f6' }}
                />
                <div>
                  <span className="font-bold text-sm text-slate-800 block">{s.name}</span>
                  {s.address && (
                    <span className="text-xs text-slate-400 block truncate max-w-[180px]">
                      {s.address}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDeleteStore(s.id)}
                title="Excluir loja"
                className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
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
    </div>
  );
};
