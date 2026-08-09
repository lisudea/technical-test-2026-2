import { useState } from "react";
import { useNavigate } from "react-router";
import logoImg from "@/imports/LOGO.png";
import { t } from "@/i18n/es";

const DEMO_EMAIL = "admin@lis.udea.edu.co";
const DEMO_PASS = "admin123";

type State = "idle" | "loading" | "error";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<State>("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");

    setTimeout(() => {
      if (email === DEMO_EMAIL && password === DEMO_PASS) {
        sessionStorage.setItem("lis_admin", "true");
        navigate("/admin");
      } else {
        setState("error");
      }
    }, 900);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#DDE5E8] shadow-sm p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img src={logoImg} alt="LIS" className="w-16 h-16 object-contain rounded-full mb-3" />
            <h1
              className="text-xl font-bold text-[#0E2A36]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {t.login.title}
            </h1>
            <p className="text-sm text-[#6B8A94] mt-1 text-center">{t.login.subtitle}</p>
          </div>

          {state === "error" && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
              ❌ {t.login.errorCredenciales}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.login.correo}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
                placeholder={DEMO_EMAIL}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.login.contrasena}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={state === "loading"}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-[#1B7A80] text-white hover:bg-[#0E2A36] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {state === "loading" ? t.login.submitting : t.login.submit}
            </button>
          </form>

          <p className="text-center text-xs text-[#6B8A94] mt-6 bg-[#F4F7F8] rounded-lg px-3 py-2">
            💡 {t.login.demo}
          </p>
        </div>
      </div>
    </div>
  );
}
