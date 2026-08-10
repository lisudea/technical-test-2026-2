import { RouterProvider } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleAuthProvider } from "@/context/GoogleAuthContext";
import { router } from "./app/routes";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

if (!GOOGLE_CLIENT_ID && import.meta.env.DEV) {
  console.warn(
    "VITE_GOOGLE_CLIENT_ID no está definido. Revisa tu archivo .env en la raíz del proyecto."
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleAuthProvider>
        <RouterProvider router={router} />
      </GoogleAuthProvider>
    </GoogleOAuthProvider>
  );
}
