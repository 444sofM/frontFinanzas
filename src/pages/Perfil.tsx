import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { User, Bell, Lock, Palette, Save, Trash2, Download, X, Eye, EyeOff, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MONEDAS = [
  { value: 'USD', flag: '🇺🇸', label: 'USD — Dólar Americano' },
  { value: 'EUR', flag: '🇪🇺', label: 'EUR — Euro' },
  { value: 'COP', flag: '🇨🇴', label: 'COP — Peso Colombiano' },
  { value: 'MXN', flag: '🇲🇽', label: 'MXN — Peso Mexicano' },
  { value: 'ARS', flag: '🇦🇷', label: 'ARS — Peso Argentino' },
  { value: 'CLP', flag: '🇨🇱', label: 'CLP — Peso Chileno' },
  { value: 'PEN', flag: '🇵🇪', label: 'PEN — Sol Peruano' },
  { value: 'VES', flag: '🇻🇪', label: 'VES — Bolívar' },
  { value: 'BRL', flag: '🇧🇷', label: 'BRL — Real Brasileño' },
];

const AVATARES = [
  { id: 'default', gradient: 'from-violet-600 to-indigo-600' },
  { id: 'blue',    gradient: 'from-blue-500 to-cyan-500' },
  { id: 'green',   gradient: 'from-emerald-500 to-teal-500' },
  { id: 'purple',  gradient: 'from-purple-600 to-fuchsia-600' },
  { id: 'orange',  gradient: 'from-orange-500 to-amber-500' },
  { id: 'pink',    gradient: 'from-pink-500 to-rose-500' },
];

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/[0.06]">
    <div className="w-8 h-8 bg-violet-500/15 rounded-lg flex items-center justify-center">
      <Icon size={15} className="text-violet-400" />
    </div>
    <h2 className="text-white font-bold">{title}</h2>
  </div>
);

