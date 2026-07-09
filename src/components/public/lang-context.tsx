"use client";

import * as React from "react";

export type Lang = "en" | "ar";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = React.createContext<LangContextValue>({
  lang: "en",
  setLang: () => undefined,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = React.useState<Lang>("en");
  const value = React.useMemo(() => ({ lang, setLang }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  return React.useContext(LangContext);
}
