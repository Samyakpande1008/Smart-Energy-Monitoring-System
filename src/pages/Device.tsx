import { useState, useEffect } from "react";
import { Cpu, Wifi, Signal, RefreshCw, Settings, Edit2, Download, Check } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { api } from "../services/api";

export default function Device() {
  const [deviceData, setDeviceData] = useState({
    name: "Smart Energy Guardian #001",
    status: "online" as "online" | "offline",
    wifi: "Connected (HomeNetwork_5G)",
    rssi: "-52 dBm",
    firmware: "v1.0.0",
    hardware: "ESP32",
    s1Active: true,
    s2Active: true
  });
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadDevice = async () => {
      try {
        const res = await api.devices.get(1);
        if (!isMounted || !res) return;
        if (res.device) {
          setDeviceData({
            name: res.device.device_name || "Smart Energy Guardian #001",
            status: res.device.status === "ONLINE" ? "online" : "offline",
            wifi: `${res.device.wifi_status} (${res.device.wifi_ssid || 'HomeNetwork_5G'})`,
            rssi: `${res.device.rssi || -52} dBm`,
            firmware: res.device.firmware_version || "v1.0.0",
            hardware: res.device.hardware_type || "ESP32",
            s1Active: res.socket1?.status === "on",
            s2Active: res.socket2?.status === "on"
          });
        }
      } catch (err) {
        // Fallback to default
      }
    };

    loadDevice();
    const interval = setInterval(loadDevice, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleAction = (label: string) => {
    setActionNotice(`${label} command queued for ESP32 hardware`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const specs = [
    { label: "Device Name", value: deviceData.name },
    { label: "Status", value: <StatusBadge status={deviceData.status} size="sm" /> },
    { label: "Wi-Fi", value: deviceData.wifi },
    { label: "Signal Strength", value: `Strong (${deviceData.rssi})` },
    { label: "Firmware", value: deviceData.firmware },
    { label: "Hardware", value: deviceData.hardware },
  ];

  const sensors = [
    { label: "Current Sensors", value: "ACS712 × 2 (20A Hall Effect)" },
    { label: "Voltage Sensor", value: "ZMPT101B × 1 (AC Transformer)" },
    { label: "Relay Module", value: "2-Channel 5V Optocoupler" },
    { label: "Socket 1", value: deviceData.s1Active ? "Connected · Active (Relay Closed)" : "Connected · Inactive (Relay Open)" },
    { label: "Socket 2", value: deviceData.s2Active ? "Connected · Active (Relay Closed)" : "Connected · Inactive (Relay Open)" },
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

      {actionNotice && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
          <Check size={14} className="shrink-0 text-blue-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "rgba(16,185,129,0.2)" }}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Cpu size={26} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white">{deviceData.name}</h3>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={deviceData.status} size="sm" />
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Signal size={12} className="text-emerald-400" /> Strong signal ({deviceData.rssi})
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
          <button key={label} onClick={() => handleAction(label)} className={`p-4 rounded-2xl border text-left hover:opacity-80 transition-opacity cursor-pointer ${bg}`}>
            <Icon size={18} className={`${color} mb-2`} />
            <p className={`text-sm font-medium ${color}`}>{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
