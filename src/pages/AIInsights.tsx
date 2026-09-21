import { useState, useEffect } from "react";
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Info, Timer, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../services/api";

const DEFAULT_PRED_DATA = [
  { t: "6am", actual: 0.2, predicted: 0.3 },
  { t: "8am", actual: 0.5, predicted: 0.6 },
  { t: "10am", actual: 1.1, predicted: 1.2 },
  { t: "12pm", actual: 1.7, predicted: 1.8 },
  { t: "2pm", actual: 2.1, predicted: 2.4 },
  { t: "4pm", actual: 2.34, predicted: 2.8 },
  { t: "6pm", actual: null, predicted: 3.2 },
];

function SectionCard({ icon: Icon, iconColor, badge, title, children }: any) {
  return (
    <div className="rounded-2xl border p-5 md:p-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl ${iconColor} flex items-center justify-center`}>
          <Icon size={18} />
        </div>
        <div>
          <h3 className="font-display font-semibold text-white">{title}</h3>
          {badge && <span className="text-[10px] font-mono text-purple-300">{badge}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}

function ConfidenceBar({ label, appliance, confidence, socket }: any) {
  return (
    <div className="p-4 rounded-xl border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-slate-400 font-mono">{socket}</p>
          <p className="text-base font-display font-bold text-white uppercase">{appliance}</p>
        </div>
        <span className="text-xl font-mono font-bold text-purple-400">{confidence}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-700"
          style={{ width: `${confidence}%` }} />
      </div>
      <p className="text-[10px] text-slate-500 mt-2">Confidence score</p>
    </div>
  );
}

export default function AIInsights() {
  const [s1Appliance, setS1Appliance] = useState("Fan");
  const [s1Confidence, setS1Confidence] = useState(94);
  const [s2Appliance, setS2Appliance] = useState("Laptop");
  const [s2Confidence, setS2Confidence] = useState(91);

  const [predictedToday, setPredictedToday] = useState("3.20 kWh");
  const [actualToday, setActualToday] = useState("2.34 kWh");
  const [predictedMonthly, setPredictedMonthly] = useState("42.6 kWh");
  const [estMonthlyBill, setEstMonthlyBill] = useState("₹486");
  const [predConfidence, setPredConfidence] = useState(88);
  const [predCurve, setPredCurve] = useState(DEFAULT_PRED_DATA);

  const [anomalyInfo, setAnomalyInfo] = useState({
    hasAnomaly: true,
    socket: "Socket 2",
    normalRange: "40–80 W",
    currentReading: "126 W",
    duration: "8 minutes",
    score: 87,
    reason: "Unusual power consumption detected"
  });

  const [recommendations, setRecommendations] = useState<any[]>([
    {
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      text: "Your fan is consuming 14% more energy than its usual pattern. Consider checking for blade obstructions."
    },
    {
      icon: Timer,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      text: "Socket 2 has been active longer than normal. 2.3 hours past average daily runtime."
    },
    {
      icon: Zap,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      text: "Estimated saving this month: ₹72 if usage returns to baseline pattern."
    }
  ]);

  useEffect(() => {
    let isMounted = true;

    const fetchAIData = async () => {
      try {
        const [aiRes, devRes] = await Promise.all([
          api.devices.getAI(1),
          api.devices.get(1)
        ]);

        if (!isMounted) return;

        if (aiRes) {
          if (aiRes.applianceRecognition) {
            setS1Appliance(aiRes.applianceRecognition.socket1?.appliance || "Fan");
            setS1Confidence(aiRes.applianceRecognition.socket1?.confidence || 94);
            setS2Appliance(aiRes.applianceRecognition.socket2?.appliance || "Laptop");
            setS2Confidence(aiRes.applianceRecognition.socket2?.confidence || 91);
          }

          if (aiRes.energyPrediction) {
            const ep = aiRes.energyPrediction;
            if (ep.predicted_today_kwh) setPredictedToday(`${ep.predicted_today_kwh.toFixed(2)} kWh`);
            if (ep.predicted_monthly_kwh) setPredictedMonthly(`${ep.predicted_monthly_kwh.toFixed(1)} kWh`);
            if (ep.confidence) setPredConfidence(Math.round(ep.confidence));
            if (ep.hourly_curve && ep.hourly_curve.length > 0) setPredCurve(ep.hourly_curve);
          }

          if (aiRes.anomalyStatus) {
            setAnomalyInfo({
              hasAnomaly: aiRes.anomalyStatus.hasAnomaly,
              socket: aiRes.anomalyStatus.socket || "Socket 2",
              normalRange: aiRes.anomalyStatus.normalRange || "40–80 W",
              currentReading: aiRes.anomalyStatus.currentReading || "126 W",
              duration: aiRes.anomalyStatus.duration || "8 minutes",
              score: aiRes.anomalyStatus.score || 87,
              reason: aiRes.anomalyStatus.reason || "Consumption pattern deviates significantly"
            });
          }

          if (aiRes.recommendations && aiRes.recommendations.length > 0) {
            const icons = [TrendingUp, Timer, Zap];
            const mapped = aiRes.recommendations.map((r: any, idx: number) => ({
              icon: icons[idx % icons.length],
              color: r.color === "blue" ? "text-blue-400" : (r.color === "emerald" ? "text-emerald-400" : "text-amber-400"),
              bg: r.color === "blue" ? "bg-blue-500/10" : (r.color === "emerald" ? "bg-emerald-500/10" : "bg-amber-500/10"),
              text: r.text
            }));
            setRecommendations(mapped);
          }
        }

        if (devRes) {
          setActualToday(`${devRes.energyToday.toFixed(2)} kWh`);
          setEstMonthlyBill(`₹${devRes.monthlyBill.toFixed(0)}`);
        }
      } catch (err) {
        // Safe fallback
      }
    };

    fetchAIData();
    const interval = setInterval(fetchAIData, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl p-3 text-xs border" style={{ background: "#1a2340", borderColor: "var(--border)" }}>
        <p className="text-slate-400 mb-2 font-mono">{label}</p>
        {payload.map((p: any) => p.value !== null && (
          <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value} kWh</span></p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-display font-bold text-white">AI Energy Intelligence</h2>
        <p className="text-slate-400 text-sm mt-1">Your energy usage, understood by AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard icon={Brain} iconColor="bg-purple-500/15 text-purple-400" badge="ML MODEL v1.0 · LIVE INFERENCE" title="Appliance Recognition">
          <div className="space-y-3 mb-4">
            <ConfidenceBar socket="SOCKET 1" appliance={s1Appliance} confidence={s1Confidence} />
            <ConfidenceBar socket="SOCKET 2" appliance={s2Appliance} confidence={s2Confidence} />
          </div>
          <div className="p-4 rounded-xl border" style={{ background: "rgba(139,92,246,0.05)", borderColor: "rgba(139,92,246,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-purple-400" />
              <p className="text-xs font-medium text-purple-300">How AI identifies appliances</p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {["Voltage", "Current", "Power", "Variation", "Duration"].map(s => (
                <div key={s} className="text-center">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto mb-1">
                    <Zap size={12} className="text-purple-400" />
                  </div>
                  <p className="text-[9px] text-slate-400">{s}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-3">AI learns electrical signatures from sensor patterns with Random Forest classification.</p>
          </div>
        </SectionCard>

        <SectionCard icon={TrendingUp} iconColor="bg-cyan-500/15 text-cyan-400" badge="PREDICTIVE FORECASTING" title="Energy Consumption Prediction">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Predicted Today", value: predictedToday, color: "text-cyan-400" },
              { label: "Actual So Far", value: actualToday, color: "text-white" },
              { label: "Predicted Monthly", value: predictedMonthly, color: "text-blue-400" },
              { label: "Est. Monthly Bill", value: estMonthlyBill, color: "text-amber-400" },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-[10px] text-slate-400 mb-1">{m.label}</p>
                <p className={`text-lg font-display font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-400">Prediction confidence:</span>
            <div className="flex-1 h-1 rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${predConfidence}%` }} />
            </div>
            <span className="text-xs font-mono text-cyan-400">{predConfidence}%</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={predCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3, fill: "#06b6d4" }} connectNulls={false} />
              <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard icon={AlertTriangle} iconColor="bg-amber-500/15 text-amber-400" badge="REAL-TIME MONITORING" title="Anomaly Detection">
          {anomalyInfo.hasAnomaly ? (
            <div className="p-4 rounded-xl border border-amber-500/30 mb-4" style={{ background: "rgba(245,158,11,0.07)" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-400" />
                <p className="text-sm font-medium text-amber-300">Unusual consumption detected</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Socket", value: anomalyInfo.socket },
                  { label: "Normal Range", value: anomalyInfo.normalRange },
                  { label: "Current Reading", value: anomalyInfo.currentReading },
                  { label: "Duration", value: anomalyInfo.duration },
                ].map(m => (
                  <div key={m.label}>
                    <p className="text-[10px] text-slate-500">{m.label}</p>
                    <p className="text-sm font-mono font-bold text-white">{m.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-400">Anomaly Score</span>
                  <span className="text-amber-400 font-mono">{anomalyInfo.score}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500" style={{ width: `${anomalyInfo.score}%` }} />
                </div>
              </div>
              <button className="mt-4 w-full py-2 rounded-lg border border-amber-500/40 text-amber-400 text-xs font-medium hover:bg-amber-500/10 transition-colors cursor-pointer">
                Investigate →
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-500/20 mb-4" style={{ background: "rgba(16,185,129,0.05)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs text-emerald-400 font-medium">All sockets operating normally</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">No abnormal power spikes or current anomalies detected.</p>
            </div>
          )}

          <div className="p-3 rounded-xl border border-emerald-500/20" style={{ background: "rgba(16,185,129,0.05)" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-emerald-400 font-medium">Socket 1: No anomalies detected</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 flex items-center gap-1">
            <Info size={10} /> Smart Auto-OFF required to act automatically on anomalies.
          </p>
        </SectionCard>

        <SectionCard icon={Lightbulb} iconColor="bg-emerald-500/15 text-emerald-400" badge="AI-GENERATED SUGGESTIONS" title="Smart Recommendations">
          <div className="space-y-3 mb-4">
            {recommendations.map(({ icon: Icon, color, bg, text }, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={13} className={color} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer">
              Enable Smart Auto-OFF
            </button>
            <button className="flex-1 py-2.5 rounded-xl border text-xs text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer" style={{ borderColor: "var(--border)" }}>
              View Details
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
