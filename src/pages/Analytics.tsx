import { useState } from "react";
import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { generateDailyData, generateHourlyData } from "../services/mockData";

const FILTERS = ["Today", "Week", "Month", "Custom"];

const daily = generateDailyData(7);
const hourly = generateHourlyData(24);
const costData = daily.map(d => ({ ...d, s1Cost: +(d.cost * 0.6).toFixed(0), s2Cost: +(d.cost * 0.4).toFixed(0) }));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs border" style={{ background: "#1a2340", borderColor: "var(--border)" }}>
      <p className="text-slate-400 mb-1 font-mono">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <h3 className="text-sm font-display font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function Analytics() {
  const [filter, setFilter] = useState(0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-white">Energy Analytics</h2>
          <p className="text-slate-400 text-sm mt-1">Detailed energy usage analysis and trends.</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--card)" }}>
          {FILTERS.map((f, i) => (
            <button key={f} onClick={() => setFilter(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === i ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Energy", value: "18.4 kWh", color: "text-cyan-400" },
          { label: "Daily Average", value: "2.63 kWh", color: "text-blue-400" },
          { label: "Peak Power", value: "198 W", color: "text-purple-400" },
          { label: "Monthly Bill", value: "₹486", color: "text-amber-400" },
          { label: "Est. Savings", value: "₹72", color: "text-emerald-400" },
        ].map(m => (
          <div key={m.label} className="rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <p className="text-[10px] text-slate-400 mb-1">{m.label}</p>
            <p className={`text-xl font-display font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Daily Energy Consumption (kWh)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="energy" name="kWh" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Power Consumption Over Time (W)">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourly.filter((_, i) => i % 2 === 0)}>
              <defs>
                <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Watts" stroke="#06b6d4" strokeWidth={2} fill="url(#gt)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Socket 1 vs Socket 2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="energy" name="Socket 1" fill="#06b6d4" radius={[3, 3, 0, 0]} />
              <Bar dataKey="cost" name="Socket 2 (est)" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Estimated Electricity Cost (₹)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="s1Cost" name="Socket 1 ₹" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} />
              <Line type="monotone" dataKey="s2Cost" name="Socket 2 ₹" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
