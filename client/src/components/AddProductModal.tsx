import React, { useState, useEffect } from 'react';
import { Category, Product } from '../types';
import { X, Camera, PackagePlus } from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialData?: Partial<Product> | null;
  onSave: (product: any) => Promise<void>;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialData,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [defaultUnit, setDefaultUnit] = useState('un');
  const [defaultPrice, setDefaultPrice] = useState<string>('');
  const [brand, setBrand] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setBarcode(initialData.barcode || '');
      setCategoryId(initialData.categoryId || (categories[0]?.id ?? ''));
      setDefaultUnit(initialData.defaultUnit || 'un');
      setDefaultPrice(initialData.defaultPrice !== undefined ? String(initialData.defaultPrice) : '');
      setBrand(initialData.brand || '');
    } else {
      setName('');
      setBarcode('');
      setCategoryId(categories[0]?.id ?? '');
      setDefaultUnit('un');
      setDefaultPrice('');
      setBrand('');
    }
    setError(null);
  }, [initialData, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) {
      setError('Nome e categoria são obrigatórios');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        name: name.trim(),
        barcode: barcode.trim() || null,
        categoryId: Number(categoryId),
        defaultUnit,
        defaultPrice: defaultPrice ? parseFloat(defaultPrice.replace(',', '.')) : 0,
        brand: brand.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar produto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold">
              <PackagePlus className="w-5 h-5 text-emerald-600" />
              <span>{initialData?.id ? 'Editar Produto' : 'Cadastrar Novo Produto'}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            {/* Código de barras com botão de scan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código de Barras (EAN):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Ex: 7891000100103"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Escanear</span>
                </button>
              </div>
            </div>

            {/* Nome do Produto */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Produto: *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Arroz Branco Tipo 1 5kg"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Categoria & Marca */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoria: *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Selecione...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marca (Opcional):
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ex: Camil, Nestlé"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Preço Padrão & Unidade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preço Padrão (R$):
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  onFocus={(e) => e.target.select()}
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unidade Padrão:
                </label>
                <select
                  value={defaultUnit}
                  onChange={(e) => setDefaultUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="un">Unidade (un)</option>
                  <option value="kg">Quilo (kg)</option>
                  <option value="g">Gramas (g)</option>
                  <option value="l">Litro (l)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="pct">Pacote (pct)</option>
                  <option value="dz">Dúzia (dz)</option>
                </select>
              </div>
            </div>

            {/* Ações */}
            <div className="pt-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          setBarcode(code);
          setIsScannerOpen(false);
        }}
      />
    </>
  );
};
