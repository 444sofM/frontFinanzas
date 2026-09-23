import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Download, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import toast from 'react-hot-toast';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const COLORS = ['#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6','#f97316'];

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1623] border border-white/[0.1] rounded-2xl p-3 shadow-2xl min-w-32">
      <p className="text-slate-400 text-xs mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-slate-300 text-xs">{p.name}:</span>
          <span className="text-white font-bold text-xs">{Number(p.value).toLocaleString('es-ES')}</span>
        </div>
      ))}
    </div>
  );
};

export default function Reportes() {
  const { user } = useAuth();
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes]   = useState(new Date().getMonth() + 1);
  const [resumen, setResumen] = useState<any>(null);
  const [anual, setAnual]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: user?.moneda || 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const [r, a] = await Promise.all([
          api.get(`/transacciones/resumen?mes=${mes}&anio=${anio}`),
          api.get(`/transacciones/resumen-anual?anio=${anio}`),
        ]);
        setResumen(r.data);
        const mapa: Record<string, any> = {};
        MESES.forEach((m, i) => { mapa[(i+1).toString().padStart(2,'0')] = { mes: m, Ingresos: 0, Egresos: 0 }; });
        a.data.forEach((d: any) => {
          if (mapa[d.mes]) {
            if (d.tipo === 'ingreso') mapa[d.mes].Ingresos = d.total;
            else mapa[d.mes].Egresos = d.total;
          }
        });
        setAnual(Object.values(mapa));
      } catch { toast.error('Error al cargar datos'); }
      finally { setLoading(false); }
    };
    cargar();
  }, [mes, anio]);

  const ahorro = resumen?.ingresos > 0
    ? (((resumen.ingresos - resumen.egresos) / resumen.ingresos) * 100).toFixed(1)
    : '0';

  const pieData = resumen?.por_categoria_egreso?.slice(0, 6).map((c: any) => ({
    name: `${c.icono} ${c.nombre}`, value: c.total,
  })) || [];

  const anioActual = new Date().getFullYear();
  const exportarCSV = async () => {
    try {
      const res = await api.get(`/transacciones/exportar?mes=${mes}&anio=${anio}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a'); a.href = url;
      a.download = `reporte_${anio}_${mes.toString().padStart(2,'0')}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Reporte exportado');
    } catch { toast.error('Error al exportar'); }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Reportes</h1>
          <p className="text-slate-500 text-sm mt-1">Análisis financiero detallado</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <select className="input py-2 text-sm w-auto" value={mes} onChange={e => setMes(parseInt(e.target.value))}>
            {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input py-2 text-sm w-auto" value={anio} onChange={e => setAnio(parseInt(e.target.value))}>
            {[anioActual-2, anioActual-1, anioActual].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={exportarCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl animate-shimmer bg-white/[0.04]" />)}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Ingresos del mes', valor: resumen?.ingresos || 0, color: 'text-emerald-400', icon: TrendingUp,  bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { label: 'Egresos del mes',  valor: resumen?.egresos  || 0, color: 'text-red-400',     icon: TrendingDown,bg: 'bg-red-500/10',     border: 'border-red-500/20' },
              { label: 'Tasa de ahorro',   valor: null, ahorro, color: parseFloat(ahorro) >= 0 ? 'text-violet-300' : 'text-red-400',
                icon: Percent, bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
            ].map(k => (
              <div key={k.label} className={`stat-card ${k.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">{k.label}</span>
                  <div className={`w-9 h-9 ${k.bg} rounded-xl flex items-center justify-center`}>
                    <k.icon size={17} className={k.color} />
                  </div>
                </div>
                <p className={`text-2xl font-extrabold ${k.color}`}>
                  {k.valor !== null ? fmt(k.valor) : `${k.ahorro}%`}
                </p>
              </div>
            ))}
          </div>

          {/* Gráfico anual */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold">Comparativo Anual {anio}</h3>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Ingresos</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Egresos</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={anual} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="mes" stroke="transparent" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} />
                <YAxis stroke="transparent" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[6,6,0,0]} />
                <Bar dataKey="Egresos"  fill="#ef4444" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie + Tabla */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie */}
            <div className="card">
              <h3 className="text-white font-bold mb-5">Distribución de Gastos</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                      label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                      {pieData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any) => fmt(Number(v))}
                      contentStyle={{ background: '#0f1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-slate-600 gap-2">
                  <TrendingDown size={28} className="opacity-30" />
                  <p className="text-sm">Sin datos de egresos</p>
                </div>
              )}
            </div>

            {/* Tabla */}
            <div className="card p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.05]">
                <h3 className="text-white font-bold">Detalle por Categoría</h3>
              </div>
              {(resumen?.por_categoria_egreso?.length || 0) > 0 ? (
                <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
                  {resumen.por_categoria_egreso.map((c: any, i: number) => {
                    const pct = resumen.egresos > 0 ? (c.total / resumen.egresos * 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                        <span className="text-lg flex-shrink-0">{c.icono}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-slate-300 text-sm truncate">{c.nombre}</p>
                            <span className="text-slate-500 text-xs ml-2">({c.cantidad})</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: c.color || COLORS[i] }} />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-red-400 text-sm font-bold">{fmt(c.total)}</p>
                          <p className="text-slate-600 text-xs">{pct.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-16 text-slate-600 text-sm">
                  Sin datos de egresos este mes
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
