import { useState, useEffect } from "react";
import { Timer, ShieldAlert, Clock, Zap, AlertTriangle } from "lucide-react";
import { api } from "../services/api";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${value ? "bg-blue-600" : "bg-white/10"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function Rule({ icon: Icon, iconColor, title, desc, enabled, onToggle, children }: any) {
  return (
    <div className="p-4 rounded-xl border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "var(--border)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center shrink-0`}>
            <Icon size={15} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
          </div>
        </div>
        <Toggle value={enabled} onChange={onToggle} />
      </div>
      {enabled && children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default function AutoOff() {
  const [master, setMaster] = useState(true);
  const [s1, setS1] = useState(true);
  const [s2, setS2] = useState(false);
  const [r1, setR1] = useState(true);
  const [r2, setR2] = useState(true);
  const [r3, setR3] = useState(false);
  const [threshold, setThreshold] = useState(150);
  const [duration, setDuration] = useState(30);
  const [confidence, setConfidence] = useState(85);
  const [historyList, setHistoryList] = useState<any[]>([
    { time: "Today 10:42 AM", socket: "Socket 2", reason: "Unusual power consumption" },
    { time: "Yesterday 11:30 PM", socket: "Socket 1", reason: "Extended inactivity" },
  ]);

  // Fetch settings from backend
  useEffect(() => {
    let isMounted = true;
    api.devices.getSettings(1)
      .then(s => {
        if (isMounted && s) {
          setMaster(s.master_auto_off ?? true);
          setS1(s.socket1_auto_off ?? true);
          setS2(s.socket2_auto_off ?? false);
          setR1(s.rule_power_threshold_enabled ?? true);
          setR2(s.rule_inactivity_enabled ?? true);
          setR3(s.rule_ml_anomaly_enabled ?? false);
          if (s.power_threshold_w) setThreshold(s.power_threshold_w);
          if (s.inactive_duration_min) setDuration(s.inactive_duration_min);
          if (s.anomaly_confidence_threshold) setConfidence(s.anomaly_confidence_threshold);
        }
      })
      .catch(() => {});

    api.devices.getHistory(1)
      .then(res => {
        if (isMounted && res && res.events) {
          const autoOffs = res.events
            .filter((e: any) => e.type === "autooff")
            .map((e: any) => ({
              time: e.time,
              socket: e.title.includes("Socket 1") ? "Socket 1" : "Socket 2",
              reason: e.title.replace(/Socket \d auto-OFF:\s*/i, "")
            }));
          if (autoOffs.length > 0) {
            setHistoryList(autoOffs);
          }
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Save settings when modified
  const saveSettings = async (updates: Partial<{
    master: boolean; s1: boolean; s2: boolean; r1: boolean; r2: boolean; r3: boolean;
    threshold: number; duration: number; confidence: number;
  }>) => {
    const payload = {
      master_auto_off: updates.master !== undefined ? updates.master : master,
      socket1_auto_off: updates.s1 !== undefined ? updates.s1 : s1,
      socket2_auto_off: updates.s2 !== undefined ? updates.s2 : s2,
      rule_power_threshold_enabled: updates.r1 !== undefined ? updates.r1 : r1,
      power_threshold_w: updates.threshold !== undefined ? updates.threshold : threshold,
      rule_inactivity_enabled: updates.r2 !== undefined ? updates.r2 : r2,
      inactive_duration_min: updates.duration !== undefined ? updates.duration : duration,
      rule_ml_anomaly_enabled: updates.r3 !== undefined ? updates.r3 : r3,
      anomaly_confidence_threshold: updates.confidence !== undefined ? updates.confidence : confidence
    };

    try {
      await api.devices.updateSettings(1, payload);
    } catch (err) {
      console.warn("Failed to persist auto-off settings:", err);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-display font-bold text-white">Smart Auto-OFF</h2>
        <p className="text-slate-400 text-sm mt-1">Let AI help reduce unnecessary energy consumption.</p>
      </div>

      <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: master ? "rgba(59,130,246,0.3)" : "var(--border)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center">
              <Timer size={22} className="text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-display font-bold text-white">Smart Auto-OFF</p>
              <p className="text-xs text-slate-400">Master control for all sockets</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-mono font-bold ${master ? "text-blue-400" : "text-slate-500"}`}>{master ? "ON" : "OFF"}</span>
            <Toggle value={master} onChange={v => { setMaster(v); saveSettings({ master: v }); }} />
          </div>
        </div>
        {master && (
          <div className="grid grid-cols-2 gap-3 mt-5">
            {[{ label: "Socket 1", desc: "Fan · Managed by AI", value: s1, onChange: (v: boolean) => { setS1(v); saveSettings({ s1: v }); } },
              { label: "Socket 2", desc: "Laptop · Managed by AI", value: s2, onChange: (v: boolean) => { setS2(v); saveSettings({ s2: v }); } }].map(({ label, desc, value, onChange }) => (
              <div key={label} className="p-3 rounded-xl flex items-center justify-between border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--border)" }}>
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
                <Toggle value={value} onChange={onChange} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-display font-semibold text-white">Automation Rules</h3>
        <Rule icon={AlertTriangle} iconColor="bg-amber-500/10 text-amber-400"
          title="Unusual Power Consumption" desc="Trigger when power exceeds normal range"
          enabled={r1} onToggle={(v: boolean) => { setR1(v); saveSettings({ r1: v }); }}>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Threshold</span>
              <span className="text-amber-400 font-mono">{threshold} W</span>
            </div>
            <input type="range" min={50} max={500} value={threshold} 
              onChange={e => { setThreshold(+e.target.value); saveSettings({ threshold: +e.target.value }); }}
              className="w-full accent-amber-500 cursor-pointer" />
          </div>
        </Rule>
        <Rule icon={Clock} iconColor="bg-blue-500/10 text-blue-400"
          title="Appliance Inactive for Extended Period" desc="Trigger after no-load period"
          enabled={r2} onToggle={(v: boolean) => { setR2(v); saveSettings({ r2: v }); }}>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Duration</span>
              <span className="text-blue-400 font-mono">{duration} minutes</span>
            </div>
            <input type="range" min={5} max={120} value={duration} 
              onChange={e => { setDuration(+e.target.value); saveSettings({ duration: +e.target.value }); }}
              className="w-full accent-blue-500 cursor-pointer" />
          </div>
        </Rule>
        <Rule icon={Zap} iconColor="bg-purple-500/10 text-purple-400"
          title="AI-Detected Abnormal Usage" desc="Trigger on high anomaly score from ML model"
          enabled={r3} onToggle={(v: boolean) => { setR3(v); saveSettings({ r3: v }); }}>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Minimum Confidence</span>
              <span className="text-purple-400 font-mono">{confidence}%</span>
            </div>
            <input type="range" min={50} max={99} value={confidence} 
              onChange={e => { setConfidence(+e.target.value); saveSettings({ confidence: +e.target.value }); }}
              className="w-full accent-purple-500 cursor-pointer" />
          </div>
        </Rule>
        <div className="p-4 rounded-xl border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Zap size={15} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Maximum Current Safety Limit</p>
                <p className="text-xs text-slate-400">Hardware-enforced; cannot be disabled remotely</p>
              </div>
            </div>
            <span className="text-sm font-mono font-bold text-red-400">6 A</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl border" style={{ background: "rgba(59,130,246,0.05)", borderColor: "rgba(59,130,246,0.2)" }}>
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-300 mb-1">Safety First</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Critical electrical safety limits are handled locally by the ESP32 and do not depend on internet connectivity.
              The maximum current limit (6A) and hardware overcurrent protection are always active regardless of software settings.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <h3 className="text-sm font-display font-semibold text-white mb-4">Auto-OFF History</h3>
        <div className="space-y-3">
          {historyList.map((h, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Timer size={14} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{h.socket} automatically turned OFF</p>
                <p className="text-xs text-slate-400 mt-0.5">Reason: {h.reason}</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">{h.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
