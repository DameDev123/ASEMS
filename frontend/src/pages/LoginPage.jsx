
import { useState } from 'react';
import { Eye, EyeOff, GraduationCap, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { loginRequest } from '../services/api.js';

export default function LoginPage({ user, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginRequest(email.trim(), password);
      onLogin(result.data.user);
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-10 sm:px-6">
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-2">
        <section className="relative hidden min-h-[600px] flex-col justify-between overflow-hidden bg-navy-950 p-10 text-white lg:flex xl:p-12">
          <div className="absolute -right-24 top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-12 top-36 h-48 w-48 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-gold-500/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500 text-white shadow-lg shadow-black/20">
              <GraduationCap size={28} />
            </div>
            <div>
              <p className="text-xl font-bold tracking-wide">ASEMS</p>
              <p className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-slate-300">
                AMBO UNIVERSITY
              </p>
            </div>
          </div>

          <div className="relative my-12">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
              <ShieldCheck size={14} className="text-amber-300" />
              Academic performance management
            </div>
            <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Supporting excellence through
              <span className="text-amber-300"> evaluation.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              Access the Academic and Administrative Staff Evaluation
              Management System to manage evaluation activities and
              authorized reports.
            </p>

            <div className="mt-9 space-y-4">
              {[
                'Secure access based on your account',
                'Structured academic evaluation workflows',
                'Centralized performance reporting',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-amber-300">
                    <ShieldCheck size={13} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-slate-400">
            Academic and Administrative Staff Evaluation Management System
          </p>
        </section>

        <section className="flex min-h-[600px] flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-14">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-950 text-amber-300">
              <GraduationCap size={25} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">ASEMS</p>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500">
                AMBO UNIVERSITY
              </p>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Welcome back
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Sign in to ASEMS
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your university account credentials to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  required
                  maxLength={255}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@university.edu.et"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-navy-800 focus:ring-4 focus:ring-navy-900/5"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <LockKeyhole size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-navy-800 focus:ring-4 focus:ring-navy-900/5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-950 px-4 text-sm font-semibold text-white shadow-lg shadow-navy-950/10 transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-900/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in to your account'}
            </button>
          </form>

          <div className="mt-7 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-700" />
            <p className="text-xs leading-5 text-slate-500">
              Your account permissions determine which workspace features you can access.
              If your account is inactive, contact your system administrator.
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            ASEMS · Ambo University · Development environment
          </p>
        </section>
      </div>
    </main>
  );
}
