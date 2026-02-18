import React, { useState, useEffect } from "react";
import { MemberLayout } from "../components/Layout.js";
import { Card, Badge } from "../components/Common.js";
import { api } from "../services/api.js";
import { MemberDashboard } from "../types/index.js";
import { useAuth } from "../hooks/useAuth.js";
import { formatarValorComExtenso } from "../utils/formatCurrency.js";

interface Config {
  id: string;
  valorAnual: number;
  descricaoAnual?: string;
  valorMensal: number;
  descricaoMensal?: string;
  chavePix?: string;
  qrcodePixBase64?: string;
}

export const MemberDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<MemberDashboard | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear(),
  );
  const anoReferenciaAnual = anoSelecionado - 1;

  useEffect(() => {
    loadData();
  }, [user?.id, anoSelecionado]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [dashboardResponse, configResponse] = await Promise.all([
        api.get<MemberDashboard>(
          `/contribuicoes/dashboard/member/${user.id}?ano=${anoSelecionado}`,
        ),
        api.get<Config>("/config"),
      ]);
      setDashboard(dashboardResponse.data);
      setConfig(configResponse.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center h-full">
          Carregando...
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Olá, {user?.nome}!
          </h1>
          <p className="text-gray-600 mt-2">Dashboard de suas contribuições</p>
        </div>

        {dashboard && (
          <>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Ano:</label>
              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                {[
                  new Date().getFullYear() - 1,
                  new Date().getFullYear(),
                  new Date().getFullYear() + 1,
                ].map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>

            {/* Seção de Valores Devidos - SEMPRE VISÍVEL */}
            <Card className="bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 border-2 border-orange-300 shadow-lg">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-orange-900 mb-2">
                    💰 Suas Contribuições
                  </h2>
                  <p className="text-lg text-orange-700">
                    Valores mensais e anuais que você pode pagar
                  </p>
                </div>
                <span className="text-5xl">📋</span>
              </div>

              {/* Contribuição Anual */}
              <div className="mb-6 pb-6 border-b-2 border-orange-200">
                <div className="bg-white p-6 rounded-lg border-2 border-orange-300 shadow-md">
                  <p className="text-xl font-bold text-gray-700 mb-2">
                    📅 Contribuição Anual
                  </p>
                  <p className="text-3xl font-bold text-orange-600 mb-1">
                    {formatarValorComExtenso(config?.valorAnual || 0)}
                  </p>
                  {config?.descricaoAnual && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-2">
                      <p className="text-gray-800 leading-relaxed">
                        {config.descricaoAnual}
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Valor cobrado uma vez por ano (Exercício REFRAN{" "}
                    {anoReferenciaAnual})
                  </p>
                </div>
              </div>

              {/* Contribuição Mensal */}
              <div className="mb-6 pb-6">
                <div className="bg-white p-6 rounded-lg border-2 border-orange-300 shadow-md">
                  <p className="text-xl font-bold text-gray-700 mb-2">
                    📆 Contribuição Mensal
                  </p>
                  <p className="text-3xl font-bold text-orange-600 mb-1">
                    {formatarValorComExtenso(config?.valorMensal || 0)}
                  </p>
                  {config?.descricaoMensal && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-2">
                      <p className="text-gray-800 leading-relaxed">
                        {config.descricaoMensal}
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Valor cobrado todo mês
                  </p>
                </div>
              </div>

              {/* Dados de Pagamento PIX */}
              {config?.chavePix ? (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-300 mt-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <span className="mr-2">✅</span> Como Pagar via PIX
                  </h3>

                  <div className="space-y-3">
                    {config.qrcodePixBase64 && (
                      <div className="bg-white p-3 rounded-lg inline-block border border-blue-200">
                        <p className="text-xs text-blue-700 mb-2 font-semibold">
                          Escanear QR Code:
                        </p>
                        <img
                          src={config.qrcodePixBase64}
                          alt="QR Code PIX"
                          className="w-40 h-40 object-cover"
                        />
                      </div>
                    )}

                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 font-semibold mb-1">
                        Ou copie a chave PIX:
                      </p>
                      <code className="text-gray-800 font-mono text-sm break-all bg-gray-50 p-2 rounded block">
                        {config.chavePix}
                      </code>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300 mt-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Dados de PIX não configurados:</strong> O
                    administrador ainda não informou a chave PIX e QR Code.
                    Verifique com a administração para obter as informações de
                    pagamento.
                  </p>
                </div>
              )}
            </Card>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="text-center">
                <div className="text-4xl font-bold text-green-600">
                  {dashboard.resumo.mensal.pagas}
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  Contribuições Mensais Pagas
                </p>
              </Card>

              <Card className="text-center">
                <div className="text-4xl font-bold text-red-600">
                  {dashboard.resumo.mensal.pendentes}
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  Contribuições Mensais Pendentes
                </p>
              </Card>
            </div>

            {/* Contribuição Anual */}
            <Card>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Contribuição Anual - Exercício REFRAN {anoReferenciaAnual}
              </h2>
              {dashboard.anualContribuicoes.length > 0 ? (
                <div className="space-y-2">
                  {dashboard.anualContribuicoes.map((contrib) => (
                    <div
                      key={contrib.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-700">
                        {contrib.ano}
                      </span>
                      <Badge status={contrib.status} />
                      {contrib.dataPagamento && (
                        <span className="text-sm text-gray-600">
                          Pago em:{" "}
                          {new Date(contrib.dataPagamento).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">
                  Nenhuma contribuição anual registrada.
                </p>
              )}
            </Card>

            {/* Contribuições Mensais */}
            <Card>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Contribuições Mensais - {dashboard.ano}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {dashboard.mensalContribuicoes.length > 0 ? (
                  dashboard.mensalContribuicoes.map((contrib) => {
                    const meses = [
                      "Jan",
                      "Fev",
                      "Mar",
                      "Abr",
                      "Mai",
                      "Jun",
                      "Jul",
                      "Ago",
                      "Set",
                      "Out",
                      "Nov",
                      "Dez",
                    ];
                    const statusColor =
                      contrib.status === "PAGO"
                        ? "bg-green-100 border-green-400"
                        : "bg-red-100 border-red-400";
                    const textColor =
                      contrib.status === "PAGO"
                        ? "text-green-800"
                        : "text-red-800";

                    return (
                      <div
                        key={contrib.mes}
                        className={`p-4 border-2 rounded-lg text-center ${statusColor}`}
                      >
                        <div className={`font-bold ${textColor}`}>
                          {meses[contrib.mes - 1]}
                        </div>
                        <div className={`text-sm ${textColor}`}>
                          {contrib.status === "PAGO" ? "✓" : "—"}
                        </div>
                        {contrib.status === "PAGO" && contrib.dataPagamento && (
                          <div className="text-xs text-gray-700 mt-1">
                            {new Date(contrib.dataPagamento).toLocaleDateString(
                              "pt-BR",
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-600 col-span-full">
                    Nenhuma contribuição mensal registrada.
                  </p>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </MemberLayout>
  );
};
