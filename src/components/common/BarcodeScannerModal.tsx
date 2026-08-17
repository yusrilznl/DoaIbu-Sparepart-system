import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, CheckCircle2, AlertCircle, RefreshCw, ScanLine, Type, Plus, Tag } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string) => void;
  onUnrecognizedCode?: (unrecognizedCode: string) => void;
  title?: string;
}

// Brand words to ignore in OCR / QR text parsing
const COMMON_BRAND_WORDS = [
  'KUBOTA', 'FLEETGUARD', 'SANY', 'CAT', 'CATERPILLAR', 'DONALDSON',
  'KOMATSU', 'GENUINE', 'PARTS', 'ORIGINAL', 'MADE IN', 'JAPAN', 'INDONESIA',
  'CHINA', 'PART NO', 'PART', 'QTY', 'PCS', 'FILTER', 'OIL', 'FUEL', 'AIR'
];

export const BarcodeScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onUnrecognizedCode,
  title = 'Pemindai Barcode & Smart OCR Part Number'
}) => {
  const { parts, showToast } = useInventory();

  const [scanMode, setScanMode] = useState<'BARCODE' | 'OCR'>('BARCODE');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [flashSuccess, setFlashSuccess] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Unrecognized Code Prompt State
  const [unrecognizedPrompt, setUnrecognizedPrompt] = useState<string | null>(null);

  // Manual OCR Text Input state
  const [manualOcrText, setManualOcrText] = useState<string>('');

  // Camera Devices state
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const html5QrcodeInstanceRef = useRef<Html5Qrcode | null>(null);

  // Audio Bip! + Haptic Vibrator Feedback
  const triggerAudioAndHapticFeedback = () => {
    try {
      // Haptic Vibration (Supported on Android Chrome)
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      // Audio Bip!
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz Bip
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.error(e);
    }
  };

  // Smart Part Number Extractor (Cleans brand names & extracts Part Number string)
  const extractPartNumberFromRawText = (rawText: string): string => {
    let clean = rawText.trim();
    if (!clean) return '';

    // Remove common brand keywords
    COMMON_BRAND_WORDS.forEach(word => {
      const reg = new RegExp(`\\b${word}\\b`, 'gi');
      clean = clean.replace(reg, '');
    });

    // Match alphanumeric part numbers (e.g. W9501-45101, FS1280, LF3349, 1000700909, 1R-0716)
    const matches = clean.match(/[A-Z0-9]{2,}(?:[-/][A-Z0-9]+)*/gi);
    if (matches && matches.length > 0) {
      // Pick longest valid token which is likely the part number
      const sorted = matches.sort((a, b) => b.length - a.length);
      return sorted[0].toUpperCase();
    }

    return clean.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
  };

  const handleBarcodeFound = (decodedText: string) => {
    const extractedPartNo = extractPartNumberFromRawText(decodedText);
    if (!extractedPartNo) return;

    setLastScanned(extractedPartNo);
    setFlashSuccess(true);
    triggerAudioAndHapticFeedback();

    // Check if item exists in inventory database
    const existing = parts.find(p =>
      p.kodeItem.toLowerCase() === extractedPartNo.toLowerCase() ||
      (p.oemNumber && p.oemNumber.toLowerCase() === extractedPartNo.toLowerCase())
    );

    if (existing) {
      onScanSuccess(extractedPartNo);
    } else {
      // Item not found in database -> Show prompt to add new part
      setUnrecognizedPrompt(extractedPartNo);
      onScanSuccess(extractedPartNo);
    }

    setTimeout(() => {
      setFlashSuccess(false);
    }, 800);
  };

  // 1. Fetch available cameras on mount
  useEffect(() => {
    if (!isOpen) return;

    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          const formatted = devices.map((d, index) => ({
            id: d.id,
            label: d.label || `Kamera Belakang ${index + 1}`
          }));
          setCameras(formatted);

          // Default to rear/environment camera
          const backCam = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('0')
          );

          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch(err => {
        setCameraError('Kamera tidak terdeteksi atau izin kamera ditolak.');
      });
  }, [isOpen]);

  // 2. Start / Switch camera stream when selectedCameraId changes
  useEffect(() => {
    if (!isOpen || !selectedCameraId || scanMode !== 'BARCODE') return;

    let isMounted = true;

    const html5QrCode = new Html5Qrcode('reader-canvas-container');
    html5QrcodeInstanceRef.current = html5QrCode;

    const config = {
      fps: 20,
      qrbox: { width: 280, height: 160 },
      aspectRatio: 1.5,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.DATA_MATRIX
      ]
    };

    html5QrCode
      .start(
        selectedCameraId ? { deviceId: { exact: selectedCameraId } } : { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (isMounted) {
            handleBarcodeFound(decodedText);
          }
        },
        () => {}
      )
      .catch(() => {
        html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (text) => handleBarcodeFound(text),
          () => {}
        ).catch(() => {
          setCameraError('Gagal membuka streaming kamera HP.');
        });
      });

    return () => {
      isMounted = false;
      if (html5QrcodeInstanceRef.current && html5QrcodeInstanceRef.current.isScanning) {
        html5QrcodeInstanceRef.current.stop().catch(err => console.error(err));
      }
    };
  }, [isOpen, selectedCameraId, scanMode]);

  const handleManualOcrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualOcrText.trim()) {
      handleBarcodeFound(manualOcrText.trim());
      setManualOcrText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className={`bg-white border-2 rounded-2xl w-[95%] max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col transition-all duration-200 ${
        flashSuccess ? 'border-emerald-500 ring-4 ring-emerald-300' : 'border-slate-200'
      }`}>
        {/* Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h3 className="font-extrabold text-xs sm:text-sm truncate">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (MODE BARCODE 1D/2D vs MODE OCR TEKS) */}
        <div className="p-2 bg-slate-200 border-b border-slate-300 flex items-center gap-2 text-xs font-extrabold shrink-0">
          <button
            onClick={() => setScanMode('BARCODE')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
              scanMode === 'BARCODE'
                ? 'bg-[#0B3C85] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ScanLine className="w-4 h-4" /> Mode Barcode (1D / 2D)
          </button>

          <button
            onClick={() => setScanMode('OCR')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
              scanMode === 'OCR'
                ? 'bg-[#0B3C85] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Type className="w-4 h-4" /> Mode Baca Teks / OCR
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="p-4 bg-slate-100 space-y-3 flex-1 overflow-y-auto">
          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800 text-center flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Unrecognized Part Number Instant Add Prompt */}
          {unrecognizedPrompt && (
            <div className="p-3 bg-blue-50 border-2 border-blue-400 rounded-xl space-y-2 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#0B3C85] flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#0B3C85]" /> Part Number "{unrecognizedPrompt}" Belum Terdaftar
                </span>
                <button
                  onClick={() => setUnrecognizedPrompt(null)}
                  className="text-slate-400 hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-600 font-medium">
                Sistem tidak menemukan kode item ini di Master Katalog. Admin gudang bisa langsung menginput stok baru tanpa mengetik ulang:
              </p>

              {onUnrecognizedCode && (
                <button
                  onClick={() => {
                    const codeToPass = unrecognizedPrompt;
                    setUnrecognizedPrompt(null);
                    onClose();
                    onUnrecognizedCode(codeToPass);
                  }}
                  className="w-full py-2 bg-[#0B3C85] hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition"
                >
                  <Plus className="w-4 h-4" /> + Tambah Barang Baru dengan Kode [{unrecognizedPrompt}]
                </button>
              )}
            </div>
          )}

          {/* Mode BARCODE: Camera Canvas Stream */}
          {scanMode === 'BARCODE' && (
            <div className="space-y-3">
              {cameras.length > 1 && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 text-xs">
                  <RefreshCw className="w-4 h-4 text-slate-500 shrink-0" />
                  <label className="font-bold text-slate-700 whitespace-nowrap">Pilih Kamera:</label>
                  <select
                    value={selectedCameraId}
                    onChange={e => setSelectedCameraId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-900 focus:outline-none"
                  >
                    {cameras.map(cam => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[200px]">
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 p-4">
                  <div className={`w-[85%] max-w-[320px] h-[150px] border-2 border-dashed rounded-xl relative flex items-center justify-center transition-all duration-200 ${
                    flashSuccess ? 'border-emerald-400 bg-emerald-500/20 scale-105' : 'border-emerald-400/80 bg-emerald-500/5'
                  }`}>
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-sm" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-sm" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-sm" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-sm" />

                    <span className="text-[10px] font-mono font-bold text-emerald-300 bg-black/70 px-2.5 py-1 rounded-full border border-emerald-500/30 text-center">
                      Arahkan Kamera Ke Barcode Garis 1D / QR Code Dus
                    </span>
                  </div>
                </div>

                <div id="reader-canvas-container" className="w-full text-xs font-mono" />
              </div>
            </div>
          )}

          {/* Mode OCR: Manual Text Input / Smart Text Recognition */}
          {scanMode === 'OCR' && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                <Type className="w-4 h-4 text-[#0B3C85]" /> Input Teks / Salin Part Number Stiker Dus
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Gunakan mode ini jika stiker tidak memiliki barcode. Ketik atau salin nomor part number (misal: <strong className="font-mono text-black">FS1280, W9501-45101, LF3349</strong>) untuk langsung diproses sistem:
              </p>

              <form onSubmit={handleManualOcrSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Ketik Part Number (contoh: FS1280)..."
                  value={manualOcrText}
                  onChange={e => setManualOcrText(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-extrabold text-slate-900 focus:bg-white focus:border-[#0B3C85] focus:outline-none uppercase"
                />

                <button
                  type="submit"
                  disabled={!manualOcrText.trim()}
                  className="w-full py-2.5 bg-[#0B3C85] hover:bg-blue-900 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow transition"
                >
                  Proses Part Number Ini
                </button>
              </form>
            </div>
          )}

          {/* Audio Bip Feedback Status */}
          {flashSuccess && (
            <div className="w-full py-2 bg-emerald-600 text-white text-center font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 animate-bounce shadow">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" /> Bip! Part Number Terbaca: {lastScanned}
            </div>
          )}
        </div>

        {/* Sticky Footer Button */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow transition"
          >
            Selesai Scan (Tutup Kamera)
          </button>
        </div>
      </div>
    </div>
  );
};
