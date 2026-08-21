import { useState, useEffect } from "react";
import { Zap, Activity, DollarSign, Thermometer, Brain, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, Power } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { generateSensorData, generateHourlyData, type SocketStatus } from "../services/mockData";

const CHART_TABS = ["Today", "7 Days", "30 Days"];

export default function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [s1Status, setS1Status] = useState<SocketStatus>("on");
  const [s2Status, setS2Status] = useState<SocketStatus>("on");
  const [data, setData] = useState(() => generateSensorData({ s1Status: "on", s2Status: "on" }));
  const [chartTab, setChartTab] = useState(0);
  const [chartData] = useState(() => generateHourlyData());

  useEffect(() => {
    const id = setInterval(() => {
      setData(generateSensorData({ s1Status, s2Status }));
    }, 3000);
    return () => clearInterval(id);
  }, [s1Status, s2Status]);

  const toggleSocket = (n: 1 | 2) => {
    if (n === 1) {
      const next: SocketStatus = s1Status === "on" ? "off" : "on";
      setS1Status(next);
      setData(generateSensorData({ s1Status: next, s2Status }));
    } else {
      const next: SocketStatus = s2Status === "on" ? "off" : "on";
      setS2Status(next);
      setData(generateSensorData({ s1Status, s2Status: next }));
    }
  };

  const sockets = [data.socket1, data.socket2];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl p-3 text-xs border" style={{ background: "#1a2340", borderColor: "var(--border)" }}>
        <p className="text-slate-400 mb-2 font-mono">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value.toFixed(0)} W</span></p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-white">Good Morning, Vishwajeet 👋</h2>
          <p className="text-slate-400 text-sm mt-1">{"Here's your energy overview."}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs" style={{ background: "var(--card)", borderColor: "rgba(16,185,129,0.2)" }}>
          <StatusBadge status="online" size="sm" />
          <span className="text-slate-300">Smart Extension</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<Thermometer size={18} />} label="Voltage" value={data.voltage.toFixed(1)} unit="V" delta="+0.2%" deltaUp accent="blue" />
        <StatCard icon={<Zap size={18} />} label="Total Power" value={data.totalPower.toFixed(0)} unit="W" delta="+8% vs yesterday" deltaUp accent="cyan" />
        <StatCard icon={<Activity size={18} />} label="Today's Energy" value={data.energyToday.toFixed(2)} unit="kWh" delta="+5% vs yesterday" deltaUp accent="purple" />
        <StatCard icon={<DollarSign size={18} />} label="Monthly Bill" value={`₹${data.monthlyBill.toFixed(0)}`} delta="-3% projected" deltaUp={false} accent="amber" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sockets.map((s) => {
          const isOn = s.status === "on";
          return (
            <div key={s.id} className={`rounded-2xl border p-5 transition-all duration-300 ${isOn ? "border-emerald-500/20" : "border-red-500/20"}`}
              style={{ background: "var(--card)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-mono text-slate-400">SOCKET {s.id}</p>
                  <h3 className="text-lg font-display font-bold text-white mt-0.5">{s.appliance || "—"}</h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={isOn ? "on" : "off"} />
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    AI {s.confidence}% confident
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Current", value: isOn ? `${s.current} A` : "0 A" },
                  { label: "Power", value: isOn ? `${s.power.toFixed(0)} W` : "0 W" },
                  { label: "Today", value: `${s.energyToday} kWh` },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-[10px] text-slate-500 mb-1">{m.label}</p>
                    <p className="text-sm font-mono font-bold text-white">{m.value}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toggleSocket(s.id)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                  ${isOn ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"}`}
              >
                <Power size={15} />
                {isOn ? "Turn OFF" : "Turn ON"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "rgba(139,92,246,0.3)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Brain size={16} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-display font-semibold text-white">AI Energy Intelligence</h3>
              <p className="text-[10px] text-purple-400 font-mono">POWERED BY ML</p>
            </div>
          </div>
          <button onClick={() => onNavigate("ai")} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
            View AI Insights <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { icon: Brain, color: "purple", label: "Appliance Recognition", body: `Fan on Socket 1 · Laptop on Socket 2`, sub: "94% & 91% confidence" },
            { icon: TrendingUp, color: "cyan", label: "Consumption Prediction", body: "Expected today: 3.2 kWh", sub: `Actual so far: ${data.energyToday} kWh` },
            { icon: AlertTriangle, color: "green", label: "Anomaly Detection", body: "No abnormal consumption detected", sub: "All readings in normal range" },
            { icon: Lightbulb, color: "amber", label: "Smart Recommendation", body: "Socket 1 running 18% longer than usual", sub: "Est. saving: ₹72 this month" },
          ].map(({ icon: Icon, color, label, body, sub }) => (
            <div key={label} className={`rounded-xl p-4 border border-${color}-500/15`} style={{ background: "rgba(255,255,255,0.03)" }}>
              <Icon size={15} className={`text-${color}-400 mb-2`} />
              <p className={`text-[10px] font-mono text-${color}-400 mb-1`}>{label.toUpperCase()}</p>
              <p className="text-xs text-white font-medium mb-1">{body}</p>
              <p className="text-[10px] text-slate-500">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-display font-semibold text-white">{"Today's Power Consumption"}</h3>
            <div className="flex gap-4 mt-2">
              {[
                { label: "Peak", value: "198 W", color: "text-cyan-400" },
                { label: "Average", value: "112 W", color: "text-blue-400" },
                { label: "Total", value: `${data.energyToday} kWh`, color: "text-purple-400" },
              ].map(m => (
                <span key={m.label} className="text-xs">
                  <span className="text-slate-500">{m.label}: </span>
                  <span className={`font-mono font-medium ${m.color}`}>{m.value}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
            {CHART_TABS.map((t, i) => (
              <button key={t} onClick={() => setChartTab(i)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${chartTab === i ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
            <defs>
              <linearGradient id="gs1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gs2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} interval={3} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="s1" name="Socket 1" stroke="#06b6d4" strokeWidth={2} fill="url(#gs1)" dot={false} />
            <Area type="monotone" dataKey="s2" name="Socket 2" stroke="#8b5cf6" strokeWidth={2} fill="url(#gs2)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
