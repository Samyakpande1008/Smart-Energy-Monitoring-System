import { useState, useEffect } from "react";
import { Brain, Plug, AlertTriangle, Zap } from "lucide-react";
import { historyItems as DEFAULT_HISTORY } from "../services/mockData";
import { api } from "../services/api";

const FILTERS = ["All", "AI", "Socket", "Auto-OFF", "Alerts"];

const iconMap: Record<string, React.ElementType> = {
  brain: Brain, plug: Plug, alert: AlertTriangle, zap: Zap,
};
const colorMap: Record<string, string> = {
  ai: "text-purple-400 bg-purple-500/10",
  socket: "text-blue-400 bg-blue-500/10",
  alert: "text-amber-400 bg-amber-500/10",
  autooff: "text-emerald-400 bg-emerald-500/10",
};
const filterKey: Record<string, string> = { All: "", AI: "ai", Socket: "socket", "Auto-OFF": "autooff", Alerts: "alert" };

export default function History() {
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState<any[]>(DEFAULT_HISTORY);

  useEffect(() => {
    let isMounted = true;
    api.devices.getHistory(1)
      .then(res => {
        if (isMounted && res && res.events && res.events.length > 0) {
          setItems(res.events);
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  const filteredItems = items.filter(h => !filterKey[filter] || h.type === filterKey[filter]);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-display font-bold text-white">History</h2>
        <p className="text-slate-400 text-sm mt-1">Activity log and event timeline.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${filter === f ? "bg-blue-600 text-white border-blue-500" : "text-slate-400 hover:text-white border-transparent hover:border-white/10"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredItems.map((h) => {
          const Icon = iconMap[h.icon] || Plug;
          const cls = colorMap[h.type] || colorMap.socket;
          return (
            <div key={h.id} className="flex items-center gap-4 p-4 rounded-xl border hover:border-white/10 transition-colors"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{h.title}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{h.time}</p>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${cls}`}>{h.type.toUpperCase()}</span>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-12">No events found for this filter.</p>
        )}
      </div>
    </div>
  );
}
