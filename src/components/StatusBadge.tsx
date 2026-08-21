interface Props {
  status: "on" | "off" | "online" | "offline" | "warning";
  size?: "sm" | "md";
}

const config = {
  on: { dot: "bg-emerald-400", text: "text-emerald-400", label: "ON" },
  online: { dot: "bg-emerald-400", text: "text-emerald-400", label: "ONLINE" },
  off: { dot: "bg-red-500", text: "text-red-400", label: "OFF" },
  offline: { dot: "bg-red-500", text: "text-red-400", label: "OFFLINE" },
  warning: { dot: "bg-amber-400", text: "text-amber-400", label: "WARNING" },
};

export default function StatusBadge({ status, size = "md" }: Props) {
  const c = config[status];
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-medium ${c.text} ${textSize}`}>
      <span className={`${dotSize} rounded-full ${c.dot} animate-pulse`} />
      {c.label}
    </span>
  );
}
