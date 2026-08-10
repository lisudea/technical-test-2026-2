import { RouterProvider } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleAuthProvider } from "@/context/GoogleAuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { router } from "./app/routes";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export default function App() {
  return (
    <LanguageProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <GoogleAuthProvider>
          <RouterProvider router={router} />
        </GoogleAuthProvider>
      </GoogleOAuthProvider>
    </LanguageProvider>
  );
}
