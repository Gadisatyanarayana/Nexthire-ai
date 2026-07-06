import { LANGUAGE_TO_RUNTIME_ID, RUNTIME_ID_TO_LANGUAGE } from "./types";
import type { InternalLanguageId, SupportedLanguage } from "./types";

export function resolveLanguage(input: unknown, explicitLanguageId?: unknown): SupportedLanguage | null {
  if (typeof explicitLanguageId === "number" && Number.isFinite(explicitLanguageId)) {
    return RUNTIME_ID_TO_LANGUAGE[explicitLanguageId] || null;
  }

  if (typeof input === "number" && Number.isFinite(input)) {
    return RUNTIME_ID_TO_LANGUAGE[input] || null;
  }

  const normalized = String(input || "").trim().toLowerCase();
  if (!normalized) return null;

  if (/^\d+$/.test(normalized)) {
    const id = Number(normalized);
    return RUNTIME_ID_TO_LANGUAGE[id] || null;
  }

  if (normalized in LANGUAGE_TO_RUNTIME_ID) {
    return normalized as SupportedLanguage;
  }

  return null;
}

export function languageToRuntimeId(language: SupportedLanguage): InternalLanguageId {
  return LANGUAGE_TO_RUNTIME_ID[language];
}
