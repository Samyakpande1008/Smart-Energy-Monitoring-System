import { useState, useEffect } from "react";
import { Plug, ChevronRight, Clock, Zap, Activity, X } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../services/api";

interface ApplianceItem {
  id: number;
  name: string;
  socket: string;
  power: number;
  energy: number;
  confidence: number;
  status: "on" | "off";
  avgPower: number;
  typicalHours: string;
}

const DEFAULT_APPLIANCES: ApplianceItem[] = [
  { id: 1, name: "Fan", socket: "Socket 1", power: 105, energy: 1.42, confidence: 94, status: "on", avgPower: 92, typicalHours: "6–10h/day" },
  { id: 2, name: "Laptop", socket: "Socket 2", power: 67, energy: 0.92, confidence: 91, status: "on", avgPower: 68, typicalHours: "4–8h/day" },
];

const patternData = Array.from({ length: 12 }, (_, i) => ({
  t: `${(i + 7)}:00`, power: 60 + Math.random() * 50,
}));

export default function Appliances() {
  const [appliancesList, setAppliancesList] = useState<ApplianceItem[]>(DEFAULT_APPLIANCES);
  const [selected, setSelected] = useState<ApplianceItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAppliances = async () => {
      try {
        const res = await api.devices.get(1);
        if (isMounted && res && res.socket1 && res.socket2) {
          const list: ApplianceItem[] = [
            {
              id: 1,
              name: res.socket1.appliance || "Fan",
              socket: "Socket 1",
              power: res.socket1.power,
              energy: res.socket1.energyToday,
              confidence: res.socket1.confidence || 94,
              status: res.socket1.status as "on" | "off",
              avgPower: res.socket1.power > 0 ? res.socket1.power : 92,
              typicalHours: "6–10h/day"
            },
            {
              id: 2,
              name: res.socket2.appliance || "Laptop",
              socket: "Socket 2",
              power: res.socket2.power,
              energy: res.socket2.energyToday,
              confidence: res.socket2.confidence || 91,
              status: res.socket2.status as "on" | "off",
              avgPower: res.socket2.power > 0 ? res.socket2.power : 68,
              typicalHours: "4–8h/day"
            }
          ];
          setAppliancesList(list);
        }
      } catch (err) {
        // Fallback to default list
      }
    };

    fetchAppliances();
    const interval = setInterval(fetchAppliances, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-display font-bold text-white">Recognized Appliances</h2>
        <p className="text-slate-400 text-sm mt-1">AI-identified devices and their energy profiles.</p>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {["Appliance", "Socket", "Current Power", "Today's Energy", "AI Confidence", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appliancesList.map((a) => (
                <tr key={a.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Plug size={14} className="text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-white">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">{a.socket}</td>
                  <td className="px-4 py-4 text-sm font-mono text-cyan-400">{a.power} W</td>
                  <td className="px-4 py-4 text-sm font-mono text-blue-400">{a.energy} kWh</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${a.confidence}%` }} />
                      </div>
                      <span className="text-xs font-mono text-purple-400">{a.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={a.status} size="sm" /></td>
                  <td className="px-4 py-4">
                    <button onClick={() => setSelected(a)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                      Details <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-2xl border p-6" style={{ background: "#1a2340", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-display font-bold text-white">{selected.name}</h3>
                <p className="text-xs text-slate-400">{selected.socket}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { icon: Zap, label: "Average Power", value: `${selected.avgPower} W`, color: "text-cyan-400" },
                { icon: Activity, label: "Current Power", value: `${selected.power} W`, color: "text-white" },
                { icon: Clock, label: "Typical Usage", value: selected.typicalHours, color: "text-blue-400" },
                { icon: Plug, label: "Energy Today", value: `${selected.energy} kWh`, color: "text-purple-400" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <Icon size={13} className={`${color} mb-1`} />
                  <p className="text-[10px] text-slate-400">{label}</p>
                  <p className={`text-sm font-mono font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Power Pattern (Today)</p>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={patternData}>
                  <defs>
                    <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "#1a2340", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 10 }} />
                  <Area type="monotone" dataKey="power" name="W" stroke="#06b6d4" strokeWidth={2} fill="url(#gp)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">AI Confidence: <span className="text-purple-400 font-mono font-bold">{selected.confidence}%</span></span>
              <StatusBadge status={selected.status} size="sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
