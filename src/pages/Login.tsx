import { useState } from "react";
import { Zap, Eye, EyeOff } from "lucide-react";

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("vishwajeet@example.com");
  const [password, setPassword] = useState("••••••••");
  const [remember, setRemember] = useState(true);

  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/60 transition-colors`;
  const inputStyle = { background: "var(--card)", borderColor: "var(--border)" };

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
          <div className="space-y-4">
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
            onClick={onLogin}
            className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-600/25"
          >
            Sign In
          </button>
          <button className="mt-3 w-full py-3 rounded-xl border text-sm text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            style={{ borderColor: "var(--border)" }}>
            Create Account
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Demo credentials pre-filled · No real hardware required
        </p>
      </div>
    </div>
  );
}
