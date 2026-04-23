import { useState } from 'react';
import { Zap, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
  onAuth: (token: string, user: { id: number; username: string; email: string }) => void;
}

export default function LoginPage({ onAuth }: LoginPageProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (tab === 'register') {
      if (!username.trim()) return 'Username is required.';
      if (username.trim().length < 3) return 'Username must be at least 3 characters.';
    }
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (tab === 'register' && password !== confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');

    try {
      const url = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login'
        ? { email, password }
        : { username, email, password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      localStorage.setItem('sg-auth-token', data.token);
      localStorage.setItem('sg-user', JSON.stringify(data.user));
      onAuth(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/6 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Glass Card */}
        <div className="bg-[#0c1226]/80 backdrop-blur-xl border border-[var(--border)] rounded-3xl shadow-2xl shadow-black/40 overflow-hidden">

          {/* Header / Branding */}
          <div className="pt-10 pb-6 flex flex-col items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.15 }}
              className="w-14 h-14 bg-gradient-to-br from-[var(--accent)] to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/10"
            >
              <Zap className="w-7 h-7 text-white fill-white/20" />
            </motion.div>
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight text-white">SMARTGRID</h1>
              <p className="text-xs text-[var(--text-dim)] mt-1 tracking-widest uppercase">Intelligent Home Power System</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="mx-8 mb-6">
            <div className="relative flex bg-[var(--bg)] border border-[var(--border)] rounded-xl p-1">
              <motion.div
                className="absolute top-1 bottom-1 rounded-lg bg-[var(--surface2)] border border-[var(--border)]"
                animate={{ left: tab === 'login' ? '4px' : 'calc(50% + 2px)', width: 'calc(50% - 6px)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
              {(['login', 'register'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                    tab === t ? 'text-white' : 'text-[var(--text-dim)] hover:text-white/70'
                  }`}
                >
                  {t === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              initial={{ opacity: 0, x: tab === 'login' ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === 'login' ? 16 : -16 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="px-8 pb-8 flex flex-col gap-4"
            >
              {/* Username (register only) */}
              {tab === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.65rem] text-[var(--text-dim)] uppercase font-semibold tracking-wider">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="johndoe"
                      autoComplete="username"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-[var(--text-dim)]/40 focus:border-[var(--accent)] transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.65rem] text-[var(--text-dim)] uppercase font-semibold tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-[var(--text-dim)]/40 focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.65rem] text-[var(--text-dim)] uppercase font-semibold tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl pl-10 pr-11 py-3 text-sm placeholder:text-[var(--text-dim)]/40 focus:border-[var(--accent)] transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (register only) */}
              {tab === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.65rem] text-[var(--text-dim)] uppercase font-semibold tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl pl-10 pr-11 py-3 text-sm placeholder:text-[var(--text-dim)]/40 focus:border-[var(--accent)] transition-colors"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-white transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-[0.8rem] text-red-400 font-medium"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[var(--accent)] to-blue-600 text-white rounded-xl py-3 text-sm font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {tab === 'login' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : (
                  tab === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>

              {/* Footer hint */}
              <p className="text-center text-[0.75rem] text-[var(--text-dim)]">
                {tab === 'login' ? (
                  <>Don't have an account?{' '}
                    <button type="button" onClick={() => { setTab('register'); setError(''); }}
                      className="text-[var(--accent)] hover:underline font-semibold">Register</button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button type="button" onClick={() => { setTab('login'); setError(''); }}
                      className="text-[var(--accent)] hover:underline font-semibold">Sign in</button>
                  </>
                )}
              </p>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Bottom subtle line */}
        <div className="mt-6 text-center">
          <p className="text-[0.6rem] text-[var(--text-dim)]/40 font-mono uppercase tracking-[0.2em]">Home Power Control System</p>
        </div>
      </motion.div>
    </div>
  );
}
