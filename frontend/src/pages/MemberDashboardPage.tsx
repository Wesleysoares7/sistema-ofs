import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MemberLayout } from "../components/Layout.js";
import { Badge, Button, Card } from "../components/Common.js";
import { api } from "../services/api.js";
import { Aviso, MemberDashboard, User } from "../types/index.js";
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<MemberDashboard | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
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
      setLoadError("");
      const [dashboardResponse, configResponse, profileResponse, avisosResponse] =
        await Promise.all([
        api.get<MemberDashboard>(
          `/contribuicoes/dashboard/member/${user.id}?ano=${anoSelecionado}`,
        ),
        api.get<Config>("/config"),
        api.get<User>("/auth/profile"),
        api.get<Aviso[]>("/avisos"),
      ]);

      setDashboard(dashboardResponse.data);
      setConfig(configResponse.data);
      setProfile(profileResponse.data);
      setAvisos(avisosResponse.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setLoadError(
        "Não foi possível carregar seu dashboard agora. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const profileProgress = useMemo(() => {
    if (!profile) return 0;

    const checks = [
      !!profile.nome,
      !!profile.email,
      !!profile.telefone,
      !!profile.dataNascimento,
      !!profile.tipoMembro,
      !!profile.fotoBase64,
      !!profile.endereco?.rua,
      !!profile.endereco?.numero,
      !!profile.endereco?.bairro,
      !!profile.endereco?.cidade,
      !!profile.endereco?.estado,
      !!profile.endereco?.cep,
    ];

    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [profile]);

  const financeStatus = useMemo(() => {
    if (!dashboard) return "PENDENTE" as const;

    const hasAnualPaga = dashboard.anualContribuicoes.some(
      (item) => item.status === "PAGO",
    );

    if (dashboard.resumo.mensal.pendentes === 0 && hasAnualPaga) {
      return "EM_DIA" as const;
    }

    if (dashboard.resumo.mensal.pendentes <= 2) {
      return "PROXIMO_VENCIMENTO" as const;
    }

    return "PENDENTE" as const;
  }, [dashboard]);

  const primaryAction = useMemo(() => {
    if (!dashboard) {
      return {
        label: "Atualizar meu perfil",
        description: "Mantenha seus dados sempre atualizados.",
        onClick: () => navigate("/member/profile"),
      };
    }

    if (profileProgress < 85) {
      return {
        label: "Completar perfil",
        description: "Atualize seus dados para manter seu cadastro completo.",
        onClick: () => navigate("/member/profile"),
      };
    }

    if (dashboard.resumo.mensal.pendentes > 0) {
      return {
        label: "Regularizar contribuições",
        description: "Confira suas pendências no bloco de saúde financeira.",
        onClick: () =>
          document.getElementById("saude-financeira")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
      };
    }

    return {
      label: "Atualizar contato",
      description: "Confirme telefone e endereço para facilitar comunicação.",
      onClick: () => navigate("/member/profile"),
    };
  }, [dashboard, navigate, profileProgress]);

  const participacaoResumo = useMemo(() => {
    if (!dashboard) return "Participação em atualização.";

    const pagas = dashboard.resumo.mensal.pagas;
    if (pagas >= 10) return "Participação consistente na vida fraterna.";
    if (pagas >= 6) return "Boa regularidade nas contribuições mensais.";
    return "Há espaço para fortalecer sua regularidade mensal.";
  }, [dashboard]);

  const proximosPassos = useMemo(() => {
    if (!dashboard) return [];

    const mesAtual = new Date().getMonth() + 1;
    const mensalAtual = dashboard.mensalContribuicoes.find(
      (item) => item.mes === mesAtual,
    );
    const hasAnualPaga = dashboard.anualContribuicoes.some(
      (item) => item.status === "PAGO",
    );

    return [
      {
        titulo: "Cadastro atualizado",
        descricao: `${profileProgress}% completo`,
        concluido: profileProgress >= 85,
      },
      {
        titulo: "Contribuição anual",
        descricao: hasAnualPaga ? "Contribuição anual em dia" : "Contribuição anual pendente",
        concluido: hasAnualPaga,
      },
      {
        titulo: "Contribuição do mês",
        descricao:
          mensalAtual?.status === "PAGO"
            ? "Mês atual já regularizado"
            : "Regularizar contribuição do mês atual",
        concluido: mensalAtual?.status === "PAGO",
      },
    ];
  }, [dashboard, profileProgress]);

  const lastUpdatedProfile = useMemo(() => {
    if (!profile?.updatedAt) return "Não informado";
    return new Date(profile.updatedAt).toLocaleDateString("pt-BR");
  }, [profile?.updatedAt]);

  const financeStatusLabelMap: Record<typeof financeStatus, string> = {
    EM_DIA: "Em dia",
    PROXIMO_VENCIMENTO: "Próximo vencimento",
    PENDENTE: "Pendente",
  };

  const financeStatusStyleMap: Record<typeof financeStatus, string> = {
    EM_DIA: "bg-green-100 text-green-700",
    PROXIMO_VENCIMENTO: "bg-yellow-100 text-yellow-700",
    PENDENTE: "bg-red-100 text-red-700",
  };

  const financeStatusLabel = financeStatusLabelMap[financeStatus];
  const financeStatusStyle = financeStatusStyleMap[financeStatus];

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

        {loadError && (
          <Card>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700 mb-3">{loadError}</p>
              <Button variant="secondary" onClick={loadData}>
                Tentar novamente
              </Button>
            </div>
          </Card>
        )}

        {dashboard && (
          <>
            <Card>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Olá, {profile?.nome || user?.nome} 👋
                  </h2>
                  <p className="text-gray-600 mt-1">Que bom te ver por aqui.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge status={profile?.status || user?.status || "ATIVO"} />
                  <span className="px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700 font-medium">
                    {profile?.tipoMembro || user?.tipoMembro || "MEMBRO"}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="border border-primary-200">
              <h3 className="text-lg font-semibold text-gray-800">Próxima ação</h3>
              <p className="text-sm text-gray-600 mt-1 mb-4">
                {primaryAction.description}
              </p>
              <Button variant="primary" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            </Card>

            <Card>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Resumo pessoal</h3>
                  <p className="text-sm text-gray-600 mt-1">{participacaoResumo}</p>
                </div>
                <div className="min-w-52">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Cadastro completo</span>
                    <span className="font-semibold">{profileProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-primary-600"
                      style={{ width: `${profileProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{profile?.email || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">Telefone</p>
                  <p className="font-medium text-gray-800">{profile?.telefone || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">Cidade</p>
                  <p className="font-medium text-gray-800">
                    {profile?.endereco?.cidade || "Não informada"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">Última atualização cadastral</p>
                  <p className="font-medium text-gray-800">{lastUpdatedProfile}</p>
                </div>
              </div>
            </Card>

            <Card id="saude-financeira">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Saúde financeira</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Acompanhe sua situação de forma simples e organizada.
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${financeStatusStyle}`}>
                  {financeStatusLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Mensais pagas</p>
                  <p className="text-2xl font-bold text-green-600">{dashboard.resumo.mensal.pagas}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Mensais pendentes</p>
                  <p className="text-2xl font-bold text-red-600">{dashboard.resumo.mensal.pendentes}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Contribuição anual</p>
                  <p className="text-base font-semibold text-gray-700">
                    {dashboard.anualContribuicoes[0]?.status === "PAGO"
                      ? "Em dia"
                      : "Pendente"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-500">Contribuição anual</p>
                  <p className="font-semibold text-gray-800">
                    {formatarValorComExtenso(config?.valorAnual || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Exercício REFRAN {anoReferenciaAnual}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-500">Contribuição mensal</p>
                  <p className="font-semibold text-gray-800">
                    {formatarValorComExtenso(config?.valorMensal || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Pagamento recorrente mensal</p>
                </div>
              </div>

              {config?.chavePix ? (
                <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
                  <p className="font-semibold mb-1">PIX para contribuição</p>
                  <code className="block break-all bg-white rounded p-2 text-gray-800">
                    {config.chavePix}
                  </code>
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                  Dados de PIX ainda não configurados pela administração.
                </div>
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações rápidas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button variant="primary" onClick={() => navigate("/member/profile")}>
                  Meu Perfil
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    document.getElementById("historico-contribuicoes")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                >
                  Histórico
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    document.getElementById("saude-financeira")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                >
                  Contribuições
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Avisos da Fraternidade</h3>
              {avisos.length === 0 ? (
                <p className="text-sm text-gray-600">Nenhum aviso ativo no momento.</p>
              ) : (
                <div className="space-y-3">
                  {avisos.slice(0, 4).map((aviso) => (
                    <div key={aviso.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{aviso.titulo}</h4>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700">
                          {aviso.tipo}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{aviso.mensagem}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Próximos passos</h3>
              <div className="space-y-3">
                {proximosPassos.map((passo) => (
                  <div key={passo.titulo} className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-3 w-3 rounded-full ${
                        passo.concluido ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-gray-800">{passo.titulo}</p>
                      <p className="text-sm text-gray-600">{passo.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="historico-contribuicoes">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-800">Histórico de contribuições</h2>
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
