import React from 'react';
import { useInventory } from '../../context/InventoryContext';

export const ToastContainer: React.FC = () => {
  const { toast } = useInventory();

  if (!toast.visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce">
      <div className={`px-5 py-3 rounded-2xl shadow-2xl text-white font-extrabold text-xs flex items-center gap-2 border ${
        toast.type === 'success' ? 'bg-emerald-600 border-emerald-400' :
        toast.type === 'error' ? 'bg-red-600 border-red-400' : 'bg-slate-900 border-slate-700'
      }`}>
        <span>{toast.message}</span>
      </div>
    </div>
  );
};
