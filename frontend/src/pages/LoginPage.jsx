
import { useState } from 'react';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  LoaderCircle,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { loginRequest } from '../services/api.js';

const FEATURES = [
  'Secure, role-based account access',
  'Structured evaluation workflows',
  'Centralized performance reporting',
];

function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-slate-200/70">
        <img
          src="/mylogo.png"
          alt="Ambo University emblem"
          className="h-full w-full object-contain"
        />
      </div>

      <div className="min-w-0">
        <p
          className={`font-extrabold tracking-tight ${
            compact ? 'text-lg text-slate-950' : 'text-xl text-white'
          }`}
        >
          ASEMS
        </p>
        <p
          className={`mt-0.5 text-[10px] font-bold uppercase tracking-[0.19em] ${
            compact ? 'text-slate-500' : 'text-slate-300'
          }`}
        >
          Ambo University
        </p>
      </div>
    </div>
  );
}

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

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const result = await loginRequest(email.trim(), password);
      onLogin(result.data.user);
    } catch (err) {
      setError(
        err?.message || 'Unable to sign in. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f6fa] px-4 py-8 sm:px-6 lg:py-12">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-40 -top-36 h-[28rem] w-[28rem] rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-white" />
      </div>

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_30px_100px_-35px_rgba(15,23,42,0.24)] lg:min-h-[650px] lg:grid-cols-[1.02fr_0.98fr]">
        {/* Left: university identity */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#0b1b31] p-10 text-white lg:flex xl:p-12">
          {/* Decorative geometry */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute -right-32 top-28 h-96 w-96 rounded-full border border-white/[0.08]" />
            <div className="absolute -right-20 top-40 h-72 w-72 rounded-full border border-white/[0.09]" />
            <div className="absolute -right-8 top-52 h-48 w-48 rounded-full border border-white/[0.10]" />
            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-amber-400/[0.08] blur-3xl" />
            <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-amber-300/60 via-white/10 to-transparent" />
          </div>

          <div className="relative">
            <Brand />

            <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-slate-200 shadow-sm">
              <ShieldCheck size={15} className="text-amber-300" />
              Academic performance management
            </div>
          </div>

          <div className="relative my-10">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300">
              Excellence through accountability
            </p>

            <h1 className="max-w-lg text-4xl font-bold leading-[1.14] tracking-tight xl:text-[3.35rem]">
              Supporting excellence through{' '}
              <span className="text-amber-300">evaluation.</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">
              Access the Academic and Administrative Staff Evaluation
              Management System to manage evaluation activities and
              authorized reports in one centralized workspace.
            </p>

            <div className="mt-9 space-y-4">
              {FEATURES.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 text-sm text-slate-200"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10">
                    <CheckCircle2
                      size={14}
                      className="text-amber-300"
                      aria-hidden="true"
                    />
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-end justify-between gap-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-xs font-medium text-slate-300">
                Ambo University
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Academic and Administrative Staff Evaluation Management System
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
              <GraduationCap
                size={21}
                className="text-amber-300"
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        {/* Right: authentication */}
        <section className="flex min-w-0 flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12 xl:px-[4.5rem]">
          {/* Mobile branding */}
          <div className="mb-10 flex items-center justify-between gap-4 lg:hidden">
            <Brand compact />
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <GraduationCap size={22} aria-hidden="true" />
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-0.5 w-7 rounded-full bg-amber-500" />
              <p className="text-[11px] font-bold uppercase tracking-[0.23em] text-amber-700">
                Welcome back
              </p>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-[2.15rem]">
              Sign in to ASEMS
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
              Enter your university account credentials to access your
              workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <div className="group relative">
                <Mail
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-amber-600"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  required
                  maxLength={255}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError('');
                  }}
                  placeholder="you@university.edu.et"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="h-[3.25rem] w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>
              </div>

              <div className="group relative">
                <LockKeyhole
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-amber-600"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="h-[3.25rem] w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* API error */}
            {error && (
              <div
                id="login-error"
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
              >
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <p>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-[#0b1b31] px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 outline-none transition-all duration-200 hover:bg-[#142c49] hover:shadow-xl hover:shadow-slate-900/15 focus-visible:ring-4 focus-visible:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-lg"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in to your account</span>
                  <ArrowRight
                    size={17}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-emerald-700"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-semibold text-slate-700">
                Secure university access
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Use your authorized university account. Access to system
                features depends on your assigned permissions.
              </p>
            </div>
          </div>

          <footer className="mt-8 border-t border-slate-100 pt-5 text-center">
            <p className="text-[11px] leading-5 text-slate-400">
              ASEMS · Ambo University
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Academic and Administrative Staff Evaluation Management System
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}