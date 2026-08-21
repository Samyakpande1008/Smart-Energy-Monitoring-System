import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaUp?: boolean;
  accent?: "blue" | "cyan" | "purple" | "green" | "amber";
}

const accents = {
  blue: { bg: "bg-blue-500/10", icon: "text-blue-400", border: "border-blue-500/20" },
  cyan: { bg: "bg-cyan-500/10", icon: "text-cyan-400", border: "border-cyan-500/20" },
  purple: { bg: "bg-purple-500/10", icon: "text-purple-400", border: "border-purple-500/20" },
  green: { bg: "bg-emerald-500/10", icon: "text-emerald-400", border: "border-emerald-500/20" },
  amber: { bg: "bg-amber-500/10", icon: "text-amber-400", border: "border-amber-500/20" },
};

export default function StatCard({ icon, label, value, unit, delta, deltaUp, accent = "blue" }: Props) {
  const a = accents[accent];
  return (
    <div className={`rounded-2xl border ${a.border} p-5 flex flex-col gap-3`} style={{ background: "var(--card)" }}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center ${a.icon}`}>{icon}</div>
        {delta && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${deltaUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {delta}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-display font-bold text-white">
          {value}
          {unit && <span className="text-base font-normal text-slate-400 ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
