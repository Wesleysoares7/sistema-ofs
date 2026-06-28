import React from "react";
import { MemberLayout } from "../components/Layout.js";
import { Badge, Button, Card } from "../components/Common.js";
import { Toast, useToast } from "../components/Toast.js";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../services/api.js";
import { MemberDashboard, User } from "../types/index.js";
import { formatarValorComExtenso } from "../utils/formatCurrency.js";

type Config = {
  valorAnual?: number;
  descricaoAnual?: string;
  chavePix?: string;
  qrcodePixBase64?: string;
};

type FraternidadeFinanceiraConfig = {
  mensalAtiva: boolean;
  valorMensal: number | null;
  chavePix?: string | null;
  qrcodePixBase64?: string | null;
};

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const MemberFinancePage: React.FC = () => {
  const { user } = useAuth();
  const { toast, showToast, setToast } = useToast();
  const [anoSelecionado, setAnoSelecionado] = React.useState(
    new Date().getFullYear(),
  );
  const [dashboard, setDashboard] = React.useState<MemberDashboard | null>(null);
  const [config, setConfig] = React.useState<Config | null>(null);
  const [financialConfig, setFinancialConfig] =
    React.useState<FraternidadeFinanceiraConfig | null>(null);
  const [profile, setProfile] = React.useState<User | null>(null);
  const [showOnlyPendentes, setShowOnlyPendentes] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");

  const anoReferenciaAnual = anoSelecionado - 1;

  React.useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setLoadError("");

        const [dashboardResult, configResult, monthlyConfigResult, profileResult] =
          await Promise.allSettled([
            api.get<MemberDashboard>(
              `/contribuicoes/dashboard/member/${user.id}?ano=${anoSelecionado}`,
            ),
            api.get<Config>("/config"),
            api.get<{ data: FraternidadeFinanceiraConfig }>(
              "/config/fraternidade-financeira",
            ),
            api.get<User>("/auth/profile"),
          ]);

        if (dashboardResult.status === "fulfilled") {
          setDashboard(dashboardResult.value.data);
        } else {
          setDashboard(null);
          setLoadError(
            "Não foi possível carregar seu histórico financeiro. Tente novamente.",
          );
        }

        if (configResult.status === "fulfilled") {
          setConfig(configResult.value.data);
        } else {
          setConfig(null);
        }

        if (monthlyConfigResult.status === "fulfilled") {
          setFinancialConfig(
            monthlyConfigResult.value.data.data || monthlyConfigResult.value.data,
          );
        } else {
          setFinancialConfig(null);
        }

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value.data);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Erro ao carregar financeiro:", error);
        setLoadError(
          "Não foi possível carregar seu financeiro agora. Tente novamente.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [anoSelecionado, user?.id]);

  const anualStatus = dashboard?.anualContribuicoes[0]?.status || "PENDENTE";
  const anualPagoEm = dashboard?.anualContribuicoes[0]?.dataPagamento;
  const mensalPendentes = dashboard?.resumo.mensal.pendentes || 0;
  const mensalPagas = dashboard?.resumo.mensal.pagas || 0;

  const chavePixAnual = config?.chavePix?.trim() || "";
  const qrcodePixAnual = config?.qrcodePixBase64 || null;

  const chavePixMensal =
    financialConfig?.chavePix?.trim() || config?.chavePix?.trim() || "";
  const qrcodePixMensal =
    financialConfig?.qrcodePixBase64 || config?.qrcodePixBase64 || null;

  const mensalOrdenada = React.useMemo(
    () => [...(dashboard?.mensalContribuicoes || [])].sort((a, b) => a.mes - b.mes),
    [dashboard?.mensalContribuicoes],
  );

  const mensalFiltrada = React.useMemo(() => {
    if (!showOnlyPendentes) {
      return mensalOrdenada;
    }

    return mensalOrdenada.filter((item) => item.status !== "PAGO");
  }, [mensalOrdenada, showOnlyPendentes]);

  const pendenciasAbertas = React.useMemo(() => {
    const pendencias: string[] = [];

    if (anualStatus !== "PAGO") {
      pendencias.push(`Contribuição anual ${anoReferenciaAnual} pendente`);
    }

    mensalOrdenada
      .filter((item) => item.status !== "PAGO")
      .forEach((item) => {
        pendencias.push(`Mensalidade de ${MONTHS[item.mes - 1]} pendente`);
      });

    return pendencias;
  }, [anualStatus, anoReferenciaAnual, mensalOrdenada]);

  const handleCopyPix = async (pixKey: string, label: string) => {
    if (!pixKey) {
      showToast(`A chave PIX de ${label} não está configurada.`, "warning");
      return;
    }

    try {
      await navigator.clipboard.writeText(pixKey);
      showToast(`Chave PIX de ${label} copiada!`, "success");
    } catch {
      showToast("Não foi possível copiar automaticamente.", "error");
    }
  };

  const normalizeWhatsappNumber = (raw?: string | null) => {
    if (!raw) return "";

    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";

    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }

    return digits;
  };

  const buildConfirmationMessage = (
    scope: "ANUAL" | "MENSAL",
    mes?: number,
  ) => {
    const nome = user?.nome || "Irmão(ã)";
    const fraternidade =
      profile?.fraternidade?.nomeFraternidade || "Fraternidade local";

    if (scope === "ANUAL") {
      return [
        `Olá! Eu, ${nome}, acabei de realizar o pagamento da contribuição anual (REFRAN ${anoReferenciaAnual}).`,
        `Fraternidade: ${fraternidade}.`,
        "Peço a conferência, por favor. Vou anexar o comprovante nesta conversa.",
      ].join("\n");
    }

    const nomeMes = MONTHS[(mes || 1) - 1];
    return [
      `Olá! Eu, ${nome}, acabei de realizar o pagamento da mensalidade de ${nomeMes}/${anoSelecionado}.`,
      `Fraternidade: ${fraternidade}.`,
      "Peço a conferência, por favor. Vou anexar o comprovante nesta conversa.",
    ].join("\n");
  };

  const handleJaPaguei = async (scope: "ANUAL" | "MENSAL", mes?: number) => {
    const message = buildConfirmationMessage(scope, mes);
    const whatsappNumber = normalizeWhatsappNumber(
      profile?.fraternidade?.contatoMinistro,
    );

    if (whatsappNumber) {
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, "_blank");
      showToast("Abrindo contato para solicitar conferência.", "info");
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      showToast(
        "Mensagem copiada. Encaminhe para o administrador local com o comprovante.",
        "success",
      );
    } catch {
      showToast(
        "Não foi possível preparar a mensagem automática de conferência.",
        "error",
      );
    }
  };

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center h-full">Carregando...</div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="space-y-6">
        <Card className="border border-primary-100">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
              <p className="text-gray-600 mt-1">
                Acompanhe mensalidades, contribuição anual e dados para pagamento.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Ano de referência mensal
              </label>
              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(parseInt(e.target.value, 10))}
                className="px-3 py-2 border border-gray-300 rounded-xl"
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
          </div>
        </Card>

        {loadError && (
          <Card>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700 mb-3">{loadError}</p>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Atualizar página
              </Button>
            </div>
          </Card>
        )}

        <Card className="border border-primary-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Resumo financeiro</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Anual ({anoReferenciaAnual})</p>
              <Badge status={anualStatus} />
              {anualStatus !== "PAGO" && (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full mt-3 text-sm"
                  onClick={() => handleJaPaguei("ANUAL")}
                >
                  Já paguei, solicitar conferência
                </Button>
              )}
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Mensais pagas</p>
              <p className="text-2xl font-bold text-green-600">{mensalPagas}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Mensais pendentes</p>
              <p className="text-2xl font-bold text-red-600">{mensalPendentes}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Mensalidade local</p>
              <p className="text-sm font-semibold text-gray-800">
                {financialConfig?.mensalAtiva
                  ? formatarValorComExtenso(financialConfig.valorMensal || 0)
                  : "Não habilitada"}
              </p>
            </div>
          </div>

          {pendenciasAbertas.length > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-900 mb-2">Pendências em aberto</p>
              <ul className="text-sm text-amber-900 space-y-1 list-disc pl-5">
                {pendenciasAbertas.slice(0, 6).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800 text-sm font-semibold">
              Tudo certo: sem pendências financeiras neste período.
            </div>
          )}
        </Card>

        <Card className="border border-primary-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Pagar com PIX</h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Contribuição anual (REFRAN {anoReferenciaAnual})</p>
              <p className="font-semibold text-gray-900 mb-2">
                {formatarValorComExtenso(config?.valorAnual || 0)}
              </p>
              {anualPagoEm && (
                <p className="text-xs text-green-700 mb-2">
                  Pago em {new Date(anualPagoEm).toLocaleDateString("pt-BR")}
                </p>
              )}
              <div className="space-y-2">
                <input
                  type="text"
                  readOnly
                  value={chavePixAnual || "Chave PIX anual não configurada"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleCopyPix(chavePixAnual, "anual")}
                  className="w-full"
                >
                  Copiar chave PIX anual
                </Button>
              </div>
              {qrcodePixAnual && (
                <div className="mt-3 flex justify-center bg-gray-50 rounded-lg p-3">
                  <img
                    src={qrcodePixAnual}
                    alt="QR Code PIX da contribuição anual"
                    className="w-44 h-44 object-cover"
                  />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Contribuição mensal ({anoSelecionado})</p>
              <p className="font-semibold text-gray-900 mb-2">
                {financialConfig?.mensalAtiva
                  ? formatarValorComExtenso(financialConfig?.valorMensal || 0)
                  : "Mensalidade local não ativa"}
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  readOnly
                  value={
                    chavePixMensal ||
                    "Chave PIX mensal não configurada pela fraternidade"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleCopyPix(chavePixMensal, "mensal")}
                  className="w-full"
                >
                  Copiar chave PIX mensal
                </Button>
              </div>
              {qrcodePixMensal && (
                <div className="mt-3 flex justify-center bg-gray-50 rounded-lg p-3">
                  <img
                    src={qrcodePixMensal}
                    alt="QR Code PIX da contribuição mensal"
                    className="w-44 h-44 object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="border border-primary-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Contribuição anual - REFRAN {anoReferenciaAnual}
          </h2>

          {dashboard?.anualContribuicoes?.length ? (
            <div className="space-y-2">
              {dashboard.anualContribuicoes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-gray-800">Exercício {item.ano}</p>
                    <p className="text-sm text-gray-500">
                      {item.dataPagamento
                        ? `Pago em ${new Date(item.dataPagamento).toLocaleDateString("pt-BR")}`
                        : "Pagamento ainda não identificado"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status !== "PAGO" && (
                      <Button
                        type="button"
                        variant="primary"
                        className="text-sm"
                        onClick={() => handleJaPaguei("ANUAL")}
                      >
                        Já paguei
                      </Button>
                    )}
                    <Badge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Ainda não há contribuição anual registrada para este período.
            </p>
          )}

          {config?.descricaoAnual && (
            <p className="mt-4 text-sm text-gray-600 italic">{config.descricaoAnual}</p>
          )}
        </Card>

        <Card className="border border-primary-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-800">Relação de pagamentos mensais</h2>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showOnlyPendentes}
                onChange={(e) => setShowOnlyPendentes(e.target.checked)}
              />
              Mostrar só pendentes
            </label>
          </div>

          {mensalFiltrada.length > 0 ? (
            <div className="space-y-2">
              {mensalFiltrada.map((item) => (
                <div
                  key={`${item.mes}-${anoSelecionado}`}
                  className="rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {MONTHS[item.mes - 1]} / {anoSelecionado}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.status === "PAGO" && item.dataPagamento
                        ? `Pago em ${new Date(item.dataPagamento).toLocaleDateString("pt-BR")}`
                        : "Aguardando pagamento"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status !== "PAGO" && (
                      <Button
                        type="button"
                        variant="primary"
                        className="text-sm"
                        onClick={() => handleJaPaguei("MENSAL", item.mes)}
                      >
                        Já paguei
                      </Button>
                    )}
                    <Badge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {showOnlyPendentes
                ? "Nenhuma pendência mensal neste ano."
                : "Nenhuma mensalidade registrada."}
            </p>
          )}
        </Card>
      </div>
    </MemberLayout>
  );
};
