import React, { useState, useEffect } from "react";
import { AdminLayout } from "../components/Layout.js";
import { Card, Button, Badge } from "../components/Common.js";
import { Modal } from "../components/Modal.js";
import { api } from "../services/api.js";

interface ContributionReport {
  userId: string;
  nome: string;
  email: string;
  tipoMembro: string;
  anual: string;
  anualId?: string;
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

export const AdminContribuicoesPage: React.FC = () => {
  const [relatorio, setRelatorio] = useState<ContributionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContribution, setEditingContribution] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [monthlyContributions, setMonthlyContributions] = useState<
    MonthlyContribution[]
  >([]);
  const anoReferenciaAnual = ano - 1;

  useEffect(() => {
    loadRelatorio();
  }, [ano]);

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

  const handleEditAnnual = async (row: ContributionReport) => {
    try {
      setLoading(true);

      // Se não tem anualId, cria as contribuições anuais faltantes para o ano selecionado
      if (!row.anualId) {
        console.log("Criando contribuições anuais faltantes para:", row.userId);
        await api.post(`/contribuicoes/anual/${row.userId}/missing?ano=${ano}`);
        // Recarrega o relatório para pegar os novos IDs
        await loadRelatorio();
      }

      setEditingContribution({
        type: "anual",
        row: { ...row, anualId: row.anualId || "created" },
      });
      setEditData({ status: row.anual });
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

      // Primeiro, cria as contribuições mensais faltantes para o ano selecionado
      console.log("Criando contribuições mensais faltantes para:", row.userId);
      await api.post(`/contribuicoes/mensal/${row.userId}/missing?ano=${ano}`);

      // Depois carrega as contribuições mensais
      const response = await api.get<MonthlyContribution[]>(
        `/contribuicoes/mensal/${row.userId}?ano=${ano}`,
      );

      console.log("Contribuições mensais carregadas:", response.data);
      setMonthlyContributions(response.data);
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

        await api.put(`/contribuicoes/anual/${updatedRow.anualId}`, {
          status: editData.status,
          dataPagamento: editData.status === "PAGO" ? new Date() : null,
        });
      } else {
        // Salvar todas as contribuições mensais editadas
        for (const contribution of monthlyContributions) {
          const newStatus = editData[contribution.id] || contribution.status;
          if (newStatus !== contribution.status) {
            await api.put(`/contribuicoes/mensal/${contribution.id}`, {
              status: newStatus,
              dataPagamento: newStatus === "PAGO" ? new Date() : null,
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

  const inadimplentes = relatorio.filter(
    (r) => r.statusGeral === "INADIMPLENTE",
  ).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Contribuições</h1>
          <p className="text-gray-600 mt-2">
            Relatório de pagamentos dos membros
          </p>
        </div>

        <div className="flex gap-4 items-center">
          <label className="font-medium text-gray-700">Ano:</label>
          <select
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center">
            <div className="text-4xl font-bold text-primary-600">
              {relatorio.length}
            </div>
            <p className="text-gray-600 text-sm mt-2">Total de Membros</p>
          </Card>

          <Card className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {relatorio.length - inadimplentes}
            </div>
            <p className="text-gray-600 text-sm mt-2">Em Dia</p>
          </Card>

          <Card className="text-center">
            <div className="text-4xl font-bold text-red-600">
              {inadimplentes}
            </div>
            <p className="text-gray-600 text-sm mt-2">Inadimplentes</p>
          </Card>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Email
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
                {relatorio.map((row) => (
                  <tr key={row.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {row.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.email}
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
              <p>✓ Contribuição anual criada/encontrada com sucesso.</p>
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
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {monthlyContributions.length === 0 ? (
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800 text-center">
                <p>⚠️ Nenhuma contribuição mensal encontrada para {ano}</p>
                <p className="text-xs mt-1">
                  As contribuições serão criadas quando você salvar.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  📅 Clique no mês para alternar entre <strong>Pago</strong>{" "}
                  (verde) e <strong>Pendente</strong> (vermelho)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {monthlyContributions.map((contrib) => (
                    <button
                      key={contrib.id}
                      onClick={() => {
                        const newStatus =
                          (editData[contrib.id] || contrib.status) === "PAGO"
                            ? "PENDENTE"
                            : "PAGO";
                        setEditData({
                          ...editData,
                          [contrib.id]: newStatus,
                        });
                      }}
                      className={`p-2 rounded text-sm font-medium transition-colors ${
                        (editData[contrib.id] || contrib.status) === "PAGO"
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
