const GOOGLE_SCRIPT_ID = "lisource-google-identity";

let googleScriptPromise: Promise<void> | null = null;

export function googleClientId() {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? "";
}

export function hasGoogleClientId() {
  return googleClientId().length > 0;
}

export function loadGoogleIdentityScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity Services can only load in the browser"));
  }
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Unable to load Google Identity Services")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Unable to load Google Identity Services"));
    document.head.appendChild(script);
  }).finally(() => {
    if (!window.google?.accounts?.id) googleScriptPromise = null;
  });

  return googleScriptPromise;
}
