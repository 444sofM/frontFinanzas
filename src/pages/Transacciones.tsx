import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Search, SlidersHorizontal, Pencil, Trash2, Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ModalTransaccion from '../components/ModalTransaccion';

interface Transaccion {
  id: number; tipo: 'ingreso' | 'egreso'; monto: number;
  descripcion: string; categoria_nombre: string; categoria_icono: string;
  categoria_color: string; fecha: string; hora: string; notas: string; categoria_id: number;
}

const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const ANIOS  = [2023, 2024, 2025, 2026].reverse();

export default function Transacciones() {
  const { user } = useAuth();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filtroTipo, setFiltroTipo]       = useState('');
  const [filtroMes, setFiltroMes]         = useState((new Date().getMonth() + 1).toString());
  const [filtroAnio, setFiltroAnio]       = useState(new Date().getFullYear().toString());
  const [busqueda, setBusqueda]           = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [editando, setEditando]           = useState<Transaccion | null>(null);
  const [tipoModal, setTipoModal]         = useState<'ingreso' | 'egreso'>('egreso');
  const [exportando, setExportando]       = useState(false);
  const [showFiltros, setShowFiltros]     = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '100' });
      if (filtroTipo)        p.append('tipo',   filtroTipo);
      if (filtroMes)         p.append('mes',    filtroMes);
      if (filtroAnio)        p.append('anio',   filtroAnio);
      if (busquedaDebounced) p.append('search', busquedaDebounced);
      const res = await api.get(`/transacciones?${p}`);
      setTransacciones(res.data);
    } catch { console.error('Error al cargar'); }
    finally { setLoading(false); }
  }, [filtroTipo, filtroMes, filtroAnio, busquedaDebounced]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda), 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    try { await api.delete(`/transacciones/${id}`); toast.success('Eliminada'); cargar(); }
    catch { toast.error('Error al eliminar'); }
  };

  const exportarCSV = async () => {
    setExportando(true);
    try {
      const p = new URLSearchParams();
      if (filtroTipo)  p.append('tipo',  filtroTipo);
      if (filtroMes)   p.append('mes',   filtroMes);
      if (filtroAnio)  p.append('anio',  filtroAnio);
      const res = await api.get(`/transacciones/exportar?${p}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a'); a.href = url;
      a.download = `finanzas_${filtroAnio}_${(filtroMes || '00').padStart(2,'0')}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('CSV descargado');
    } catch { toast.error('Error al exportar'); }
    finally { setExportando(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: user?.moneda || 'USD', minimumFractionDigits: 2,
  }).format(n);

  const totales = transacciones.reduce((a, t) => {
    if (t.tipo === 'ingreso') a.ingresos += t.monto;
    else a.egresos += t.monto;
    return a;
  }, { ingresos: 0, egresos: 0 });

  return (
    <div className="space-y-5 max-w-5xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Transacciones</h1>
          <p className="text-slate-500 text-sm mt-1">{transacciones.length} registros encontrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportarCSV} disabled={exportando} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> {exportando ? 'Exportando...' : 'CSV'}
          </button>
          <button onClick={() => { setTipoModal('ingreso'); setEditando(null); setShowModal(true); }}
            className="btn-secondary flex items-center gap-2 text-sm">
            <Plus size={15} className="text-emerald-400" /> Ingreso
          </button>
          <button onClick={() => { setTipoModal('egreso'); setEditando(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Egreso
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ingresos',  valor: totales.ingresos, color: 'text-emerald-400', icon: TrendingUp,  bg: 'bg-emerald-500/10' },
          { label: 'Egresos',   valor: totales.egresos,  color: 'text-red-400',     icon: TrendingDown,bg: 'bg-red-500/10' },
          { label: 'Balance',   valor: totales.ingresos - totales.egresos,
            color: totales.ingresos - totales.egresos >= 0 ? 'text-violet-400' : 'text-red-400',
            icon: Wallet, bg: 'bg-violet-500/10' },
        ].map(k => (
          <div key={k.label} className="stat-card text-center py-4">
            <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <k.icon size={15} className={k.color} />
            </div>
            <p className={`font-extrabold text-sm sm:text-base ${k.color}`}>{fmt(k.valor)}</p>
            <p className="text-slate-600 text-xs mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-44">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" className="input pl-10 py-2.5 text-sm" placeholder="Buscar transacciones..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          {/* Toggle filtros */}
          <button onClick={() => setShowFiltros(v => !v)}
            className={`btn-secondary flex items-center gap-2 text-sm py-2.5 ${showFiltros ? 'border-violet-500/40 text-violet-400' : ''}`}>
            <SlidersHorizontal size={15} /> Filtros
            {(filtroTipo || filtroMes) && (
              <span className="w-2 h-2 rounded-full bg-violet-500 ml-0.5" />
            )}
          </button>
        </div>

        {/* Filtros expandibles */}
        {showFiltros && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/[0.05]">
            <select className="input py-2 text-sm flex-1 min-w-32" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              <option value="ingreso">💰 Ingresos</option>
              <option value="egreso">💸 Egresos</option>
            </select>
            <select className="input py-2 text-sm flex-1 min-w-32" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
              <option value="">Todos los meses</option>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="input py-2 text-sm flex-1 min-w-24" value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
              {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            {(filtroTipo || filtroMes !== (new Date().getMonth() + 1).toString()) && (
              <button onClick={() => { setFiltroTipo(''); setFiltroMes((new Date().getMonth()+1).toString()); }}
                className="text-violet-400 hover:text-violet-300 text-sm px-2 transition-colors">
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-white/[0.04]">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] animate-shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 bg-white/[0.04] rounded animate-shimmer" />
                  <div className="h-2.5 w-24 bg-white/[0.03] rounded animate-shimmer" />
                </div>
                <div className="h-4 w-20 bg-white/[0.04] rounded animate-shimmer" />
              </div>
            ))}
          </div>
        ) : transacciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-3">
            <Search size={36} className="opacity-30" />
            <p className="text-sm">No hay transacciones con los filtros aplicados</p>
          </div>
        ) : (
          <>
            {transacciones.map(t => (
              <div key={t.id} className="table-row group">
                {/* Icono */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${t.categoria_color || '#6b7280'}18` }}>
                  {t.categoria_icono || (t.tipo === 'ingreso' ? '💰' : '💸')}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {t.descripcion || t.categoria_nombre || 'Sin descripción'}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    {format(new Date(t.fecha + 'T00:00:00'), 'dd MMM yyyy', { locale: es })}
                    {t.categoria_nombre && <> · {t.categoria_nombre}</>}
                    {t.hora && t.hora !== '00:00' && <> · {t.hora}</>}
                  </p>
                </div>
                {/* Tipo badge */}
                <span className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  t.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {t.tipo === 'ingreso' ? '↑' : '↓'}
                </span>
                {/* Monto */}
                <div className="text-right flex-shrink-0">
                  <p className={`font-extrabold text-sm ${t.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.tipo === 'ingreso' ? '+' : '-'}{fmt(t.monto)}
                  </p>
                </div>
                {/* Acciones */}
                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditando(t); setShowModal(true); }}
                    className="p-1.5 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => eliminar(t.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {showModal && (
        <ModalTransaccion
          tipo={editando?.tipo || tipoModal}
          transaccion={editando}
          onClose={() => { setShowModal(false); setEditando(null); }}
          onSaved={() => { setShowModal(false); setEditando(null); cargar(); }}
        />
      )}
    </div>
  );
}
