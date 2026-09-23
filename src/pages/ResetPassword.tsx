import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { TrendingUp, Lock, Eye, EyeOff, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams]   = useSearchParams();
  const navigate         = useNavigate();
  const token            = searchParams.get('token') || '';

  const [form, setForm]       = useState({ passwordNueva: '', confirmar: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exito, setExito]     = useState(false);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) { setTokenValido(false); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setTokenValido(payload.purpose === 'reset-password' && payload.exp * 1000 > Date.now());
    } catch { setTokenValido(false); }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.passwordNueva) return toast.error('Ingresa la nueva contraseña');
    if (form.passwordNueva.length < 6) return toast.error('Mínimo 6 caracteres');
    if (form.passwordNueva !== form.confirmar) return toast.error('Las contraseñas no coinciden');
    setLoading(true);
    try {
      await api.post('/auth/resetear-password', { token, passwordNueva: form.passwordNueva });
      setExito(true);
      toast.success('¡Contraseña restablecida!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al restablecer');
      if (err.response?.status === 400) setTokenValido(false);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#080b14] flex items-center justify-center p-4">
      <div className="fixed top-[-150px] right-[10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl shadow-violet-500/30">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FinanzApp</span>
        </div>

        <div className="card-glass">
          {/* Cargando */}
          {tokenValido === null && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Token inválido */}
          {tokenValido === false && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <XCircle size={32} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white mb-2">Enlace inválido</h2>
                <p className="text-slate-400 text-sm">Este enlace expiró o no es válido. Solicita uno nuevo.</p>
              </div>
              <Link to="/recuperar-password" className="btn-primary w-full inline-block text-center">
                Solicitar nuevo enlace
              </Link>
            </div>
          )}

          {/* Éxito */}
          {exito && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white mb-2">¡Listo!</h2>
                <p className="text-slate-400 text-sm">Tu contraseña fue restablecida. Redirigiendo al login...</p>
              </div>
              <Link to="/login" className="btn-primary w-full inline-block text-center">
                Ir al inicio de sesión
              </Link>
            </div>
          )}

          {/* Form */}
          {tokenValido === true && !exito && (
            <>
              <div className="mb-7">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 bg-violet-500/15 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={17} className="text-violet-400" />
                  </div>
                  <h1 className="text-xl font-extrabold text-white">Nueva contraseña</h1>
                </div>
                <p className="text-slate-400 text-sm">Elige una contraseña segura de al menos 6 caracteres.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nueva contraseña</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type={showPass ? 'text' : 'password'} className="input pl-10 pr-11"
                      placeholder="Mínimo 6 caracteres" value={form.passwordNueva}
                      onChange={e => setForm(p => ({ ...p, passwordNueva: e.target.value }))} autoFocus />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type={showPass ? 'text' : 'password'} className="input pl-10"
                      placeholder="Repite la contraseña" value={form.confirmar}
                      onChange={e => setForm(p => ({ ...p, confirmar: e.target.value }))} />
                  </div>
                  {form.confirmar && form.passwordNueva !== form.confirmar && (
                    <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Restableciendo...</>
                    : 'Restablecer contraseña'
                  }
                </button>
              </form>
            </>
          )}

          {!exito && (
            <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
              <Link to="/login" className="text-slate-500 hover:text-white text-sm transition-colors">
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
