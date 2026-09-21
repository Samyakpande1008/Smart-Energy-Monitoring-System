import { useState, useEffect } from "react";
import { User, Bell, DollarSign, Cpu, Brain, Timer, Shield, LogOut, ChevronRight, Check } from "lucide-react";
import { api, getStoredUser, clearToken } from "../services/api";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${value ? "bg-blue-600" : "bg-white/10"}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function Section({ icon: Icon, label, children }: any) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <Icon size={16} className="text-slate-400" />
        <p className="text-sm font-display font-semibold text-white">{label}</p>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-colors">
      <div>
        <p className="text-sm text-white">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export default function Settings({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState(() => getStoredUser() || { name: "Vishwajeet", email: "vishwajeet@example.com" });
  const [tariff, setTariff] = useState("8.5");
  const [notifPush, setNotifPush] = useState(true);
  const [notifAnomaly, setNotifAnomaly] = useState(true);
  const [notifAutoOff, setNotifAutoOff] = useState(false);
  const [aiRec, setAiRec] = useState(true);
  const [aiLearn, setAiLearn] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.devices.getSettings(1)
      .then(s => {
        if (!isMounted || !s) return;
        if (s.tariff !== undefined) setTariff(String(s.tariff));
        if (s.push_notifications !== undefined) setNotifPush(s.push_notifications);
        if (s.anomaly_alerts !== undefined) setNotifAnomaly(s.anomaly_alerts);
        if (s.auto_off_alerts !== undefined) setNotifAutoOff(s.auto_off_alerts);
        if (s.ai_recommendations_enabled !== undefined) setAiRec(s.ai_recommendations_enabled);
        if (s.pattern_learning_enabled !== undefined) setAiLearn(s.pattern_learning_enabled);
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  const saveSettings = async (updates: any = {}) => {
    try {
      const payload = {
        tariff: updates.tariff !== undefined ? parseFloat(updates.tariff) : parseFloat(tariff),
        push_notifications: updates.notifPush !== undefined ? updates.notifPush : notifPush,
        anomaly_alerts: updates.notifAnomaly !== undefined ? updates.notifAnomaly : notifAnomaly,
        auto_off_alerts: updates.notifAutoOff !== undefined ? updates.notifAutoOff : notifAutoOff,
        ai_recommendations_enabled: updates.aiRec !== undefined ? updates.aiRec : aiRec,
        pattern_learning_enabled: updates.aiLearn !== undefined ? updates.aiLearn : aiLearn
      };
      await api.devices.updateSettings(1, payload);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      console.warn("Failed to persist settings:", err);
    }
  };

  const handleLogoutClick = () => {
    clearToken();
    onLogout();
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-white">Settings</h2>
          <p className="text-slate-400 text-sm mt-1">Account, device, and AI configuration.</p>
        </div>
        {savedNotice && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <Check size={14} /> Saved
          </div>
        )}
      </div>

      <Section icon={User} label="Profile">
        <Row label="Name" desc="Display name" right={<span className="text-sm text-slate-400">{user.name}</span>} />
        <Row label="Email" right={<span className="text-sm text-slate-400">{user.email}</span>} />
        <Row label="Change Password" right={<ChevronRight size={15} className="text-slate-500" />} />
      </Section>

      <Section icon={Bell} label="Notifications">
        <Row label="Push Notifications" desc="Real-time alerts" right={<Toggle value={notifPush} onChange={v => { setNotifPush(v); saveSettings({ notifPush: v }); }} />} />
        <Row label="Anomaly Alerts" desc="Unusual consumption detected" right={<Toggle value={notifAnomaly} onChange={v => { setNotifAnomaly(v); saveSettings({ notifAnomaly: v }); }} />} />
        <Row label="Auto-OFF Events" right={<Toggle value={notifAutoOff} onChange={v => { setNotifAutoOff(v); saveSettings({ notifAutoOff: v }); }} />} />
      </Section>

      <Section icon={DollarSign} label="Energy Tariff">
        <div className="px-5 py-4">
          <p className="text-xs text-slate-400 mb-2">Electricity tariff (used for bill estimation)</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">₹</span>
            <input
              type="number"
              value={tariff}
              onChange={e => setTariff(e.target.value)}
              onBlur={() => saveSettings({ tariff })}
              className="w-24 px-3 py-2 rounded-lg border text-sm text-white outline-none focus:border-blue-500/60 transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", borderColor: "var(--border)" }}
              step="0.1"
            />
            <span className="text-sm text-slate-400">/ kWh</span>
          </div>
        </div>
        <Row label="Currency" right={<span className="text-sm text-slate-400">INR (₹)</span>} />
      </Section>

      <Section icon={Brain} label="AI Settings">
        <Row label="AI Recommendations" desc="Show energy-saving suggestions" right={<Toggle value={aiRec} onChange={v => { setAiRec(v); saveSettings({ aiRec: v }); }} />} />
        <Row label="Pattern Learning" desc="Allow ML model to learn from usage" right={<Toggle value={aiLearn} onChange={v => { setAiLearn(v); saveSettings({ aiLearn: v }); }} />} />
        <Row label="Model Version" right={<span className="text-xs font-mono text-purple-400">v1.0.0-production (Random Forest)</span>} />
      </Section>

      <Section icon={Timer} label="Auto-OFF Settings">
        <Row label="Configure Rules" right={<ChevronRight size={15} className="text-slate-500" />} />
      </Section>

      <Section icon={Cpu} label="Device Settings">
        <Row label="Device Name" right={<span className="text-sm text-slate-400">Smart Energy Guardian #001</span>} />
        <Row label="Firmware" right={<span className="text-xs font-mono text-emerald-400">v1.0.0 · Up to date</span>} />
      </Section>

      <Section icon={Shield} label="Data & Privacy">
        <Row label="Data Collection" desc="Sensor data stored in local MySQL" right={<span className="text-xs text-emerald-400">Local MySQL</span>} />
        <Row label="Delete My Data" right={<ChevronRight size={15} className="text-red-500/60" />} />
      </Section>

      <button onClick={handleLogoutClick} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/5 transition-colors text-sm font-medium cursor-pointer">
        <LogOut size={15} /> Logout
      </button>
    </div>
  );
}
