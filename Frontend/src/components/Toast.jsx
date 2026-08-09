export default function Toast({ message, kind = "success", onClose }) {
  if (!message) return null;
  const styles =
    kind === "success"
      ? "border-okgreen/40 bg-okgreen/10 text-okgreen"
      : "border-rose/40 bg-rose/10 text-rose";

  return (
    <div className={`fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-lg border font-mono text-xs shadow-lg ${styles}`}>
      <div className="flex items-start gap-2">
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="opacity-70 hover:opacity-100 leading-none">×</button>
      </div>
    </div>
  );
}
