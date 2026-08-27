import React from 'react';
import { X, ZoomIn, Download } from 'lucide-react';

interface ImageZoomModalProps {
  src: string;
  title: string;
  subTitle?: string;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ src, title, subTitle, onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 no-print"
      onClick={onClose}
    >
      <div 
        className="relative bg-white border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZoomIn className="w-5 h-5 text-[#0B3C85]" />
            <div>
              <h3 className="font-black text-black text-sm sm:text-base leading-tight uppercase">{title}</h3>
              {subTitle && <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">{subTitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={src}
              download={`${title.replace(/\s+/g, '_')}_Foto.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-600 hover:text-black hover:bg-slate-200 transition"
              title="Unduh Foto Produk"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-black hover:bg-slate-200 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Big High Resolution Image Container */}
        <div className="p-4 sm:p-6 bg-slate-900 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-auto">
          <img
            src={src}
            alt={title}
            className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-center text-xs font-bold text-slate-500">
          Klik tombol ✕ atau area luar foto untuk menutup pratinjau
        </div>
      </div>
    </div>
  );
};
