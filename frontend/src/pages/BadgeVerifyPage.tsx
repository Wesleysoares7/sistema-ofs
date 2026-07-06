import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api.js";

interface BadgeVerifyResponse {
  valid: boolean;
  checkedAt: string;
  member: {
    nome: string;
    tipoMembro?: string | null;
    status: string;
    role: string;
    fraternidade: {
      nomeFraternidade: string;
      cidade: string;
      distrito: string;
    } | null;
  };
}

export const BadgeVerifyPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<BadgeVerifyResponse | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError("Token de validação não informado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await api.get<BadgeVerifyResponse>(`/auth/badge/verify/${token}`);
        setData(response.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.error ||
            "Não foi possível validar este crachá.",
        );
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-800 to-primary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Validação de Crachá OFS</h1>
        <p className="text-sm text-gray-600 mb-6">
          Confirmação pública de autenticidade do crachá do irmão.
        </p>

        {loading && <p className="text-gray-600">Validando...</p>}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && data && (
          <div
            className={`rounded-lg border p-4 ${
              data.valid
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-yellow-200 bg-yellow-50 text-yellow-800"
            }`}
          >
            <p className="font-semibold text-lg mb-2">
              {data.valid ? "Crachá válido" : "Crachá inválido para membro ativo"}
            </p>
            <p><strong>Nome:</strong> {data.member.nome}</p>
            <p><strong>Tipo:</strong> {data.member.tipoMembro || "Membro"}</p>
            <p><strong>Status:</strong> {data.member.status}</p>
            <p>
              <strong>Fraternidade:</strong>{" "}
              {data.member.fraternidade?.nomeFraternidade || "Não informada"}
            </p>
            <p className="text-xs mt-3 opacity-80">
              Verificado em {new Date(data.checkedAt).toLocaleString("pt-BR")}
            </p>
          </div>
        )}

        <div className="mt-6">
          <Link to="/login" className="text-primary-700 font-semibold hover:underline">
            Ir para login do sistema
          </Link>
        </div>
      </div>
    </div>
  );
};
