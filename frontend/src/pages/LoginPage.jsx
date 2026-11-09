import { useState } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  LoaderCircle,
  Mail,
  User,
} from 'lucide-react';
import { loginRequest } from '../services/api.js';

// Same selector shape as the global form-field rule in theme.css, so these fields can override it.
const FIELD =
  'input.asems-portal-input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="range"])';

// Colours of the Ambo University portal login page.
// The app forces transparent borders and green focus outlines (theme.css), so the field borders are set explicitly here.
const PORTAL_LOGIN_CSS = `
  .asems-portal-login { background-color: #ffffff; color: #333333; }
  .asems-portal-login .asems-portal-link { color: #3c8dbc; }
  .asems-portal-login .asems-portal-link:hover { color: #367fa9; }
  .asems-portal-login .asems-portal-avatar,
  .asems-portal-login .asems-portal-icon { color: #777777; }
  .asems-portal-login .asems-portal-note { color: #555555; }

  html body #root .asems-portal-login ${FIELD} {
    background-color: #e8f0fe;
    color: #000000;
    border: 1px solid #d2d6de !important;
    border-color: #d2d6de !important;
  }
  html body #root .asems-portal-login ${FIELD}:focus {
    border-color: #3c8dbc !important;
    outline: none;
  }
  html body #root .asems-portal-login .asems-portal-foot {
    border-top: 1px solid #d2d6de !important;
    border-top-color: #d2d6de !important;
  }

  html[data-theme='dark'] .asems-portal-login { background-color: #0c1917; color: #edf5f1; }
  html[data-theme='dark'] .asems-portal-login .asems-portal-avatar,
  html[data-theme='dark'] .asems-portal-login .asems-portal-icon { color: #9fb3ac; }
  html[data-theme='dark'] .asems-portal-login .asems-portal-note { color: #b8cbc4; }
  html[data-theme='dark'] .asems-portal-login .asems-portal-link { color: #6cb4dd; }
  html[data-theme='dark'] body #root .asems-portal-login ${FIELD} {
    background-color: #10201d;
    color: #edf5f1;
    border-color: #38554a !important;
  }
  html[data-theme='dark'] body #root .asems-portal-login ${FIELD}:focus {
    border-color: #6cb4dd !important;
  }
  html[data-theme='dark'] body #root .asems-portal-login .asems-portal-foot {
    border-top-color: #2c453d !important;
  }
`;

export default function LoginPage({ user, onLogin }) {
  const location = useLocation();
  const selectedRole = location.state?.selectedRole;
  const expectedRole = location.state?.expectedRole;

  // Students use their Student ID; staff use their email.
  const isStudent = expectedRole === 'student';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const result = await loginRequest(
        email.trim(),
        password,
        expectedRole,
      );

      onLogin(result.data.user);
    } catch (err) {
      setError(
        err?.message ||
          'Unable to sign in. Please check your credentials and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="asems-login-page asems-portal-login flex min-h-screen flex-col">
      <style>{PORTAL_LOGIN_CSS}</style>

      {/* LOGO */}
      <div className="flex items-start justify-between gap-4 px-5 pt-3 sm:px-8">
        <img
          src="/mylogo.png"
          alt="Ambo University"
          className="h-[80px] w-auto max-w-[60vw] object-contain object-left"
        />

        <Link
          to="/"
          className="asems-portal-link mt-3 rounded px-2 py-1 text-[17px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c8dbc]"
        >
          Home
        </Link>
      </div>

      {/* MESSAGE BAR */}
      {error && (
        <div
          id="login-error"
          role="alert"
          aria-live="polite"
          className="mt-8 flex items-center justify-between gap-4 bg-[#dd4b39] px-6 py-5 text-[17px] text-white"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss message"
            className="shrink-0 text-2xl leading-none opacity-70 transition hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* LOGIN */}
      <div className="mx-auto mt-12 w-full max-w-[780px] flex-1 px-6 pb-16 sm:mt-16">
        {selectedRole && (
          <p className="asems-portal-note mb-5 text-sm">
            Access category: <strong>{selectedRole}</strong>
          </p>
        )}

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-10">
          <User
            size={104}
            fill="currentColor"
            strokeWidth={1.2}
            aria-hidden="true"
            className="asems-portal-avatar shrink-0"
          />

          <form onSubmit={handleSubmit} className="w-full min-w-0 flex-1 space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Username
              </label>

              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                  required
                  maxLength={255}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);

                    if (error) {
                      setError('');
                    }
                  }}
                  placeholder="Enter your username"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="asems-portal-input h-[51px] w-full rounded-[3px] pl-4 pr-12 text-[17px] placeholder:text-[#777777]"
                />

                <Mail
                  size={20}
                  fill="currentColor"
                  stroke="#e8f0fe"
                  aria-hidden="true"
                  className="asems-portal-icon pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>

              <div className="relative">
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

                    if (error) {
                      setError('');
                    }
                  }}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="asems-portal-input h-[51px] w-full rounded-[3px] pl-4 pr-[5.5rem] text-[17px] placeholder:text-[#777777]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="asems-portal-icon absolute right-11 top-1/2 -translate-y-1/2 rounded p-1.5 transition hover:text-[#3c8dbc] focus-visible:ring-2 focus-visible:ring-[#3c8dbc]"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>

                <Lock
                  size={20}
                  fill="currentColor"
                  aria-hidden="true"
                  className="asems-portal-icon pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            {isStudent && (
              <p className="asems-portal-note text-sm leading-6">
                Your username is your Student ID. Sign in with it and the
                initial password given to you by the university. Passwords
                cannot be changed here. If you lost yours, contact the system
                administrator.
              </p>
            )}

            <div className="flex justify-center pt-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-[47px] min-w-[145px] items-center justify-center gap-2 rounded-[3px] bg-[#3c8dbc] px-8 text-[17px] text-white transition hover:bg-[#367fa9] focus-visible:ring-4 focus-visible:ring-[#3c8dbc]/30 disabled:cursor-not-allowed disabled:opacity-60"
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
                  <span>Login</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <p className="asems-portal-foot asems-portal-note py-4 text-center text-xs">
        AAPEMS · Ambo University
      </p>
    </main>
  );
}
