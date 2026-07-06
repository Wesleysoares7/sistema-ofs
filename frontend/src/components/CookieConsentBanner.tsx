import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "ofs_cookie_consent_v1";

type CookieConsentValue = "accepted" | "rejected";

export const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const storedChoice = localStorage.getItem(COOKIE_CONSENT_KEY);
    setVisible(!storedChoice);
  }, []);

  const saveChoice = (value: CookieConsentValue) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/15 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
          <div>
            <p className="text-sm leading-relaxed text-slate-200 sm:text-[15px]">
              Utilizamos cookies para melhorar sua experiencia e analisar o uso do sistema. Voce pode aceitar ou recusar.
            </p>
            <Link
              to="/politica-de-privacidade"
              className="mt-2 inline-block text-xs font-semibold text-slate-300 underline decoration-slate-500 underline-offset-2 transition hover:text-white"
            >
              Politica de Privacidade
            </Link>
          </div>

          <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => saveChoice("rejected")}
              className="flex-1 rounded-lg border border-slate-500/60 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-300 hover:text-white sm:flex-none"
            >
              Recusar
            </button>
            <button
              type="button"
              onClick={() => saveChoice("accepted")}
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 sm:flex-none"
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
