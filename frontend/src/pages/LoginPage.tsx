import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Button, Card } from "../components/Common.js";
import { Toast, useToast } from "../components/Toast.js";
import { api } from "../services/api.js";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<{
    nomeFraternidade?: string;
    logoBase64?: string;
  } | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, setToast } = useToast();

  React.useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await api.get<any>("/config");
        const configData = response.data.data || response.data;
        setBranding({
          nomeFraternidade: configData.nomeFraternidade,
          logoBase64: configData.logoBase64,
        });
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
        if (user.role === "ADMIN") {
          navigate("/admin");
        } else if (user.role === "MEMBER") {
          navigate("/member");
        }
      }, 500);
    } catch (error: any) {
      showToast(error.message || "Erro ao fazer login", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          {branding?.logoBase64 ? (
            <img
              src={branding.logoBase64}
              alt="Logo do sistema"
              className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
            />
          ) : (
            <h1 className="text-4xl font-bold mb-2">🕊️</h1>
          )}
          <h2 className="text-2xl font-bold text-gray-800">OFS</h2>
          <p className="text-gray-600 text-sm">
            {tituloSistema}
          </p>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showSenha ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 3C5.522 3 1.732 5.943.458 10c.3.959.774 1.877 1.403 2.734l1.414-1.414A6 6 0 1110 9a1 1 0 00-2 0 4 4 0 11-4.414-4.414L3.293 3.293zM15.172 13.338A7 7 0 1010 5a1 1 0 102 0c0-3.866-3.134-7-7-7a7 7 0 100 14 7 7 0 005.172-2.338z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
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
  );
};
