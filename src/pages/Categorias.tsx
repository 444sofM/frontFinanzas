import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Tag, X, Check } from 'lucide-react';

interface Categoria { id: number; nombre: string; icono: string; color: string; }

const ICONOS = [
  '💰','💼','💻','📈','🛍️','🎁','🏆','💡','📚','🎬','🍽️','🚗',
  '🏠','💊','👕','✈️','🎮','🎵','💪','🐾','🌿','🔧','📱','☕',
  '🎯','🌍','💳','🚀','🎸','🏖️',
];
const COLORES = [
  '#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1',
  '#14b8a6','#f97316','#3b82f6','#84cc16','#06b6d4','#6b7280',
];
const FORM_VACIO = { nombre: '', icono: '💰', color: '#8b5cf6' };

export default function Categorias() {
  const [ingresos, setIngresos] = useState<Categoria[]>([]);
  const [egresos, setEgresos]   = useState<Categoria[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<'ingresos' | 'egresos'>('egresos');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [form, setForm]         = useState(FORM_VACIO);
  const [saving, setSaving]     = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const [ing, egr] = await Promise.all([api.get('/categorias/ingresos'), api.get('/categorias/egresos')]);
      setIngresos(ing.data); setEgresos(egr.data);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const abrirCrear  = () => { setEditando(null); setForm(FORM_VACIO); setShowModal(true); };
  const abrirEditar = (c: Categoria) => { setEditando(c); setForm({ nombre: c.nombre, icono: c.icono, color: c.color }); setShowModal(true); };
  const cerrar      = () => { setShowModal(false); setEditando(null); setForm(FORM_VACIO); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error('El nombre es requerido');
    setSaving(true);
    const ep = `/categorias/${tab}`;
    try {
      editando ? await api.put(`${ep}/${editando.id}`, form) : await api.post(ep, form);
      toast.success(editando ? 'Categoría actualizada' : 'Categoría creada');
      cerrar(); cargar();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try { await api.delete(`/categorias/${tab}/${id}`); toast.success('Eliminada'); cargar(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const lista = tab === 'ingresos' ? ingresos : egresos;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Categorías</h1>
          <p className="text-slate-500 text-sm mt-1">
            {ingresos.length} de ingresos · {egresos.length} de egresos
          </p>
        </div>
        <button onClick={abrirCrear} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nueva Categoría
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl w-fit border border-white/[0.06]">
        {(['egresos', 'ingresos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-500 hover:text-white'
            }`}>
            {t === 'egresos' ? '💸 Egresos' : '💰 Ingresos'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.04] animate-shimmer" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tag size={28} className="text-slate-600" />
          </div>
          <p className="text-white font-semibold">Sin categorías</p>
          <p className="text-slate-500 text-sm mt-1 mb-5">Crea la primera categoría de {tab}</p>
          <button onClick={abrirCrear} className="btn-primary">Crear categoría</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lista.map(cat => (
            <div key={cat.id} className="card flex items-center gap-4 py-4 hover:border-white/[0.1] transition-all group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${cat.color}20`, border: `1px solid ${cat.color}25` }}>
                {cat.icono}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{cat.nombre}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-600 text-xs font-mono">{cat.color}</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => abrirEditar(cat)}
                  className="p-1.5 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all">
                  <Pencil size={14} />
                </button>
                <button onClick={() => eliminar(cat.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="bg-[#0f1623] rounded-2xl w-full max-w-md border border-white/[0.08] shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-base font-bold text-white">
                {editando ? 'Editar' : 'Nueva'} Categoría de {tab === 'ingresos' ? 'Ingreso' : 'Egreso'}
              </h2>
              <button onClick={cerrar}
                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="label">Nombre</label>
                <input className="input" placeholder="Ej: Alimentación" maxLength={40}
                  value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} autoFocus />
              </div>

              <div>
                <label className="label">Ícono</label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mt-2">
                  {ICONOS.map(ico => (
                    <button key={ico} type="button"
                      onClick={() => setForm(p => ({ ...p, icono: ico }))}
                      className={`aspect-square rounded-xl text-xl flex items-center justify-center transition-all ${
                        form.icono === ico
                          ? 'bg-violet-600/80 ring-1 ring-violet-400/50 scale-110'
                          : 'bg-white/[0.04] hover:bg-white/[0.08]'
                      }`}>
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-2.5 mt-2">
                  {COLORES.map(col => (
                    <button key={col} type="button"
                      onClick={() => setForm(p => ({ ...p, color: col }))}
                      className="w-9 h-9 rounded-full transition-all flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: col,
                        outline: form.color === col ? `2px solid ${col}` : 'none',
                        outlineOffset: '3px',
                        transform: form.color === col ? 'scale(1.2)' : 'scale(1)',
                      }}>
                      {form.color === col && <Check size={13} className="text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${form.color}20` }}>
                  {form.icono}
                </div>
                <span className="text-white font-medium">{form.nombre || 'Vista previa'}</span>
                <div className="w-3 h-3 rounded-full ml-auto" style={{ backgroundColor: form.color }} />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={cerrar} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Guardando...' : editando ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
