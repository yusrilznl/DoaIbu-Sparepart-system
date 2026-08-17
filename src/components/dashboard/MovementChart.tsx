import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

const CHART_DATA = [
  { day: '06 Aug', Masuk: 120, Keluar: 85 },
  { day: '07 Aug', Masuk: 45, Keluar: 90 },
  { day: '08 Aug', Masuk: 200, Keluar: 140 },
  { day: '09 Aug', Masuk: 80, Keluar: 110 },
  { day: '10 Aug', Masuk: 160, Keluar: 95 },
  { day: '11 Aug', Masuk: 90, Keluar: 180 },
  { day: '12 Aug', Masuk: 210, Keluar: 130 },
  { day: '13 Aug', Masuk: 150, Keluar: 160 },
];

export const MovementChart: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Grafik Mutasi Fisik (Masuk vs Keluar)</h3>
          <p className="text-xs text-slate-500 font-medium">Volume barang masuk (restock) vs barang keluar (mutasi/WO) 8 hari terakhir</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-900 text-white font-bold px-2.5 py-1 rounded-lg">
            Harian
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
            <Bar dataKey="Masuk" fill="#10b981" radius={[4, 4, 0, 0]} name="Stok Masuk (Inbound)" />
            <Bar dataKey="Keluar" fill="#FF1E27" radius={[4, 4, 0, 0]} name="Stok Keluar (Outbound)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
