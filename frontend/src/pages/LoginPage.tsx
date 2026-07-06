import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Button, Card } from "../components/Common.js";
import { Toast, useToast } from "../components/Toast.js";
import { api } from "../services/api.js";
import {
  extractBrandingFromConfig,
  getStoredBranding,
  persistBranding,
  type BrandingData,
} from "../utils/branding.js";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<BrandingData | null>(() =>
    getStoredBranding(),
  );
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, setToast } = useToast();

  React.useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await api.get<any>("/config");
        const configData = response.data.data || response.data;
        const nextBranding = extractBrandingFromConfig(configData);
        setBranding(nextBranding);
        persistBranding(nextBranding);
      } catch (error) {
        console.error("Erro ao carregar identidade visual:", error);
      }
    };

    loadBranding();
  }, []);

  React.useEffect(() => {
    const routeState = location.state as
      | {
          toast?: {
            message: string;
            type: "success" | "error" | "info" | "warning";
          };
        }
      | undefined;

    if (routeState?.toast) {
      showToast(routeState.toast.message, routeState.toast.type);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, showToast]);

  const tituloSistema = `Ordem Franciscana Secular${branding?.nomeFraternidade ? ` - ${branding.nomeFraternidade}` : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, senha);
      showToast("Login realizado com sucesso!", "success");

      // Redirecionar baseado no role
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.role === "ADMIN_REGIONAL" || user.role === "ADMIN") {
          navigate("/admin/fraternidades");
          return;
        }

        if (user.role === "ADMIN_LOCAL") {
          navigate("/admin/membros");
          return;
        }

        navigate("/member/profile");
      }, 500);
    } catch (error: any) {
      showToast(error.message || "Erro ao fazer login", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(255,214,153,0.18),_transparent_26%)] pointer-events-none" />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-md">
        <Card className="w-full bg-white/85 backdrop-blur-xl border border-white/60 shadow-2xl shadow-black/10 rounded-3xl p-8 relative z-10">
        <div className="text-center mb-8">
          {branding?.logoBase64 ? (
            <img
              src={branding.logoBase64}
              loading="eager"
              decoding="async"
              alt="Logo do sistema"
              className="w-18 h-18 rounded-full object-cover mx-auto mb-3 ring-4 ring-primary-100 shadow-lg"
            />
          ) : (
            <div className="w-18 h-18 rounded-full mx-auto mb-3 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-4xl text-white shadow-lg">
              🕊️
            </div>
          )}
          <h2 className="text-3xl font-extrabold text-gray-900">OFS</h2>
          <p className="text-gray-600 text-sm mt-1">{tituloSistema}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={showSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showSenha ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 3C5.522 3 1.732 5.943.458 10c.3.959.774 1.877 1.403 2.734l1.414-1.414A6 6 0 1110 9a1 1 0 00-2 0 4 4 0 11-4.414-4.414L3.293 3.293zM15.172 13.338A7 7 0 1010 5a1 1 0 102 0c0-3.866-3.134-7-7-7a7 7 0 100 14 7 7 0 005.172-2.338z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full py-3 text-base"
          >
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Não tem conta?{" "}
          <Link
            to="/register"
            className="text-primary-600 hover:underline font-semibold"
          >
            Cadastre-se
          </Link>
        </p>

        <p className="text-center text-xs text-gray-500 mt-4">
          Produzido por{" "}
          <a
            href="https://www.linkedin.com/in/wesley-soares-64154a239/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary-700 hover:underline"
          >
            WSWEB
          </a>
        </p>
        </Card>
      </div>
    </div>
  );
};
