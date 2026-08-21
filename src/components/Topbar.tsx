import { Bell, Menu, Wifi, FlaskConical } from "lucide-react";

interface Props {
  title: string;
  onMenuOpen: () => void;
}

export default function Topbar({ title, onMenuOpen }: Props) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-3 border-b"
      style={{ background: "rgba(15,22,41,0.9)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-3">
        <button onClick={onMenuOpen} className="lg:hidden text-slate-400 hover:text-white p-1">
          <Menu size={20} />
        </button>
        <h1 className="text-base font-display font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <FlaskConical size={12} className="text-amber-400" />
          <span className="text-amber-400">DEMO MODE</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: "var(--card)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <Wifi size={12} className="text-emerald-400" />
          <span className="text-emerald-400 font-medium">Smart Extension #001</span>
        </div>
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">V</div>
      </div>
    </header>
  );
}
