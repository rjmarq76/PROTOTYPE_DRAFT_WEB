import { FormEvent, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, Users } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

export const DEMO_ACCOUNTS = [
  {
    email: 'admin@mgenesis.com',
    password: 'password123',
    role: 'Admin',
    designation: 'Executive',
    department: 'Business Solutions Manager'
  },
  {
    email: 'rankfile@mgenesis.com',
    password: 'password123',
    role: 'Employee',
    designation: 'Rank & File',
    department: 'Accounts Payable - Trade'
  },
  {
    email: 'supervisory@mgenesis.com',
    password: 'password123',
    role: 'Employee',
    designation: 'Supervisory',
    department: 'Logistics'
  },
  {
    email: 'managerial@mgenesis.com',
    password: 'password123',
    role: 'Employee',
    designation: 'Managerial',
    department: 'Procurement Group'
  },
  {
    email: 'director@mgenesis.com',
    password: 'password123',
    role: 'Employee',
    designation: 'Director',
    department: 'TASS'
  },
  {
    email: 'executive@mgenesis.com',
    password: 'password123',
    role: 'Employee',
    designation: 'Executive',
    department: 'Business Solutions Manager'
  }
];

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Verification of email extension: MUST have @mgenesis.com
    if (!trimmedEmail.endsWith('@mgenesis.com')) {
      setError('Access is restricted to verified @mgenesis.com email addresses.');
      return;
    }

    setIsSubmitting(true);
    // Simulated auth check: accept password123 or 12345678
    window.setTimeout(() => {
      if (password === 'password123' || password === '12345678') {
        onLogin(trimmedEmail);
      } else {
        setError('Incorrect password. For demo accounts or custom emails, please use "password123" or "12345678".');
        setIsSubmitting(false);
      }
    }, 400);
  }

  const handleQuickSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center pt-24 pb-10 px-4 sm:px-8 bg-[#0b1220] bg-cover bg-center overflow-y-auto"
      style={{
        backgroundImage:
          "linear-gradient(115deg, rgba(6,20,38,0.85) 0%, rgba(0,64,110,0.60) 55%, rgba(0,99,169,0.40) 100%), url('/login_image.png')",
      }}
    >
      {/* Brand mark, top-left */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-3 z-10">
        <img
          src="/microgenesis_logo.png"
          alt="Microgenesis Logo"
          className="h-7 object-contain brightness-0 invert"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-center gap-6 md:gap-8 w-full max-w-md md:max-w-4xl">
        {/* Login card */}
        <div className="relative w-full md:w-1/2 flex flex-col rounded-2xl border border-white/10 bg-white/95 backdrop-blur-sm shadow-2xl p-6 sm:p-8 dark:bg-slate-900/95">
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#0063a9] dark:text-blue-300">Microsoft Forms</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Survey Analytics</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Sign in to view stakeholder satisfaction reporting.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="field-label">Email address</span>
              <div className="mt-1 flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white pl-3 pr-3 transition focus-within:border-azure focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:ring-blue-950">
                <Mail size={16} className="shrink-0 text-[#0063a9] dark:text-blue-300" />
                <span className="h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />
                <input
                  type="email"
                  autoComplete="username"
                  className="w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-slate-400 dark:text-slate-100"
                  placeholder="name@mgenesis.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </label>

            <label className="block">
              <span className="field-label">Password</span>
              <div className="mt-1 flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white pl-3 pr-3 transition focus-within:border-azure focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:ring-blue-950">
                <LockKeyhole size={16} className="shrink-0 text-[#0063a9] dark:text-blue-300" />
                <span className="h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-slate-400 dark:text-slate-100"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0063a9] focus:ring-[#0063a9]"
                />
                Remember me
              </label>
              <button type="button" className="font-medium text-[#0063a9] hover:underline cursor-pointer dark:text-blue-300">
                Forgot password?
              </button>
            </div>

            {error && (
              <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose dark:bg-rose-950/30 dark:border-rose-900">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#0063a9] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#00528c] transition disabled:opacity-70 cursor-pointer font-bold"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Quick Select Panel */}
        <div className="relative w-full md:w-1/2 flex flex-col rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 text-white h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-[#0063a9]" size={20} />
            <h2 className="text-lg font-bold">Demo Simulation Accounts</h2>
          </div>
          <p className="text-xs text-slate-300 mb-4">
            Click on any account below to pre-fill credentials. You can also sign in with any custom email ending with <strong className="text-blue-300">@mgenesis.com</strong> using password <strong className="text-blue-300">password123</strong>.
          </p>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickSelect(acc.email)}
                className="w-full text-left p-3 rounded-lg border border-white/10 hover:border-blue-400 bg-white/5 hover:bg-white/10 transition flex flex-col gap-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300">{acc.email}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${acc.role === 'Admin' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                    {acc.role}
                  </span>
                </div>
                <div className="grid grid-cols-2 text-[10px] text-slate-400 mt-0.5">
                  <div>
                    <span className="text-slate-500 font-semibold">Designation:</span> {acc.designation}
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Department:</span> {acc.department}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
