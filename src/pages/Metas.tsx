import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Target, Trash2, Pencil, CheckCircle2, PlusCircle, X, Check, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Meta {
  id: number; nombre: string; monto_objetivo: number; monto_actual: number;
  fecha_limite: string; descripcion: string; completada: number; color: string; icono: string;
}

const ICONOS = ['🎯','🏠','🚗','✈️','💻','📱','💎','🎓','💊','🌟','🏦','🎁','🏖️','🎸','🍕','🚀','❤️','🌿'];
const COLORES = ['#8b5cf6','#10b981','#f59e0b','#ef4444','#6366f1','#ec4899','#14b8a6','#3b82f6','#f97316','#84cc16'];

const FORM_VACIO = { nombre:'', monto_objetivo:'', fecha_limite:'', descripcion:'', color:'#8b5cf6', icono:'🎯' };

export default function Metas() {
  const { user } = useAuth();
  const [metas, setMetas]       = useState<Meta[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Meta | null>(null);
  const [abonoId, setAbonoId]   = useState<number | null>(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [form, setForm]         = useState(FORM_VACIO);

  const cargar = async () => {
    try { const res = await api.get('/metas'); setMetas(res.data); }
    catch { toast.error('Error al cargar metas'); }
    finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: user?.moneda || 'USD', minimumFractionDigits: 2,
  }).format(n);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.monto_objetivo) return toast.error('Nombre y monto requeridos');
    try {
      if (editando) {
        await api.put(`/metas/${editando.id}`, { ...form, monto_objetivo: parseFloat(form.monto_objetivo) });
        toast.success('Meta actualizada');
      } else {
        await api.post('/metas', { ...form, monto_objetivo: parseFloat(form.monto_objetivo) });
        toast.success('¡Meta creada! 🎯');
      }
      setShowModal(false); setEditando(null); setForm(FORM_VACIO); cargar();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta meta?')) return;
    try { await api.delete(`/metas/${id}`); toast.success('Meta eliminada'); cargar(); }
    catch { toast.error('Error al eliminar'); }
  };

  const abonar = async (id: number) => {
    if (!montoAbono || parseFloat(montoAbono) <= 0) return toast.error('Ingresa un monto válido');
    try {
      await api.put(`/metas/${id}/abonar`, { monto: parseFloat(montoAbono) });
      toast.success('¡Abono registrado! 💰');
      setAbonoId(null); setMontoAbono(''); cargar();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const abrirEditar = (m: Meta) => {
    setEditando(m);
    setForm({ nombre: m.nombre, monto_objetivo: m.monto_objetivo.toString(),
      fecha_limite: m.fecha_limite || '', descripcion: m.descripcion || '',
      color: m.color, icono: m.icono });
    setShowModal(true);
  };

  const metasActivas     = metas.filter(m => !m.completada);
  const metasCompletadas = metas.filter(m => m.completada);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Metas de Ahorro</h1>
          <p className="text-slate-500 text-sm mt-1">{metas.length} meta{metas.length !== 1 ? 's' : ''} · {metasCompletadas.length} completada{metasCompletadas.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditando(null); setForm(FORM_VACIO); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Nueva Meta
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : metas.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target size={32} className="text-violet-400/60" />
          </div>
          <p className="text-white font-semibold text-lg">Sin metas todavía</p>
          <p className="text-slate-500 text-sm mt-1 mb-5">Define hacia dónde va tu dinero</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Crear primera meta
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Activas */}
          {metasActivas.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">En progreso</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metasActivas.map(meta => {
                  const pct = Math.min((meta.monto_actual / meta.monto_objetivo) * 100, 100);
                  return (
                    <div key={meta.id} className="card hover:border-white/[0.1] transition-all duration-300 group">
                      {/* Top */}
                      <div className="flex items-start gap-3 mb-5">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}30` }}>
                          {meta.icono}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold truncate">{meta.nombre}</h3>
                          {meta.descripcion && (
                            <p className="text-slate-500 text-xs mt-0.5 truncate">{meta.descripcion}</p>
                          )}
                          {meta.fecha_limite && (
                            <span className="badge-violet text-[10px] mt-1">
                              📅 {format(new Date(meta.fecha_limite + 'T00:00:00'), 'dd MMM yyyy', { locale: es })}
                            </span>
                          )}
                        </div>
                        {/* Actions — visible on hover */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => abrirEditar(meta)}
                            className="p-1.5 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => eliminar(meta.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Progreso */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="text-white font-bold">{fmt(meta.monto_actual)}</span>
                            <span className="text-slate-600 text-xs mx-1.5">/</span>
                            <span className="text-slate-500 text-sm">{fmt(meta.monto_objetivo)}</span>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${meta.color}20`, color: meta.color }}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${meta.color}bb, ${meta.color})` }} />
                        </div>
                        <p className="text-slate-600 text-xs mt-1.5">
                          Faltan: <span className="text-slate-400">{fmt(Math.max(0, meta.monto_objetivo - meta.monto_actual))}</span>
                        </p>
                      </div>

                      {/* Abono */}
                      {abonoId === meta.id ? (
                        <div className="flex gap-2">
                          <input type="number" step="0.01" min="0.01" className="input text-sm py-2 flex-1"
                            placeholder="Monto a abonar" value={montoAbono}
                            onChange={e => setMontoAbono(e.target.value)} autoFocus />
                          <button onClick={() => abonar(meta.id)} className="btn-primary text-sm py-2 px-3 flex items-center gap-1">
                            <Zap size={13} /> Abonar
                          </button>
                          <button onClick={() => { setAbonoId(null); setMontoAbono(''); }}
                            className="btn-secondary text-sm py-2 px-3">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setAbonoId(meta.id)}
                          className="w-full text-sm py-2.5 rounded-xl border border-dashed border-white/[0.1]
                                     text-slate-500 hover:border-violet-500/50 hover:text-violet-400
                                     transition-all flex items-center justify-center gap-2">
                          <PlusCircle size={15} /> Abonar dinero
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completadas */}
          {metasCompletadas.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Completadas 🎉</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metasCompletadas.map(meta => (
                  <div key={meta.id}
                    className="card border-emerald-500/20 bg-emerald-500/[0.03] group">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${meta.color}15` }}>
                        {meta.icono}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">{meta.nombre}</h3>
                        <p className="text-emerald-400 text-xs mt-0.5 flex items-center gap-1">
                          <CheckCircle2 size={11} /> Meta alcanzada · {fmt(meta.monto_objetivo)}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => eliminar(meta.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="bg-[#0f1623] rounded-2xl w-full max-w-md border border-white/[0.08] shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-white">{editando ? 'Editar' : 'Nueva'} Meta</h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Nombre de la meta</label>
                <input className="input" placeholder="Ej: Viaje a París"
                  value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className="label">Monto objetivo</label>
                <input type="number" step="0.01" min="0.01" className="input" placeholder="1000.00"
                  value={form.monto_objetivo} onChange={e => setForm(p => ({ ...p, monto_objetivo: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Fecha límite</label>
                  <input type="date" className="input" value={form.fecha_limite}
                    onChange={e => setForm(p => ({ ...p, fecha_limite: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Descripción</label>
                  <input className="input" placeholder="Opcional"
                    value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />
                </div>
              </div>

              {/* Iconos */}
              <div>
                <label className="label">Ícono</label>
                <div className="grid grid-cols-9 gap-1.5">
                  {ICONOS.map(i => (
                    <button key={i} type="button" onClick={() => setForm(p => ({ ...p, icono: i }))}
                      className={`h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                        form.icono === i
                          ? 'bg-violet-600/80 ring-1 ring-violet-400/50 scale-105'
                          : 'bg-white/[0.04] hover:bg-white/[0.08]'
                      }`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colores */}
              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORES.map(c => (
                    <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                      className="w-8 h-8 rounded-full transition-all flex items-center justify-center"
                      style={{
                        backgroundColor: c,
                        outline: form.color === c ? `2px solid ${c}` : 'none',
                        outlineOffset: '3px',
                        transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                      }}>
                      {form.color === c && <Check size={12} className="text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">{editando ? 'Guardar' : 'Crear Meta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
