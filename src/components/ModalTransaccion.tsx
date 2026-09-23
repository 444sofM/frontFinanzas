import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  tipo: 'ingreso' | 'egreso';
  transaccion?: any;
  onClose: () => void;
  onSaved: () => void;
}
interface Categoria { id: number; nombre: string; icono: string; color: string; }

export default function ModalTransaccion({ tipo: tipoProp, transaccion, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    tipo:        transaccion?.tipo || tipoProp,
    monto:       transaccion?.monto?.toString() || '',
    descripcion: transaccion?.descripcion || '',
    categoria_id:transaccion?.categoria_id?.toString() || '',
    fecha:       transaccion?.fecha || format(new Date(), 'yyyy-MM-dd'),
    hora:        transaccion?.hora || format(new Date(), 'HH:mm'),
    notas:       transaccion?.notas || '',
  });
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ep = form.tipo === 'ingreso' ? '/categorias/ingresos' : '/categorias/egresos';
    api.get(ep).then(res => setCategorias(res.data)).catch(console.error);
  }, [form.tipo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.monto || !form.fecha) return toast.error('Monto y fecha son requeridos');
    if (parseFloat(form.monto) <= 0) return toast.error('El monto debe ser mayor a 0');
    setLoading(true);
    try {
      const data = { ...form, monto: parseFloat(form.monto), categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null };
      if (transaccion?.id) {
        await api.put(`/transacciones/${transaccion.id}`, data);
        toast.success('Transacción actualizada');
      } else {
        await api.post('/transacciones', data);
        toast.success(`${form.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado ✓`);
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  const esIngreso = form.tipo === 'ingreso';

  return (
    <div className="modal-overlay">
      <div className="bg-[#0f1623] rounded-2xl w-full max-w-md border border-white/[0.08] shadow-2xl animate-fade-up overflow-hidden">

        {/* Color strip top */}
        <div className={`h-1 w-full ${esIngreso ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              esIngreso ? 'bg-emerald-500/15' : 'bg-red-500/15'
            }`}>
              {esIngreso
                ? <TrendingUp size={17} className="text-emerald-400" />
                : <TrendingDown size={17} className="text-red-400" />
              }
            </div>
            <h2 className="text-base font-bold text-white">
              {transaccion ? 'Editar' : 'Nuevo'} {esIngreso ? 'Ingreso' : 'Egreso'}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Toggle tipo */}
          {!transaccion && (
            <div className="flex gap-2 p-1 bg-white/[0.04] rounded-xl">
              {(['ingreso', 'egreso'] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(prev => ({ ...prev, tipo: t, categoria_id: '' }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                    form.tipo === t
                      ? t === 'ingreso'
                        ? 'bg-emerald-600/80 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-red-600/80 text-white shadow-lg shadow-red-500/20'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}>
                  {t === 'ingreso' ? <><TrendingUp size={14} /> Ingreso</> : <><TrendingDown size={14} /> Egreso</>}
                </button>
              ))}
            </div>
          )}

          {/* Monto — grande */}
          <div>
            <label className="label">Monto *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">$</span>
              <input name="monto" type="number" step="0.01" min="0"
                className="input pl-8 text-2xl font-bold placeholder-slate-700 pr-4"
                placeholder="0.00" value={form.monto} onChange={handleChange} autoFocus />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="label">Descripción</label>
            <input name="descripcion" type="text" className="input"
              placeholder="¿En qué fue?" value={form.descripcion} onChange={handleChange} />
          </div>

          {/* Categoría */}
          <div>
            <label className="label">Categoría</label>
            <select name="categoria_id" className="input" value={form.categoria_id} onChange={handleChange}>
              <option value="">Sin categoría</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Fecha + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha *</label>
              <input name="fecha" type="date" className="input" value={form.fecha} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Hora</label>
              <input name="hora" type="time" className="input" value={form.hora} onChange={handleChange} />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="label">Notas <span className="text-slate-600 text-xs">(opcional)</span></label>
            <textarea name="notas" className="input resize-none" rows={2}
              placeholder="Notas adicionales..." value={form.notas} onChange={handleChange} />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={loading}
              className={`flex-1 font-bold py-2.5 px-5 rounded-xl transition-all disabled:opacity-50 shadow-lg active:scale-[0.98] ${
                esIngreso
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/25'
              }`}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </span>
                : 'Guardar'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
