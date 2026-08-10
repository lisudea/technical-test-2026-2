import { t as es } from "./es";
import { t as en } from "./en";

export type Locale = "es" | "en";
export type Translations = typeof es;

export const translations: Record<Locale, Translations> = { es, en };
