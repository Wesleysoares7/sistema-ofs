import React from "react";
import { Link } from "react-router-dom";

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-slate-100 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Politica de Privacidade e Cookies
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
          Esta pagina explica como o Sistema OFS utiliza cookies para melhorar a navegacao, manter sua sessao ativa e entender o uso geral da aplicacao.
        </p>

        <section className="mt-6 space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
          <p>
            Cookies essenciais podem ser utilizados para autenticacao e seguranca. Cookies opcionais podem ser usados para analise e melhoria continua da experiencia.
          </p>
          <p>
            Ao clicar em Aceitar, voce concorda com o uso de cookies conforme esta politica. Ao clicar em Recusar, apenas os recursos minimos necessarios para funcionamento poderao ser mantidos.
          </p>
          <p>
            Voce pode alterar sua decisao limpando os dados do navegador e escolhendo novamente quando o aviso for exibido.
          </p>
        </section>

        <div className="mt-8">
          <Link
            to="/login"
            className="inline-flex items-center rounded-lg border border-slate-500/50 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-300 hover:text-white"
          >
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
};
