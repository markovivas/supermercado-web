import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, Sparkles, ShieldAlert, ExternalLink } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHttpRemote =
    typeof window !== 'undefined' &&
    window.location.protocol === 'http:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  // Som de bipe via Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Ignora falhas de áudio
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setCameraError(null);
    setManualCode('');

    // Se estiver em HTTP não-localhost, navegadores mobile desativam navigator.mediaDevices
    if (isHttpRemote) {
      setCameraError(
        'O Chrome/Safari no celular bloqueia a câmera de vídeo ao vivo em conexões HTTP normais por segurança. Acesse via HTTPS ou use o botão "Tirar Foto" abaixo!'
      );
      return;
    }

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('barcode-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            playBeep();
            stopScanner();
            onScan(decodedText);
          },
          () => {
            // Ignora frames sem código
          }
        );

        setIsScanning(true);
      } catch (err: any) {
        console.warn('Erro ao iniciar câmera:', err);
        setCameraError(
          'Não foi possível iniciar a câmera ao vivo. Use o botão "Tirar Foto" abaixo para escanear usando o aplicativo da câmera do seu celular.'
        );
        setIsScanning(false);
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, isHttpRemote]);

  const stopScanner = async () => {
    if (scannerRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Erro ao parar scanner:', err);
      } finally {
        scannerRef.current = null;
        isStoppingRef.current = false;
        setIsScanning(false);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim();
    if (clean) {
      playBeep();
      stopScanner();
      onScan(clean);
    }
  };

  const handleQuickTest = (code: string) => {
    playBeep();
    stopScanner();
    onScan(code);
  };

  // Escanear código a partir de uma foto tirada pelo celular (Funciona 100% mesmo em HTTP!)
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      setCameraError(null);

      // Usar instância temporária do Html5Qrcode para decodificar o arquivo
      const html5QrCode = new Html5Qrcode('barcode-photo-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      
      playBeep();
      stopScanner();
      onScan(decodedText);
    } catch (err: any) {
      console.warn('Erro ao decodificar imagem:', err);
      setCameraError('Não foi possível ler o código na foto. Certifique-se de focar bem no código de barras e tente novamente.');
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  const httpsUrl = typeof window !== 'undefined' 
    ? `https://${window.location.hostname}:3000/`
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Camera className="w-5 h-5 text-emerald-600" />
            <span>Escanear Código de Barras</span>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Câmera / Área do Scanner */}
        <div className="p-4 bg-slate-900 flex flex-col items-center justify-center relative min-h-[220px]">
          <div
            id="barcode-reader"
            className="w-full max-w-[320px] rounded-lg overflow-hidden"
          />
          {/* Elemento oculto para processar fotos */}
          <div id="barcode-photo-temp" className="hidden" />

          {isHttpRemote && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-3.5 rounded-2xl text-xs max-w-sm space-y-2">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Você está acessando via <strong>HTTP</strong> no celular. Os navegadores exigem <strong>HTTPS</strong> para liberar a câmera ao vivo.
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <a
                  href={httpsUrl}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs inline-flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Acessar via HTTPS</span>
                </a>
              </div>
            </div>
          )}

          {cameraError && !isHttpRemote && (
            <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 text-xs flex items-start gap-2 max-w-sm mt-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {isScanning && !cameraError && (
            <p className="text-white/80 text-xs text-center mt-3 animate-pulse">
              Aponte a câmera para o código de barras do produto...
            </p>
          )}

          {isProcessingPhoto && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-white text-xs gap-2">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span>Identificando código de barras na foto...</span>
            </div>
          )}
        </div>

        {/* AÇÕES DE CAPTURA & ENTRADA MANUAL */}
        <div className="p-5 bg-white border-t border-slate-100 space-y-4">
          {/* BOTÃO NATIVO: TIRAR FOTO COM A CÂMERA DO CELULAR (Funciona sempre!) */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-98"
            >
              <Camera className="w-4 h-4" />
              <span>Tirar Foto do Código com a Câmera</span>
            </button>
            <span className="block text-[11px] text-slate-400 text-center mt-1">
              Abre o app de câmera do seu celular e lê o código direto da foto
            </span>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-100" />
            <span className="flex-shrink mx-3 text-slate-300 text-[11px] font-bold uppercase">ou digite</span>
            <div className="flex-grow border-t border-slate-100" />
          </div>

          {/* Fallback de Entrada Manual */}
          <form onSubmit={handleManualSubmit}>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: 7894900010015"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Testes Rápidos com Códigos Reais */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Exemplos rápidos para testar:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickTest('7894900010015')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-medium transition-colors"
              >
                🥤 Coca-Cola 350ml
              </button>
              <button
                type="button"
                onClick={() => handleQuickTest('7891000315507')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-medium transition-colors"
              >
                ☕ Nescafé Matinal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
