// Variante "big": cuadro de color con el número grande (Tablero / Equipos)
export function StatCardBig({ value, label, tone = "teal" }) {
  return (
    <div className="stat-card">
      <div className={`stat-number-badge tone-${tone}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// Variante "icon": ícono pequeño + número grande + ícono de gráfica arriba a la derecha
// (Estadísticas)
export function StatCardIcon({ value, label, icon: Icon, tone = "teal" }) {
  return (
    <div className="stat-card stat-card-icon">
      <div className="stat-card-icon-row">
        <div className={`stat-icon-badge tone-${tone}`}>
          <Icon size={20} />
        </div>
        <div className="stat-trend-badge">
          <TrendGlyph />
        </div>
      </div>
      <div className="stat-value-lg">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function TrendGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 7h7v7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
