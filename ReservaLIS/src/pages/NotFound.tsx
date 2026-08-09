import { Link } from "react-router";
import { t } from "@/i18n/es";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">🐧</div>
      <h1 className="text-2xl font-bold text-[#0E2A36] mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
        {t.notFound.title}
      </h1>
      <p className="text-[#6B8A94] mb-6">{t.notFound.msg}</p>
      <Link
        to="/"
        className="px-6 py-2.5 rounded-xl bg-[#1B7A80] text-white font-semibold text-sm hover:bg-[#0E2A36] transition-colors"
      >
        {t.notFound.back}
      </Link>
    </div>
  );
}
