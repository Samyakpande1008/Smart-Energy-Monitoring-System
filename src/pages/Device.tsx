import { Cpu, Wifi, Signal, RefreshCw, Settings, Edit2, Download } from "lucide-react";
import StatusBadge from "../components/StatusBadge";

export default function Device() {
  const specs = [
    { label: "Device Name", value: "Smart Energy Guardian #001" },
    { label: "Status", value: <StatusBadge status="online" size="sm" /> },
    { label: "Wi-Fi", value: "Connected" },
    { label: "Signal Strength", value: "Strong (−52 dBm)" },
    { label: "Firmware", value: "v1.0.0" },
    { label: "Hardware", value: "ESP32" },
  ];
  const sensors = [
    { label: "Current Sensors", value: "ACS712 × 2 (20A)" },
    { label: "Voltage Sensor", value: "ZMPT101B × 1" },
    { label: "Relay Module", value: "2-Channel 5V" },
    { label: "Socket 1", value: "Connected · Active" },
    { label: "Socket 2", value: "Connected · Active" },
  ];
  const actions = [
    { icon: Edit2, label: "Rename Device", desc: "Change display name", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { icon: Wifi, label: "Wi-Fi Settings", desc: "Configure network", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
    { icon: RefreshCw, label: "Restart Device", desc: "Soft reboot ESP32", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { icon: Download, label: "Update Firmware", desc: "Check for updates", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-display font-bold text-white">Smart Extension</h2>
        <p className="text-slate-400 text-sm mt-1">Hardware details and device management.</p>
      </div>

      <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "rgba(16,185,129,0.2)" }}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Cpu size={26} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white">Smart Energy Guardian #001</h3>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status="online" size="sm" />
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Signal size={12} className="text-emerald-400" /> Strong signal
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {specs.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
              <span className="text-xs text-slate-400">{label}</span>
              <span className="text-xs font-medium text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <h3 className="text-sm font-display font-semibold text-white mb-4 flex items-center gap-2">
          <Settings size={15} className="text-slate-400" /> Sensors & Hardware
        </h3>
        <div className="space-y-2">
          {sensors.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
              <span className="text-xs text-slate-400">{label}</span>
              <span className="text-xs font-mono text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ icon: Icon, label, desc, color, bg }) => (
          <button key={label} className={`p-4 rounded-2xl border text-left hover:opacity-80 transition-opacity ${bg}`}>
            <Icon size={18} className={`${color} mb-2`} />
            <p className={`text-sm font-medium ${color}`}>{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