export default function Perfil() {
  const { user, updateUser, logout } = useAuth();
  const [perfil, setPerfil] = useState({
    nombre: user?.nombre || '',
    moneda: user?.moneda || 'USD',
    notification_time: user?.notification_time || '20:00',
    notifications_enabled: user?.notifications_enabled ?? 1,
    avatar: user?.avatar || 'default',
  });
  const [passwords, setPasswords]   = useState({ actual: '', nueva: '', confirmar: '' });
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [loadingPass, setLoadingPass]     = useState(false);
  const [showPass, setShowPass]           = useState(false);
  const [showEliminar, setShowEliminar]   = useState(false);
  const [passEliminar, setPassEliminar]   = useState('');
  const [loadingEliminar, setLoadingEliminar] = useState(false);
  const [exportando, setExportando]       = useState(false);

  const initials  = user?.nombre?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const avatarGrad = AVATARES.find(a => a.id === perfil.avatar)?.gradient || AVATARES[0].gradient;

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil.nombre) return toast.error('El nombre es requerido');
    setLoadingPerfil(true);
    try {
      const res = await api.put('/auth/perfil', perfil);
      updateUser(res.data);
      toast.success('Perfil actualizado ✓');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally { setLoadingPerfil(false); }
  };

  const cambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.actual || !passwords.nueva) return toast.error('Completa todos los campos');
    if (passwords.nueva !== passwords.confirmar) return toast.error('Las contraseñas no coinciden');
    if (passwords.nueva.length < 6) return toast.error('Mínimo 6 caracteres');
    setLoadingPass(true);
    try {
      await api.put('/auth/cambiar-password', { passwordActual: passwords.actual, passwordNueva: passwords.nueva });
      toast.success('Contraseña actualizada ✓');
      setPasswords({ actual: '', nueva: '', confirmar: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setLoadingPass(false); }
  };

  const exportarDatos = async () => {
    setExportando(true);
    try {
      const res = await api.get('/transacciones/exportar', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a'); a.href = url;
      a.download = `finanzas_${new Date().getFullYear()}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Datos exportados');
    } catch { toast.error('Error al exportar'); }
    finally { setExportando(false); }
  };

  const eliminarCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passEliminar) return toast.error('Ingresa tu contraseña');
    setLoadingEliminar(true);
    try {
      await api.delete('/auth/cuenta', { data: { password: passEliminar } });
      toast.success('Cuenta eliminada');
      logout();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setLoadingEliminar(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto animate-fade-up">

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Mi Perfil</h1>
        <p className="text-slate-500 text-sm mt-1">Configura tu cuenta y preferencias</p>
      </div>

      {/* User card hero */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 bg-gradient-to-br ${avatarGrad} rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-xl`}>
            {initials}
          </div>
          <div>
            <p className="text-white font-bold text-lg">{user?.nombre}</p>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <p className="text-slate-600 text-xs mt-0.5">
              Miembro desde {user?.created_at
                ? format(new Date(user.created_at), "MMMM 'de' yyyy", { locale: es })
                : '—'}
            </p>
          </div>
          <div className="ml-auto">
            <span className="badge-violet">Activo</span>
          </div>
        </div>
      </div>

      {/* Información personal */}
      <div className="card">
        <SectionHeader icon={User} title="Información Personal" />
        <form onSubmit={guardarPerfil} className="space-y-4">
          <div>
            <label className="label">Nombre completo</label>
            <input className="input" value={perfil.nombre}
              onChange={e => setPerfil(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div>
            <label className="label">Moneda principal</label>
            <select className="input" value={perfil.moneda}
              onChange={e => setPerfil(p => ({ ...p, moneda: e.target.value }))}>
              {MONEDAS.map(m => <option key={m.value} value={m.value}>{m.flag} {m.label}</option>)}
            </select>
          </div>

          {/* Avatar */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette size={15} className="text-slate-400" />
              <label className="text-sm font-medium text-slate-300">Color de perfil</label>
            </div>
            <div className="flex gap-3">
              {AVATARES.map(av => (
                <button key={av.id} type="button"
                  onClick={() => setPerfil(p => ({ ...p, avatar: av.id }))}
                  className={`w-10 h-10 bg-gradient-to-br ${av.gradient} rounded-full transition-all flex-shrink-0 ${
                    perfil.avatar === av.id
                      ? 'ring-2 ring-white scale-110 shadow-lg'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Notificaciones */}
          <div className="pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={15} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Notificaciones</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
              <div>
                <p className="text-white text-sm font-medium">Recordatorio diario</p>
                <p className="text-slate-500 text-xs mt-0.5">Recibe alertas para registrar tus gastos</p>
              </div>
              <button type="button"
                onClick={() => setPerfil(p => ({ ...p, notifications_enabled: p.notifications_enabled ? 0 : 1 }))}
                className={`relative w-11 h-6 rounded-full transition-all ${
                  perfil.notifications_enabled ? 'bg-violet-600' : 'bg-white/[0.1]'
                }`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  perfil.notifications_enabled ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>
            {perfil.notifications_enabled === 1 && (
              <div className="mt-3">
                <label className="label">Hora del recordatorio</label>
                <input type="time" className="input" value={perfil.notification_time}
                  onChange={e => setPerfil(p => ({ ...p, notification_time: e.target.value }))} />
              </div>
            )}
          </div>

          <button type="submit" disabled={loadingPerfil} className="btn-primary w-full flex items-center justify-center gap-2">
            {loadingPerfil
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
              : <><Save size={15} /> Guardar Cambios</>
            }
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="card">
        <SectionHeader icon={Lock} title="Cambiar Contraseña" />
        <form onSubmit={cambiarPassword} className="space-y-4">
          {(['actual', 'nueva', 'confirmar'] as const).map((field, i) => (
            <div key={field}>
              <label className="label">
                {field === 'actual' ? 'Contraseña actual' : field === 'nueva' ? 'Nueva contraseña' : 'Confirmar nueva contraseña'}
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type={showPass ? 'text' : 'password'} className="input pl-10 pr-10"
                  value={passwords[field]}
                  onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))} />
                {i === 2 && (
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
              {field === 'confirmar' && passwords.confirmar && passwords.nueva !== passwords.confirmar && (
                <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
              )}
            </div>
          ))}
          <button type="submit" disabled={loadingPass} className="btn-primary w-full">
            {loadingPass ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>

      {/* Exportar datos */}
      <div className="card">
        <SectionHeader icon={Download} title="Mis Datos" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
          <div>
            <p className="text-white font-medium text-sm">Exportar transacciones</p>
            <p className="text-slate-500 text-xs mt-0.5">Descarga todas tus transacciones en formato CSV compatible con Excel</p>
          </div>
          <button onClick={exportarDatos} disabled={exportando}
            className="btn-secondary flex items-center gap-2 text-sm flex-shrink-0">
            <Download size={14} /> {exportando ? 'Exportando...' : 'Descargar CSV'}
          </button>
        </div>
      </div>

      {/* Zona peligrosa */}
      <div className="card border-red-500/20">
        <SectionHeader icon={Shield} title="Zona de Peligro" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-500/[0.04] rounded-xl p-4 border border-red-500/15">
          <div>
            <p className="text-white font-medium text-sm">Eliminar cuenta permanentemente</p>
            <p className="text-slate-500 text-xs mt-0.5">Todos tus datos serán borrados. Esta acción es irreversible.</p>
          </div>
          <button onClick={() => setShowEliminar(true)}
            className="btn-danger flex items-center gap-2 text-sm flex-shrink-0">
            <Trash2 size={14} /> Eliminar cuenta
          </button>
        </div>
      </div>

      {/* Modal eliminar */}
      {showEliminar && (
        <div className="modal-overlay">
          <div className="bg-[#0f1623] rounded-2xl w-full max-w-sm border border-red-500/30 shadow-2xl animate-fade-up overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-red-600 to-rose-600" />
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-base font-bold text-white">¿Eliminar cuenta?</h2>
              <button onClick={() => { setShowEliminar(false); setPassEliminar(''); }}
                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={eliminarCuenta} className="p-5 space-y-4">
              <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3.5">
                <p className="text-red-400 text-sm font-semibold mb-1">⚠️ Esta acción es permanente</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Se eliminarán tu cuenta, transacciones, categorías, metas y presupuestos.
                </p>
              </div>
              <div>
                <label className="label">Confirma con tu contraseña</label>
                <input type="password" className="input" placeholder="Tu contraseña actual"
                  value={passEliminar} onChange={e => setPassEliminar(e.target.value)} autoFocus />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowEliminar(false); setPassEliminar(''); }}
                  className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={loadingEliminar}
                  className="flex-1 font-bold py-2.5 px-5 rounded-xl transition-all
                             bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500
                             text-white shadow-lg shadow-red-500/25 disabled:opacity-50">
                  {loadingEliminar ? 'Eliminando...' : 'Sí, eliminar todo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
