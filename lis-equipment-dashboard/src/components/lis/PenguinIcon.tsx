export function PenguinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <ellipse cx="24" cy="27" rx="12" ry="16" fill="#1f2937" />
      <ellipse cx="24" cy="30" rx="7" ry="11" fill="#ffffff" />
      <path
        d="M13 18c-4 2-6 8-4 14"
        stroke="#1f2937"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        className="origin-[13px_18px] animate-[wing-wave-left_1.6s_ease-in-out_infinite]"
      />
      <path
        d="M35 18c4 2 6 8 4 14"
        stroke="#1f2937"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        className="origin-[35px_18px] animate-[wing-wave-right_1.6s_ease-in-out_infinite]"
      />
      <circle cx="20" cy="16" r="1.6" fill="#111827" />
      <circle cx="28" cy="16" r="1.6" fill="#111827" />
      <path d="M22 18.5h4l-2 3-2-3Z" fill="#f59e0b" />
      <ellipse cx="19" cy="43" rx="4" ry="2" fill="#f59e0b" />
      <ellipse cx="29" cy="43" rx="4" ry="2" fill="#f59e0b" />
    </svg>
  );
}