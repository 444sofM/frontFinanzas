import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  TrendingUp, TrendingDown, Wallet, Bell, Plus, ArrowRight, Sparkles,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';
import ModalTransaccion from '../components/ModalTransaccion';

interface Resumen {
  ingresos: number; egresos: number; balance: number;
  cantidad_ingresos: number; cantidad_egresos: number;
  por_categoria_egreso: Array<{ nombre: string; icono: string; color: string; total: number }>;
  tendencia_diaria: Array<{ fecha: string; tipo: string; total: number }>;
}
interface Transaccion {
  id: number; tipo: string; monto: number; descripcion: string;
  categoria_nombre: string; categoria_icono: string; fecha: string;
}

const Skeleton = ({ className = '' }) => (
  <div className={`rounded-xl animate-shimmer bg-white/[0.04] ${className}`} />
);

// Tooltip personalizado para recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1623] border border-white/[0.1] rounded-2xl p-3 shadow-2xl">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-semibold">{p.value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [ultimas, setUltimas] = useState<Transaccion[]>([]);
  const [notificacion, setNotificacion] = useState<{ mensaje: string; tiene_registros_hoy: boolean } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [tipoModal, setTipoModal] = useState<'ingreso' | 'egreso'>('egreso');
  const [loading, setLoading] = useState(true);

  const mesActual  = new Date().getMonth() + 1;
  const anioActual = new Date().getFullYear();

  const cargarDatos = async () => {
    try {
      const [r, u, n] = await Promise.all([
        api.get(`/transacciones/resumen?mes=${mesActual}&anio=${anioActual}`),
        api.get('/transacciones?limit=5'),
        api.get('/notificaciones/hoy'),
      ]);
      setResumen(r.data);
      setUltimas(u.data);
      setNotificacion(n.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const chartData = React.useMemo(() => {
    if (!resumen) return [];
    const mapa: Record<string, { fecha: string; Ingresos: number; Egresos: number }> = {};
    resumen.tendencia_diaria.forEach(d => {
      if (!mapa[d.fecha]) mapa[d.fecha] = { fecha: d.fecha, Ingresos: 0, Egresos: 0 };
      if (d.tipo === 'ingreso') mapa[d.fecha].Ingresos = d.total;
      else mapa[d.fecha].Egresos = d.total;
    });
    return Object.values(mapa).map(d => ({
      ...d,
      fecha: format(new Date(d.fecha + 'T00:00:00'), 'd MMM', { locale: es }),
    }));
  }, [resumen]);

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: user?.moneda || 'USD', minimumFractionDigits: 2,
  }).format(n);

  const mesNombre = format(new Date(), "MMMM 'de' yyyy", { locale: es });
  const hora      = new Date().getHours();
  const saludo    = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  const ahorro = resumen?.ingresos && resumen.ingresos > 0
    ? (((resumen.ingresos - resumen.egresos) / resumen.ingresos) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-up">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-violet-400" />
            <span className="text-violet-400 text-sm font-medium capitalize">{mesNombre}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {saludo}, {user?.nombre?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Aquí está el resumen de tus finanzas</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => { setTipoModal('ingreso'); setShowModal(true); }}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Plus size={15} className="text-emerald-400" /> Ingreso
          </button>
          <button
            onClick={() => { setTipoModal('egreso'); setShowModal(true); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={15} /> Egreso
          </button>
        </div>
      </div>

      {/* ── Notificación ── */}
      {!loading && notificacion && !notificacion.tiene_registros_hoy && (
        <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4">
          <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bell size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-amber-300 font-semibold text-sm">Recordatorio del día</p>
            <p className="text-amber-400/70 text-sm mt-0.5">{notificacion.mensaje}</p>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Balance */}
          <div className="stat-card glow-violet lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">Balance del mes</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                (resumen?.balance || 0) >= 0 ? 'bg-violet-500/20' : 'bg-red-500/20'
              }`}>
                <Wallet size={17} className={(resumen?.balance || 0) >= 0 ? 'text-violet-400' : 'text-red-400'} />
              </div>
            </div>
            <p className={`text-2xl font-extrabold ${(resumen?.balance || 0) >= 0 ? 'text-violet-300' : 'text-red-400'}`}>
              {fmt(resumen?.balance || 0)}
            </p>
            <p className="text-slate-600 text-xs mt-1.5">Neto del mes</p>
          </div>

          {/* Ingresos */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">Ingresos</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <TrendingUp size={17} className="text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-emerald-400">{fmt(resumen?.ingresos || 0)}</p>
            <p className="text-slate-600 text-xs mt-1.5">{resumen?.cantidad_ingresos || 0} movimientos</p>
          </div>

          {/* Egresos */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">Egresos</span>
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
                <TrendingDown size={17} className="text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-red-400">{fmt(resumen?.egresos || 0)}</p>
            <p className="text-slate-600 text-xs mt-1.5">{resumen?.cantidad_egresos || 0} movimientos</p>
          </div>

          {/* Ahorro */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">Tasa de ahorro</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                <Sparkles size={17} className="text-indigo-400" />
              </div>
            </div>
            <p className={`text-2xl font-extrabold ${parseFloat(ahorro) >= 0 ? 'text-indigo-300' : 'text-red-400'}`}>
              {ahorro}%
            </p>
            <div className="mt-3 progress-track">
              <div className="progress-fill bg-gradient-to-r from-indigo-600 to-violet-600"
                style={{ width: `${Math.max(0, Math.min(100, parseFloat(ahorro)))}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Gráfico + Top gastos ── */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold">Tendencia del mes</h3>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Ingresos</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Egresos</span>
              </div>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradEgresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="fecha" stroke="transparent" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} />
                  <YAxis stroke="transparent" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Ingresos" stroke="#10b981" strokeWidth={2.5} fill="url(#gradIngresos)" dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="Egresos"  stroke="#ef4444" strokeWidth={2.5} fill="url(#gradEgresos)"  dot={false} activeDot={{ r: 5, fill: '#ef4444' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center gap-3 text-slate-600">
                <TrendingUp size={36} className="opacity-30" />
                <p className="text-sm">Sin datos este mes. ¡Agrega tu primera transacción!</p>
              </div>
            )}
          </div>

          {/* Top gastos */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold">Top Gastos</h3>
              <Link to="/reportes" className="text-violet-400 hover:text-violet-300 text-xs flex items-center gap-1 transition-colors">
                Ver más <ArrowRight size={12} />
              </Link>
            </div>
            {(resumen?.por_categoria_egreso?.length || 0) > 0 ? (
              <div className="space-y-4">
                {resumen!.por_categoria_egreso.slice(0, 5).map((cat, i) => {
                  const pct = resumen!.egresos > 0 ? (cat.total / resumen!.egresos) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{cat.icono}</span>
                          <span className="text-slate-300 text-sm truncate">{cat.nombre}</span>
                        </div>
                        <span className="text-slate-400 text-xs flex-shrink-0 ml-2">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-2">
                <TrendingDown size={28} className="opacity-30" />
                <p className="text-sm">Sin egresos este mes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Últimas transacciones ── */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
          <h3 className="text-white font-bold">Últimas Transacciones</h3>
          <Link to="/transacciones"
            className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1 transition-colors">
            Ver todas <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : ultimas.length > 0 ? (
          <div>
            {ultimas.map(t => (
              <div key={t.id} className="table-row">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-white/[0.04]">
                  {t.categoria_icono || (t.tipo === 'ingreso' ? '💰' : '💸')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {t.descripcion || t.categoria_nombre || 'Sin descripción'}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    {format(new Date(t.fecha + 'T00:00:00'), 'dd MMM yyyy', { locale: es })}
                    {t.categoria_nombre && <> · {t.categoria_nombre}</>}
                  </p>
                </div>
                <span className={`font-bold text-sm flex-shrink-0 ${t.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.tipo === 'ingreso' ? '+' : '-'}{fmt(t.monto)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-slate-600 gap-3">
            <Wallet size={36} className="opacity-30" />
            <p className="text-sm">No hay transacciones aún</p>
            <button onClick={() => { setTipoModal('egreso'); setShowModal(true); }}
              className="btn-primary text-sm mt-1">
              Registrar primera transacción
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <ModalTransaccion
          tipo={tipoModal}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); cargarDatos(); }}
        />
      )}
    </div>
  );
}
