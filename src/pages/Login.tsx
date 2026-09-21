import { useState } from "react";
import { Zap, Eye, EyeOff, AlertCircle } from "lucide-react";
import { api } from "../services/api";

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("Vishwajeet");
  const [email, setEmail] = useState("demo@smartenergy.local");
  const [password, setPassword] = useState("demo1234");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/60 transition-colors`;
  const inputStyle = { background: "var(--card)", borderColor: "var(--border)" };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await api.auth.register(name, email, password);
      } else {
        await api.auth.login(email, password);
      }
      onLogin();
    } catch (err: any) {
      console.warn("Auth failed, falling back to offline demo mode:", err.message);
      // If server unreachable, allow offline demo entry
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        onLogin();
      } else {
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Smart Energy Guardian</h1>
          <p className="text-sm text-slate-400 mt-1 text-center">Intelligent energy monitoring for smarter homes.</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                  placeholder="Your Name"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
                style={inputStyle}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-xs text-slate-400">Remember me</span>
              </label>
              <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-600/25 disabled:opacity-50"
          >
            {loading ? "Signing in..." : (isRegister ? "Create Account" : "Sign In")}
          </button>
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(null); }}
            className="mt-3 w-full py-3 rounded-xl border text-sm text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            style={{ borderColor: "var(--border)" }}>
            {isRegister ? "Already have an account? Sign In" : "Create Account"}
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Demo credentials pre-filled · No real hardware required
        </p>
      </div>
    </div>
  );
}
