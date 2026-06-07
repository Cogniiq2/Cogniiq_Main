import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';

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

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === 'true') setAuthed(true);
    setChecked(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === VALID_USER && password === VALID_PASS) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
      setError(null);
    } else {
      setError('Invalid credentials. Access denied.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  if (!checked) return null;
  if (authed) return <>{children}</>;

  return (
    <div
      className="min-h-screen flex items-center justify-center text-white px-4"
      style={{ background: 'linear-gradient(135deg, #050d14 0%, #060f1a 40%, #04090f 100%)' }}
    >
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #2e6f8f 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #3d9fbe 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(61,159,190,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(61,159,190,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Lock icon */}
        <div className="flex justify-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(46,111,143,0.12)',
              border: '1px solid rgba(61,159,190,0.2)',
              boxShadow: '0 0 30px rgba(46,111,143,0.1)',
            }}
          >
            <Lock size={22} className="text-[#3d9fbe]" />
          </div>
        </div>

        {/* Labels */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#3d9fbe]/50 mb-2">
            Cogniiq Command Center
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Restricted Access</h1>
          <p className="text-sm text-white/25 mt-2">Authenticate to continue</p>
        </div>

        {/* Form card */}
        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(61,159,190,0.06)' }}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.16em] uppercase text-white/30 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                placeholder="Enter username"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white/80 placeholder-white/20 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#2e6f8f]/50 focus:bg-white/[0.07] transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.16em] uppercase text-white/30 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Enter password"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl text-sm text-white/80 placeholder-white/20 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-[#2e6f8f]/50 focus:bg-white/[0.07] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-400/80 text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-2.5 mt-1 rounded-xl text-sm font-semibold bg-[#2e6f8f]/20 text-[#7dd3e8] border border-[#2e6f8f]/30 hover:bg-[#2e6f8f]/30 hover:border-[#2e6f8f]/50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={14} />
              Access Command Center
            </button>
          </form>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-[10px] text-white/15 mt-6 tracking-wide">
          Session expires on browser close
        </p>
      </motion.div>
    </div>
  );
}
