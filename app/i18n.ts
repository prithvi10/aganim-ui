import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

const enTyped = en as Record<string, unknown>;
const jaTyped = ja as Record<string, unknown>;

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
      rewriter: enTyped.rewriter as Record<string, string>,
      missions: enTyped.missions as Record<string, string>,
    },
    ja: {
      translation: ja,
      rewriter: jaTyped.rewriter as Record<string, string>,
      missions: jaTyped.missions as Record<string, string>,
    },
  },
  ns: ["translation", "rewriter", "missions"],
  defaultNS: "translation",
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
