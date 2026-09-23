import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { TrendingUp, User, Mail, Lock, Eye, EyeOff, DollarSign, ArrowRight, Check } from 'lucide-react';

const MONEDAS = [
  { value: 'USD', label: 'USD — Dólar Americano',  flag: '🇺🇸' },
  { value: 'EUR', label: 'EUR — Euro',              flag: '🇪🇺' },
  { value: 'COP', label: 'COP — Peso Colombiano',  flag: '🇨🇴' },
  { value: 'MXN', label: 'MXN — Peso Mexicano',    flag: '🇲🇽' },
  { value: 'ARS', label: 'ARS — Peso Argentino',   flag: '🇦🇷' },
  { value: 'CLP', label: 'CLP — Peso Chileno',     flag: '🇨🇱' },
  { value: 'PEN', label: 'PEN — Sol Peruano',      flag: '🇵🇪' },
  { value: 'VES', label: 'VES — Bolívar',          flag: '🇻🇪' },
  { value: 'BRL', label: 'BRL — Real Brasileño',   flag: '🇧🇷' },
];

const FEATURES = [
  'Control total de ingresos y egresos',
  'Presupuestos inteligentes por categoría',
  'Metas de ahorro con seguimiento',
  'Reportes y gráficos detallados',
];

export default function Registro() {
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', confirmPass: '', moneda: 'USD',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { registro } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) return toast.error('Completa todos los campos');
    if (form.password !== form.confirmPass) return toast.error('Las contraseñas no coinciden');
    if (form.password.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    try {
      await registro(form.nombre, form.email, form.password, form.moneda);
      toast.success('¡Cuenta creada! Bienvenido a FinanzApp 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-[#0d0f1e] to-[#0a0c1a] p-12 relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute bottom-[0px] left-[-60px] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl shadow-violet-500/30">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FinanzApp</span>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Empieza hoy,<br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                es completamente gratis
              </span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Únete y transforma la manera en que manejas tu dinero.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <Check size={13} className="text-violet-400" strokeWidth={3} />
                </div>
                <span className="text-slate-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-slate-600 text-sm">
          © 2026 FinanzApp — Gestión financiera inteligente
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#080b14] overflow-y-auto">
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-white font-bold">FinanzApp</span>
        </div>

        <div className="w-full max-w-sm py-10 lg:py-0 animate-fade-up">
          <div className="mb-7">
            <h1 className="text-3xl font-extrabold text-white mb-2">Crear cuenta</h1>
            <p className="text-slate-400">Configura tu perfil financiero en segundos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nombre completo</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input name="nombre" type="text" className="input pl-10" placeholder="Ana García"
                  value={form.nombre} onChange={handleChange} autoFocus />
              </div>
            </div>

            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input name="email" type="email" className="input pl-10" placeholder="tu@email.com"
                  value={form.email} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="label">Moneda principal</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <select name="moneda" className="input pl-10 appearance-none"
                  value={form.moneda} onChange={handleChange}>
                  {MONEDAS.map(m => (
                    <option key={m.value} value={m.value}>{m.flag} {m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input name="password" type={showPass ? 'text' : 'password'} className="input pl-10 pr-11"
                  placeholder="Mín. 6 caracteres" value={form.password} onChange={handleChange} />
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
                <input name="confirmPass" type={showPass ? 'text' : 'password'} className="input pl-10"
                  placeholder="Repite la contraseña" value={form.confirmPass} onChange={handleChange} />
              </div>
              {form.confirmPass && form.password !== form.confirmPass && (
                <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                <>Crear Cuenta Gratis <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-slate-500 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
