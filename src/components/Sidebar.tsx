import {
  LayoutDashboard, BarChart2, Brain, Plug, Timer, History, Cpu, Settings, LogOut, Zap, X,
} from "lucide-react";

type Page = string;

interface Props {
  current: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}

const nav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Energy Analytics", icon: BarChart2 },
  { id: "ai", label: "AI Insights", icon: Brain },
  { id: "appliances", label: "Appliances", icon: Plug },
  { id: "autooff", label: "Smart Auto-OFF", icon: Timer },
  { id: "history", label: "History", icon: History },
  { id: "device", label: "Device", icon: Cpu },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ current, onNavigate, onLogout, open, onClose }: Props) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col w-64 border-r transition-transform duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "#0c1225", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-white leading-none">Smart Energy</p>
              <p className="text-[10px] text-purple-400 font-mono mt-0.5">GUARDIAN</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {nav.map(({ id, label, icon: Icon }) => {
            const active = current === id;
            return (
              <button
                key={id}
                onClick={() => { onNavigate(id); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${active
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <Icon size={17} className={active ? "text-blue-400" : ""} />
                {label}
                {id === "ai" && (
                  <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">AI</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">V</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Vishwajeet</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] text-emerald-400 font-mono">CONNECTED</p>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
