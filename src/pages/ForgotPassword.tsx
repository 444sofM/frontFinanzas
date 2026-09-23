import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { TrendingUp, Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Ingresa tu email');
    setLoading(true);
    try {
      const res = await api.post('/auth/recuperar-password', { email });
      setEnviado(true);
      if (res.data.reset_token) setResetToken(res.data.reset_token);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#080b14] flex items-center justify-center p-4">
      {/* Orbs */}
      <div className="fixed top-[-150px] left-[10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-100px] right-[5%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl shadow-violet-500/30">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FinanzApp</span>
        </div>

        <div className="card-glass">
          {!enviado ? (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-extrabold text-white mb-2">Recuperar contraseña</h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Correo electrónico</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="email" className="input pl-10" placeholder="tu@email.com"
                      value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</>
                    : <><Send size={15} /> Enviar instrucciones</>
                  }
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white mb-2">¡Solicitud enviada!</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Si <strong className="text-slate-300">{email}</strong> está registrado,
                  recibirás las instrucciones.
                </p>
              </div>
              {resetToken && (
                <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 text-left">
                  <p className="text-amber-400 text-xs font-bold mb-1.5">🛠 Modo desarrollo</p>
                  <p className="text-slate-500 text-xs mb-3">
                    En producción esto llegaría por email.
                  </p>
                  <Link to={`/resetear-password?token=${resetToken}`}
                    className="text-violet-400 text-sm underline hover:text-violet-300 transition-colors break-all">
                    Ir a restablecer contraseña →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <Link to="/login"
              className="flex items-center justify-center gap-2 text-slate-500 hover:text-white text-sm transition-colors">
              <ArrowLeft size={14} /> Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
