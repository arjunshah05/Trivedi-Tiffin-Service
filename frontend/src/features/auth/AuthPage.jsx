import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const result = isRegister ? await register(form) : await login({ email: form.email, password: form.password });
      navigate(result.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="auth-page">
    <div className="auth-art"><div className="auth-brand"><span className="brand-mark"><UtensilsCrossed size={22}/></span><span><b>Trivedi</b><small>Tiffin Service</small></span></div><div className="auth-message"><div className="pill"><span className="status-dot"/> DAILY MEALS. SIMPLIFIED.</div><h1>Good food.<br/><em>Clear records.</em></h1><p>Your daily tiffin, monthly billing and payment history — all in one calm, organized place.</p><div className="meal-illustration"><div className="plate"><div className="plate-food food-a"/><div className="plate-food food-b"/><div className="plate-food food-c"/><div className="plate-food food-d"/></div><div className="leaf leaf-one"/><div className="leaf leaf-two"/></div><div className="auth-foot"><ShieldCheck size={16}/> Your account is protected with secure sign-in.</div></div></div>
    <div className="auth-form-side"><div className="auth-form-wrap"><div className="mobile-brand"><UtensilsCrossed/> Trivedi Tiffin Service</div><span className="eyebrow">{isRegister ? 'GET STARTED' : 'WELCOME BACK'}</span><h2>{isRegister ? 'Create your account' : 'Sign in to your account'}</h2><p className="muted">{isRegister ? 'Set up your tiffin account in a minute.' : 'Your meal records are right where you left them.'}</p>
      <form onSubmit={submit} className="form-stack">
        {isRegister && <label>Full name<input name="fullName" value={form.fullName} onChange={change} required minLength="2" autoComplete="name" placeholder="Your full name"/></label>}
        <label>Email address<input name="email" type="email" value={form.email} onChange={change} required autoComplete="email" placeholder="you@example.com"/></label>
        {isRegister && <label>Phone number <span className="optional">Optional</span><input name="phone" value={form.phone} onChange={change} autoComplete="tel" placeholder="+91"/></label>}
        <label>Password<input name="password" type="password" value={form.password} onChange={change} required minLength={isRegister ? 10 : 1} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder={isRegister ? 'At least 10 characters' : 'Enter your password'}/></label>
        {error && <div className="alert error">{error}</div>}
        <button className="button primary full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={17}/></button>
      </form><p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Trivedi Tiffin Service?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p><p className="fine-print">By continuing, you agree to use this service responsibly. Contact the administrator for account support.</p>
    </div></div>
  </div>;
}
