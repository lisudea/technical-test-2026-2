const STATUS_STYLES = {
  disponible: { dot: "bg-okgreen shadow-[0_0_8px_2px_rgba(61,220,132,0.6)]", text: "text-okgreen", ring: "border-okgreen/30" },
  reservado: { dot: "bg-rose shadow-[0_0_8px_2px_rgba(239,91,91,0.6)]", text: "text-rose", ring: "border-rose/30" },
  mantenimiento: { dot: "bg-gray-400 shadow-[0_0_6px_1px_rgba(156,163,175,0.5)]", text: "text-gray-400", ring: "border-gray-500/30" },
};

export default function StatusLed({ estado, label }) {
  const style = STATUS_STYLES[estado] || STATUS_STYLES.mantenimiento;
  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border ${style.ring} bg-black/20`}>
      <span className={`w-2 h-2 rounded-full ${style.dot} led-live`} />
      <span className={`font-mono text-[11px] uppercase tracking-wide ${style.text}`}>{label}</span>
    </div>
  );
}
