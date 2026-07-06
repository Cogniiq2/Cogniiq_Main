import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const SESSION_KEY = 'cogniiq_admin_auth';
const VALID_USER = 'Cogniiq';
const VALID_PASS = 'talisman';

interface Props {
  children: React.ReactNode;
}

export function AdminGate({ children }: Props) {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') setAuthed(true);
    setChecked(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 420));
    setLoading(false);

    if (username === VALID_USER && password === VALID_PASS) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
    } else {
      setError('Access denied. Invalid credentials.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  if (!checked) return null;
  if (authed) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 font-sans" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-primary)' }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(var(--admin-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--admin-grid-line) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full" style={{ background: 'var(--admin-glow-radial)' }} />
        <motion.div className="absolute left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, var(--admin-scan-line) 50%, transparent 100%)' }} animate={{ top: ['0%', '100%'] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[360px]"
      >
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--admin-surface-hover)', border: '1px solid var(--admin-border-strong)', boxShadow: 'var(--accent-glow)' }}
            animate={{ boxShadow: ['0 0 20px color-mix(in srgb, var(--admin-accent) 4%, transparent)', '0 0 40px color-mix(in srgb, var(--admin-accent) 10%, transparent)', '0 0 20px color-mix(in srgb, var(--admin-accent) 4%, transparent)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--admin-accent-subtle)" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </motion.div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <p className="text-[9px] font-bold tracking-[0.28em] uppercase font-mono mb-2" style={{ color: 'var(--admin-accent-subtle)' }}>
            Cogniiq Command Center
          </p>
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--admin-text-primary)' }}>Restricted Access</h1>
          <p className="text-xs font-mono" style={{ color: 'var(--admin-text-muted)' }}>
            Authenticate to enter the system
          </p>
        </div>

        {/* Card */}
        <motion.div
          animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl p-6 relative"
          style={{ background: 'var(--admin-surface-elevated)', border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-card-shadow)' }}
        >
          <div className="absolute top-0 left-6 right-6 h-px rounded-full" style={{ background: 'linear-gradient(90deg, transparent, var(--admin-header-scan), transparent)' }} />

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[9px] font-bold tracking-[0.2em] uppercase font-mono mb-1.5" style={{ color: 'var(--admin-text-muted)' }}>
                Username
              </label>
              <input
                type="text" required autoComplete="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 font-mono"
                style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-input-border)', color: 'var(--admin-input-text)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border-focus)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-input-border)'; }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[9px] font-bold tracking-[0.2em] uppercase font-mono mb-1.5" style={{ color: 'var(--admin-text-muted)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 font-mono"
                  style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-input-border)', color: 'var(--admin-input-text)' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border-focus)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-input-border)'; }}
                />
                <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--admin-text-muted)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--admin-text-secondary)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--admin-text-muted)'; }}
                >
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-[10px] font-mono text-center" style={{ color: 'var(--admin-danger)' }}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full py-3 mt-1 rounded-xl text-sm font-bold tracking-wide font-mono transition-all duration-200 flex items-center justify-center gap-2"
              style={loading
                ? { background: 'var(--admin-surface)', color: 'var(--admin-text-muted)', border: '1px solid var(--admin-border)', cursor: 'not-allowed' }
                : { background: 'var(--admin-button-primary-bg)', color: 'var(--admin-accent)', border: '1px solid var(--admin-button-primary-border)' }
              }
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--admin-button-primary-hover)'; }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--admin-button-primary-bg)'; }}
            >
              {loading ? (
                <><span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />Authenticating…</>
              ) : (
                <>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Access Command Center
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-[9px] font-mono mt-5" style={{ color: 'var(--admin-text-faint)' }}>
          Session expires on browser close
        </p>
      </motion.div>
    </div>
  );
}
