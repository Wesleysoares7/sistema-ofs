import React, { useState, useEffect } from "react";
import { AdminLayout } from "../components/Layout.js";
import { Card, Badge, Button } from "../components/Common.js";
import { Modal } from "../components/Modal.js";
import { api } from "../services/api.js";
import { includesNormalized } from "../utils/textSearch.js";
import { useAuth } from "../hooks/useAuth.js";

interface ContributionReport {
  userId: string;
  nome: string;
  email: string;
  tipoMembro: string;
  fraternidadeId?: string | null;
  fraternidadeNome?: string;
  distrito?: string;
  anual: string;
  anualId?: string;
  anualDataPagamento?: string | null;
  mensal: {
    pagas: number;
    pendentes: number;
    total: number;
  };
  statusGeral: string;
}

interface MonthlyContribution {
  id: string;
  mes: number;
  ano: number;
  status: string;
  dataPagamento?: string;
}

interface FraternidadeFinanceiraConfig {
  fraternidadeId: string;
  mensalAtiva: boolean;
  valorMensal: number | null;
}

export const AdminContribuicoesPage: React.FC = () => {
  const { user } = useAuth();
  const isRegionalAdmin =
    user?.role === "ADMIN_REGIONAL" || user?.role === "ADMIN";
  const isLocalAdmin = user?.role === "ADMIN_LOCAL";

  const [relatorio, setRelatorio] = useState<ContributionReport[]>([]);
  const [busca, setBusca] = useState("");
  const [distritoFilter, setDistritoFilter] = useState("TODOS");
  const [fraternidadeFilter, setFraternidadeFilter] = useState("TODAS");
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const [ano, setAno] = useState(currentYear);
  const [anoInput, setAnoInput] = useState(String(currentYear));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContribution, setEditingContribution] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [monthlyContributions, setMonthlyContributions] = useState<
    MonthlyContribution[]
  >([]);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [regionalAnualValue, setRegionalAnualValue] = useState(0);
  const [regionalConfigSubmitting, setRegionalConfigSubmitting] =
    useState(false);
  const [financialConfig, setFinancialConfig] =
    useState<FraternidadeFinanceiraConfig | null>(null);
  const [localConfigSubmitting, setLocalConfigSubmitting] = useState(false);
  const [annualExerciseSubmitting, setAnnualExerciseSubmitting] =
    useState(false);
  const [monthlyExerciseSubmitting, setMonthlyExerciseSubmitting] =
    useState(false);
  const anoReferenciaAnual = ano - 1;

  const toDateInputValue = (isoDate?: string | null) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000,
    );
    return localDate.toISOString().slice(0, 10);
  };

  const toISODateFromInput = (dateInput: string) => {
    return `${dateInput}T12:00:00.000Z`;
  };

  useEffect(() => {
    loadRelatorio();
  }, [ano]);

  useEffect(() => {
    loadFinanceConfigs();
  }, [user?.role]);

  const loadFinanceConfigs = async () => {
    try {
      if (isRegionalAdmin) {
        const response = await api.get<any>("/config");
        const configData = response.data.data || response.data;
        setRegionalAnualValue(configData.valorAnual || 0);
      }

      if (isLocalAdmin) {
        const response = await api.get<any>("/config/fraternidade-financeira");
        const configData = response.data.data || response.data;
        setFinancialConfig({
          fraternidadeId: configData.fraternidadeId,
          mensalAtiva: !!configData.mensalAtiva,
          valorMensal:
            configData.valorMensal !== undefined && configData.valorMensal !== null
              ? Number(configData.valorMensal)
              : null,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configurações financeiras:", error);
    }
  };

  const loadRelatorio = async () => {
    try {
      setLoading(true);
      const response = await api.get<ContributionReport[]>(
        `/contribuicoes/dashboard/admin/report?ano=${ano}`,
      );
      setRelatorio(response.data);
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRegionalAnnualValue = async () => {
    try {
      setRegionalConfigSubmitting(true);
      setErrorMessage("");
      setFeedbackMessage("");
      await api.put("/config", {
        valorAnual: regionalAnualValue,
      });
      setFeedbackMessage("Valor anual regional atualizado com sucesso.");
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.error ||
          "Não foi possível atualizar o valor anual regional.",
      );
    } finally {
      setRegionalConfigSubmitting(false);
    }
  };

  const handleSaveLocalMonthlyConfig = async () => {
    if (!financialConfig) return;

    try {
      setLocalConfigSubmitting(true);
      setErrorMessage("");
      setFeedbackMessage("");

      await api.put("/config/fraternidade-financeira", {
        mensalAtiva: financialConfig.mensalAtiva,
        valorMensal: financialConfig.mensalAtiva
          ? financialConfig.valorMensal || 0
          : null,
      });

      setFeedbackMessage(
        "Configuração de mensalidade da fraternidade salva com sucesso.",
      );
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.error ||
          "Não foi possível salvar a configuração de mensalidade.",
      );
    } finally {
      setLocalConfigSubmitting(false);
    }
  };

  const handleGenerateAnnualExercise = async () => {
    try {
      setAnnualExerciseSubmitting(true);
      setErrorMessage("");
      setFeedbackMessage("");

      const response = await api.post<any>(`/contribuicoes/exercicio/anual?ano=${ano}`);
      const data = response.data;

      setFeedbackMessage(
        `Exercício anual ${data.exercicioAno} gerado. Novas anuais: ${data.created}. Já existentes: ${data.skipped}.`,
      );
      await loadRelatorio();
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.error ||
          "Não foi possível gerar o exercício anual.",
      );
    } finally {
      setAnnualExerciseSubmitting(false);
    }
  };

  const handleGenerateMonthlyExercise = async () => {
    if (!financialConfig?.mensalAtiva) {
      setErrorMessage(
        "Ative a mensalidade da fraternidade antes de gerar mensalidades do exercício.",
      );
      return;
    }

    try {
      setMonthlyExerciseSubmitting(true);
      setErrorMessage("");
      setFeedbackMessage("");

      const response = await api.post<any>(
        `/contribuicoes/exercicio/mensal?ano=${ano}`,
      );
      const data = response.data;

      setFeedbackMessage(
        `Mensalidades do exercício ${data.exercicioAno} geradas. Novas parcelas: ${data.createdContribuicoes}. Membros afetados: ${data.usersWithCreation}.`,
      );
      await loadRelatorio();
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.error ||
          "Não foi possível gerar as mensalidades do exercício.",
      );
    } finally {
      setMonthlyExerciseSubmitting(false);
    }
  };

  const handleApplyYear = () => {
    const parsed = parseInt(anoInput, 10);

    if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
      setErrorMessage("Informe um exercício válido entre 2000 e 2100.");
      return;
    }

    setErrorMessage("");
    setAno(parsed);
  };

  const handleEditAnnual = async (row: ContributionReport) => {
    try {
      if (!row.anualId) {
        setErrorMessage(
          `Não existe contribuição anual para ${row.nome} no exercício ${anoReferenciaAnual}. O administrador regional deve gerar o exercício anual antes da edição individual.`,
        );
        return;
      }

      setEditingContribution({
        type: "anual",
        row,
      });
      setEditData({
        status: row.anual,
        dataPagamento: toDateInputValue(row.anualDataPagamento),
      });
      setIsModalOpen(true);
    } catch (error: any) {
      console.error("Erro ao preparar contribuição anual:", error);
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        (typeof error?.response?.data === "string"
          ? error.response.data
          : null) ||
        "Erro ao preparar contribuição anual. Tente novamente.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMonthly = async (row: ContributionReport) => {
    try {
      setLoading(true);

      const response = await api.get<MonthlyContribution[]>(
        `/contribuicoes/mensal/${row.userId}?ano=${ano}`,
      );

      if (response.data.length === 0) {
        setErrorMessage(
          `Não existem mensalidades para ${row.nome} no exercício ${ano}. Gere as mensalidades do exercício antes da edição individual.`,
        );
        return;
      }

      setMonthlyContributions(response.data);
      const statusById = Object.fromEntries(
        response.data.map((item) => [item.id, item.status]),
      );
      const dateById = Object.fromEntries(
        response.data.map((item) => [
          item.id,
          toDateInputValue(item.dataPagamento),
        ]),
      );
      setEditData({ statusById, dateById });
      setEditingContribution({ type: "mensal", row });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar contribuições mensais:", error);
      alert("Erro ao carregar contribuições mensais. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContribution = async () => {
    try {
      setSubmitting(true);

      if (editingContribution.type === "anual") {
        const row = editingContribution.row;

        // Recarrega o relatório para pegar o anualId mais recente
        const reportResponse = await api.get<ContributionReport[]>(
          `/contribuicoes/dashboard/admin/report?ano=${ano}`,
        );

        const updatedRow = reportResponse.data.find(
          (r) => r.userId === row.userId,
        );
        if (!updatedRow?.anualId) {
          alert(
            "Erro: Não foi possível criar a contribuição anual. Tente novamente.",
          );
          return;
        }

        if (editData.status === "PAGO" && !editData.dataPagamento) {
          alert("Informe a data de pagamento da contribuição anual.");
          return;
        }

        await api.put(`/contribuicoes/anual/${updatedRow.anualId}`, {
          status: editData.status,
          dataPagamento:
            editData.status === "PAGO"
              ? toISODateFromInput(editData.dataPagamento)
              : null,
        });
      } else {
        // Salvar todas as contribuições mensais editadas
        for (const contribution of monthlyContributions) {
          const newStatus =
            editData.statusById?.[contribution.id] || contribution.status;
          const newDate = editData.dateById?.[contribution.id] || "";
          const oldDate = toDateInputValue(contribution.dataPagamento);

          if (newStatus === "PAGO" && !newDate) {
            alert(
              `Informe a data de pagamento para ${
                [
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
                ][contribution.mes - 1]
              }.`,
            );
            return;
          }

          if (newStatus !== contribution.status || newDate !== oldDate) {
            await api.put(`/contribuicoes/mensal/${contribution.id}`, {
              status: newStatus,
              dataPagamento:
                newStatus === "PAGO" ? toISODateFromInput(newDate) : null,
            });
          }
        }
      }

      setIsModalOpen(false);
      loadRelatorio();
    } catch (error) {
      console.error("Erro ao salvar contribuição:", error);
      alert("Erro ao salvar contribuição");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          Carregando...
        </div>
      </AdminLayout>
    );
  }

  const distritosDisponiveis = Array.from(
    new Set(relatorio.map((row) => row.distrito || "Sem distrito")),
  ).sort((a, b) => a.localeCompare(b));

  const fraternidadesDisponiveis = Array.from(
    new Set(
      relatorio
        .filter((row) =>
          distritoFilter === "TODOS"
            ? true
            : (row.distrito || "Sem distrito") === distritoFilter,
        )
        .map((row) => row.fraternidadeNome || "Sem fraternidade"),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const relatorioFiltrado = relatorio.filter((row) => {
    if (
      distritoFilter !== "TODOS" &&
      (row.distrito || "Sem distrito") !== distritoFilter
    ) {
      return false;
    }

    if (
      fraternidadeFilter !== "TODAS" &&
      (row.fraternidadeNome || "Sem fraternidade") !== fraternidadeFilter
    ) {
      return false;
    }

    const termo = busca.trim();
    if (!termo) return true;

    return (
      includesNormalized(row.nome, termo) ||
      includesNormalized(row.email, termo) ||
      includesNormalized(row.fraternidadeNome || "", termo) ||
      includesNormalized(row.distrito || "", termo)
    );
  });

  const inadimplentes = relatorioFiltrado.filter(
    (r) => r.statusGeral === "INADIMPLENTE",
  ).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="surface-panel rounded-3xl p-6 md:p-8 border border-white/70 mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700">
                <span>💼</span>
                Gestão financeira
              </div>
              <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-gray-900">
                Contribuições
              </h1>
              <p className="text-gray-600 mt-2 max-w-2xl">
                {isRegionalAdmin
                  ? "Relatório financeiro global por distrito e fraternidade"
                  : "Relatório financeiro da sua fraternidade"}
              </p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <Card className="border border-red-100">
            <div className="rounded-xl border border-red-200 bg-red-50/90 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          </Card>
        )}

        {feedbackMessage && (
          <Card className="border border-emerald-100">
            <div className="rounded-xl border border-green-200 bg-green-50/90 p-3 text-sm text-green-700">
              {feedbackMessage}
            </div>
          </Card>
        )}

        {isRegionalAdmin && (
          <Card className="border border-primary-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Anuidade Regional Vigente
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="w-full sm:w-64">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor anual (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={regionalAnualValue}
                  onChange={(e) =>
                    setRegionalAnualValue(parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-white/90"
                />
              </div>
              <Button
                onClick={handleSaveRegionalAnnualValue}
                loading={regionalConfigSubmitting}
              >
                Salvar Anuidade
              </Button>
              <Button
                variant="secondary"
                onClick={handleGenerateAnnualExercise}
                loading={annualExerciseSubmitting}
              >
                Gerar Exercício Anual ({ano})
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              O exercício anual é criado sob comando do administrador regional.
            </p>
          </Card>
        )}

        {isLocalAdmin && financialConfig && (
          <Card className="border border-primary-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Configuração Financeira Local
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={financialConfig.mensalAtiva}
                  onChange={(e) =>
                    setFinancialConfig({
                      ...financialConfig,
                      mensalAtiva: e.target.checked,
                    })
                  }
                />
                Esta fraternidade cobra mensalidade
              </label>

              <div className="w-full sm:w-64">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor mensal local (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!financialConfig.mensalAtiva}
                  value={financialConfig.valorMensal ?? 0}
                  onChange={(e) =>
                    setFinancialConfig({
                      ...financialConfig,
                      valorMensal: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <Button
                onClick={handleSaveLocalMonthlyConfig}
                loading={localConfigSubmitting}
              >
                Salvar Configuração Local
              </Button>

              <Button
                variant="secondary"
                onClick={handleGenerateMonthlyExercise}
                loading={monthlyExerciseSubmitting}
                disabled={!financialConfig.mensalAtiva}
              >
                Gerar Mensalidades do Exercício ({ano})
              </Button>
              <p className="text-xs text-gray-500">
                A geração mensal só é permitida quando a mensalidade está ativa para a fraternidade.
              </p>
            </div>
          </Card>
        )}

          <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 lg:items-center">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
            <label className="font-medium text-gray-700 text-sm sm:text-base">
              Ano:
            </label>
            <div className="flex w-full sm:w-auto gap-2">
              <input
                type="number"
                min={2000}
                max={2100}
                value={anoInput}
                onChange={(e) => setAnoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyYear();
                  }
                }}
                className="w-full sm:w-36 px-4 py-3 border border-gray-200 rounded-xl bg-white/90"
              />
              <Button variant="secondary" onClick={handleApplyYear}>
                Aplicar
              </Button>
            </div>
          </div>

          {isRegionalAdmin && (
            <>
              <select
                value={distritoFilter}
                onChange={(e) => {
                  setDistritoFilter(e.target.value);
                  setFraternidadeFilter("TODAS");
                }}
                className="w-full sm:w-auto px-4 py-3 border border-gray-200 rounded-xl bg-white/90"
              >
                <option value="TODOS">Todos os distritos</option>
                {distritosDisponiveis.map((distrito) => (
                  <option key={distrito} value={distrito}>
                    {distrito}
                  </option>
                ))}
              </select>

              <select
                value={fraternidadeFilter}
                onChange={(e) => setFraternidadeFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-3 border border-gray-200 rounded-xl bg-white/90"
              >
                <option value="TODAS">Todas as fraternidades</option>
                {fraternidadesDisponiveis.map((fraternidade) => (
                  <option key={fraternidade} value={fraternidade}>
                    {fraternidade}
                  </option>
                ))}
              </select>
            </>
          )}

          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={
              isRegionalAdmin
                ? "Buscar por nome, email, distrito ou fraternidade"
                : "Buscar por nome ou email"
            }
            className="w-full lg:max-w-sm px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <p className="text-sm text-gray-500">
          Exibindo {relatorioFiltrado.length} de {relatorio.length} membros no período
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center border border-primary-100">
            <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              {relatorioFiltrado.length}
            </div>
            <p className="text-gray-600 text-sm mt-2">Total de Membros</p>
          </Card>

          <Card className="text-center border border-emerald-100">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600">
              {relatorioFiltrado.length - inadimplentes}
            </div>
            <p className="text-gray-600 text-sm mt-2">Em Dia</p>
          </Card>

          <Card className="text-center border border-red-100">
            <div className="text-3xl sm:text-4xl font-extrabold text-red-600">
              {inadimplentes}
            </div>
            <p className="text-gray-600 text-sm mt-2">Inadimplentes</p>
          </Card>
        </div>

        <Card className="border border-primary-100">
          <div className="space-y-4 md:hidden">
            {relatorioFiltrado.map((row) => (
              <div
                key={row.userId}
                className="border border-gray-200 rounded-2xl p-4 space-y-3 bg-white/90 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-gray-800">{row.nome}</p>
                  <p className="text-sm text-gray-600 break-all">{row.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {row.distrito || "Sem distrito"} - {row.fraternidadeNome || "Sem fraternidade"}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Tipo</span>
                  <span className="text-gray-700 font-medium">
                    {row.tipoMembro || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-500">Anual</span>
                  <Badge status={row.anual} />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Mensal</span>
                  <span className="font-semibold text-gray-700">
                    {row.mensal.pagas}/{row.mensal.total}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-500">Status</span>
                  <Badge
                    status={row.statusGeral}
                    className={
                      row.statusGeral === "EM DIA"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleEditAnnual(row)}
                    className="w-full py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold"
                  >
                    ✎ Anual
                  </button>
                  <button
                    onClick={() => handleEditMonthly(row)}
                    className="w-full py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold"
                  >
                    ✎ Mensal
                  </button>
                </div>
              </div>
            ))}
            {relatorioFiltrado.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                Nenhum membro encontrado para essa busca.
              </p>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Distrito
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Fraternidade
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Anual
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Mensal
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {relatorioFiltrado.map((row) => (
                  <tr key={row.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {row.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.distrito || "Sem distrito"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.fraternidadeNome || "Sem fraternidade"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.tipoMembro || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge status={row.anual} />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-semibold">
                        {row.mensal.pagas}/{row.mensal.total}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge
                        status={row.statusGeral}
                        className={
                          row.statusGeral === "EM DIA"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleEditAnnual(row)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        ✎ Anual
                      </button>
                      <button
                        onClick={() => handleEditMonthly(row)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        ✎ Mensal
                      </button>
                    </td>
                  </tr>
                ))}
                {relatorioFiltrado.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-6 text-center text-sm text-gray-500"
                    >
                      Nenhum membro encontrado para essa busca.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        title={
          editingContribution?.type === "anual"
            ? `Editar Contribuição Anual - ${editingContribution?.row?.nome}`
            : `Editar Contribuições Mensais - ${editingContribution?.row?.nome}`
        }
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveContribution}
        submitText="Salvar"
        loading={submitting}
      >
        {editingContribution?.type === "anual" ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm text-blue-800">
              <p>✓ Contribuição anual encontrada para o exercício.</p>
              <p className="mt-1 text-xs">Escolha abaixo o status:</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status da Contribuição Anual (Exercício REFRAN{" "}
                {anoReferenciaAnual})
              </label>
              <select
                value={editData.status || ""}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">Selecione um status...</option>
                <option value="PAGO">✅ Pago</option>
                <option value="PENDENTE">⏳ Pendente</option>
              </select>
            </div>
            {editData.status === "PAGO" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de pagamento
                </label>
                <input
                  type="date"
                  value={editData.dataPagamento || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, dataPagamento: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {monthlyContributions.length === 0 ? (
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800 text-center">
                <p>⚠️ Nenhuma contribuição mensal encontrada para {ano}</p>
                <p className="text-xs mt-1">
                  Gere as mensalidades do exercício para a fraternidade antes de editar.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  📅 Clique no mês para alternar entre <strong>Pago</strong>{" "}
                  (verde) e <strong>Pendente</strong> (vermelho)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {monthlyContributions.map((contrib) => (
                    <div key={contrib.id} className="space-y-2">
                      <button
                        onClick={() => {
                          const currentStatus =
                            editData.statusById?.[contrib.id] || contrib.status;
                          const newStatus =
                            currentStatus === "PAGO" ? "PENDENTE" : "PAGO";
                          setEditData({
                            ...editData,
                            statusById: {
                              ...(editData.statusById || {}),
                              [contrib.id]: newStatus,
                            },
                            dateById: {
                              ...(editData.dateById || {}),
                              [contrib.id]:
                                newStatus === "PAGO"
                                  ? editData.dateById?.[contrib.id] || ""
                                  : "",
                            },
                          });
                        }}
                        className={`w-full p-2 rounded text-sm font-medium transition-colors ${
                          (editData.statusById?.[contrib.id] ||
                            contrib.status) === "PAGO"
                            ? "bg-green-200 text-green-800 hover:bg-green-300"
                            : "bg-red-200 text-red-800 hover:bg-red-300"
                        }`}
                      >
                        {
                          [
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
                          ][contrib.mes - 1]
                        }
                      </button>
                      {(editData.statusById?.[contrib.id] || contrib.status) ===
                        "PAGO" && (
                        <input
                          type="date"
                          value={editData.dateById?.[contrib.id] || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              dateById: {
                                ...(editData.dateById || {}),
                                [contrib.id]: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};
