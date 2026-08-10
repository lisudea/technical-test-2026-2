export default function StatusBadge({ label, tone }) {
  return (
    <span className={`status-badge tone-${tone}`}>
      <span className="status-dot" />
      {label}
    </span>
  );
}
