import { GoogleLogin } from "@react-oauth/google";
import { useGoogleAuth } from "@/context/GoogleAuthContext";

interface Props {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export default function GoogleSignInButton({ onSuccess, onError }: Props) {
  const { setAuth } = useGoogleAuth();

  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-[11px] text-[#6B8A94] leading-snug">
        Requiere cuenta institucional <span className="font-semibold text-[#0E2A36]">@udea.edu.co</span>
      </p>
      <GoogleLogin
        onSuccess={(cred) => {
          if (cred.credential) {
            setAuth(cred.credential);
            onSuccess?.();
          } else {
            onError?.("No se pudo obtener el token de Google. Intenta de nuevo.");
          }
        }}
        onError={() => {
          onError?.("El inicio de sesión con Google falló. Asegúrate de usar tu cuenta @udea.edu.co.");
        }}
        theme="outline"
        size="medium"
        shape="rectangular"
        text="signin_with"
        hosted_domain="udea.edu.co"
      />
    </div>
  );
}
