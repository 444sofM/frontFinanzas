import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Wallet, Trash2, AlertTriangle, Pencil, X } from 'lucide-react';

interface Presupuesto {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  categoria_icono: string;
  categoria_color: string;
  monto_limite: number;
  gastado: number;
  mes: number;
  anio: number;
}

interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  color: string;
}

const MESES_LABEL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Presupuestos() {
  const { user } = useAuth();
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Presupuesto | null>(null);
  const [form, setForm] = useState({ categoria_id: '', monto_limite: '' });

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: user?.moneda || 'USD', minimumFractionDigits: 2
  }).format(n);

  const cargar = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        api.get(`/presupuestos?mes=${mes}&anio=${anio}`),
        api.get('/categorias/egresos'),
      ]);
      setPresupuestos(p.data);
      setCategorias(c.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [mes, anio]);

  const abrirCrear = () => {
    setEditando(null);
    setForm({ categoria_id: '', monto_limite: '' });
    setShowModal(true);
  };

  const abrirEditar = (p: Presupuesto) => {
    setEditando(p);
    setForm({ categoria_id: p.categoria_id.toString(), monto_limite: p.monto_limite.toString() });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(null);
    setForm({ categoria_id: '', monto_limite: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.monto_limite) return toast.error('Ingresa un monto límite');
    if (!editando && !form.categoria_id) return toast.error('Selecciona una categoría');
    try {
      if (editando) {
        await api.put(`/presupuestos/${editando.id}`, { monto_limite: parseFloat(form.monto_limite) });
        toast.success('Presupuesto actualizado');
      } else {
        await api.post('/presupuestos', {
          categoria_id: parseInt(form.categoria_id),
          monto_limite: parseFloat(form.monto_limite),
          mes, anio,
        });
        toast.success('Presupuesto guardado');
      }
      cerrarModal();
      cargar();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    try { await api.delete(`/presupuestos/${id}`); toast.success('Eliminado'); cargar(); }
    catch { toast.error('Error al eliminar'); }
  };

  const anioActual = new Date().getFullYear();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Presupuestos</h1>
        <div className="flex gap-2">
          <select className="input py-2 text-sm w-auto" value={mes} onChange={e => setMes(parseInt(e.target.value))}>
            {MESES_LABEL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input py-2 text-sm w-auto" value={anio} onChange={e => setAnio(parseInt(e.target.value))}>
            {[anioActual - 1, anioActual, anioActual + 1].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={abrirCrear} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      <p className="text-slate-400 text-sm">
        Establece límites de gasto por categoría para <strong className="text-white">{MESES_LABEL[mes - 1]} {anio}</strong>
      </p>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : presupuestos.length === 0 ? (
        <div className="card text-center py-16">
          <Wallet size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">No hay presupuestos para este mes</p>
          <button onClick={abrirCrear} className="btn-primary mt-4">Crear primer presupuesto</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presupuestos.map(p => {
            const porcentaje = p.monto_limite > 0 ? Math.min((p.gastado / p.monto_limite) * 100, 100) : 0;
            const enRiesgo = porcentaje >= 80 && porcentaje < 100;
            const excedido = porcentaje >= 100;

            return (
              <div key={p.id} className={`card ${excedido ? 'border-red-500/40' : enRiesgo ? 'border-amber-500/30' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.categoria_icono}</span>
                    <span className="text-white font-medium">{p.categoria_nombre}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(enRiesgo || excedido) && (
                      <AlertTriangle size={16} className={excedido ? 'text-red-400' : 'text-amber-400'} />
                    )}
                    <button onClick={() => abrirEditar(p)}
                      className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-all">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => eliminar(p.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className={excedido ? 'text-red-400' : 'text-slate-300'}>{fmt(p.gastado)}</span>
                    <span className="text-slate-400">{fmt(p.monto_limite)}</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${porcentaje}%`,
                        backgroundColor: excedido ? '#ef4444' : enRiesgo ? '#f59e0b' : p.categoria_color || '#6366f1'
                      }} />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className={`text-xs ${excedido ? 'text-red-400' : enRiesgo ? 'text-amber-400' : 'text-slate-500'}`}>
                    {excedido
                      ? `¡Excediste el límite por ${fmt(p.gastado - p.monto_limite)}!`
                      : enRiesgo
                        ? `⚠️ Cerca del límite (${porcentaje.toFixed(0)}%)`
                        : `Disponible: ${fmt(p.monto_limite - p.gastado)}`
                    }
                  </p>
                  <p className="text-xs font-medium" style={{ color: excedido ? '#ef4444' : p.categoria_color }}>
                    {porcentaje.toFixed(0)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                {editando ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
              </h2>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <p className="text-slate-400 text-sm">Para <strong className="text-white">{MESES_LABEL[mes - 1]} {anio}</strong></p>

              {/* Solo mostrar selector de categoría al crear */}
              {!editando ? (
                <div>
                  <label className="label">Categoría</label>
                  <select className="input" value={form.categoria_id}
                    onChange={e => setForm(p => ({ ...p, categoria_id: e.target.value }))}>
                    <option value="">Selecciona categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-slate-700/50 rounded-xl px-3 py-2">
                  <span className="text-xl">{editando.categoria_icono}</span>
                  <span className="text-white font-medium">{editando.categoria_nombre}</span>
                </div>
              )}

              <div>
                <label className="label">Límite de gasto</label>
                <input type="number" step="0.01" min="0.01" className="input" placeholder="500.00"
                  value={form.monto_limite}
                  onChange={e => setForm(p => ({ ...p, monto_limite: e.target.value }))}
                  autoFocus={!!editando} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={cerrarModal} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">
                  {editando ? 'Guardar Cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
