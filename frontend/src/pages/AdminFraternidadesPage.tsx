import React, { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../components/Layout.js";
import { Button, Card } from "../components/Common.js";
import { api } from "../services/api.js";
import { Fraternidade } from "../types/index.js";

const DISTRITOS_OFS = [
  "1º Distrito",
  "2º Distrito",
  "3º Distrito",
  "4º Distrito",
  "5º Distrito",
  "6º Distrito",
  "7º Distrito",
  "8º Distrito",
  "9º Distrito",
  "10º Distrito",
];

type FormData = {
  nomeFraternidade: string;
  cidade: string;
  distrito: string;
  dataFundacao: string;
  status: "ATIVA" | "INATIVA";
  contatoMinistro: string;
};

const initialFormData: FormData = {
  nomeFraternidade: "",
  cidade: "",
  distrito: "1º Distrito",
  dataFundacao: "",
  status: "ATIVA",
  contatoMinistro: "",
};

export const AdminFraternidadesPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingFraternidadeId, setEditingFraternidadeId] = useState<string | null>(null);
  const [fraternidades, setFraternidades] = useState<Fraternidade[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [distritoFilter, setDistritoFilter] = useState<string>("TODOS");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadFraternidades();
  }, []);

  const loadFraternidades = async () => {
    try {
      setListLoading(true);
      const response = await api.get<Fraternidade[]>("/fraternidades");
      setFraternidades(response.data);
    } catch (error) {
      setFeedback({
        type: "error",
        message: "Não foi possível carregar a lista de fraternidades.",
      });
    } finally {
      setListLoading(false);
    }
  };

  const fraternidadesFiltradas = useMemo(() => {
    if (distritoFilter === "TODOS") {
      return fraternidades;
    }

    return fraternidades.filter((f) => f.distrito === distritoFilter);
  }, [distritoFilter, fraternidades]);

  const fraternidadesPorDistrito = useMemo(() => {
    const grupos = fraternidadesFiltradas.reduce(
      (acc, fraternidade) => {
        const chave = fraternidade.distrito;
        if (!acc[chave]) {
          acc[chave] = [];
        }
        acc[chave].push(fraternidade);
        return acc;
      },
      {} as Record<string, Fraternidade[]>,
    );

    return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
  }, [fraternidadesFiltradas]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const startEdit = (fraternidade: Fraternidade) => {
    setEditingFraternidadeId(fraternidade.id);
    setFormData({
      nomeFraternidade: fraternidade.nomeFraternidade,
      cidade: fraternidade.cidade,
      distrito: fraternidade.distrito,
      dataFundacao: new Date(fraternidade.dataFundacao).toISOString().slice(0, 10),
      status: fraternidade.status,
      contatoMinistro: fraternidade.contatoMinistro,
    });
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingFraternidadeId(null);
    setFormData(initialFormData);
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      dataFundacao: new Date(`${formData.dataFundacao}T00:00:00`).toISOString(),
    };

    try {
      setSubmitting(true);
      setFeedback(null);

      if (editingFraternidadeId) {
        await api.put(`/fraternidades/${editingFraternidadeId}`, payload);
      } else {
        await api.post("/fraternidades", payload);
      }

      setFormData(initialFormData);
      setEditingFraternidadeId(null);
      await loadFraternidades();
      setFeedback({
        type: "success",
        message: editingFraternidadeId
          ? "Fraternidade atualizada com sucesso!"
          : "Fraternidade cadastrada com sucesso!",
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Não foi possível cadastrar a fraternidade.";

      setFeedback({
        type: "error",
        message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Cadastro de Fraternidades</h1>
          <p className="text-gray-600 mt-2">
            Registre as Fraternidades Locais da OFS para o Conselho Regional.
          </p>
        </div>

        {feedback && (
          <Card>
            <div
              className={`rounded-lg border p-3 text-sm ${
                feedback.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {feedback.message}
            </div>
          </Card>
        )}

        <Card>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingFraternidadeId
              ? "Editar Fraternidade Local"
              : "Dados da Fraternidade Local"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Fraternidade *
                </label>
                <input
                  type="text"
                  name="nomeFraternidade"
                  value={formData.nomeFraternidade}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade *
                </label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distrito *
                </label>
                <select
                  name="distrito"
                  value={formData.distrito}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  {DISTRITOS_OFS.map((distrito) => (
                    <option key={distrito} value={distrito}>
                      {distrito}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Fundação *
                </label>
                <input
                  type="date"
                  name="dataFundacao"
                  value={formData.dataFundacao}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="ATIVA">Ativa</option>
                  <option value="INATIVA">Inativa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contato do Ministro *
                </label>
                <input
                  type="text"
                  name="contatoMinistro"
                  value={formData.contatoMinistro}
                  onChange={handleChange}
                  required
                  placeholder="Nome e/ou telefone"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="primary" loading={submitting}>
                  {editingFraternidadeId
                    ? "Salvar Alterações"
                    : "Cadastrar Fraternidade"}
                </Button>
                {editingFraternidadeId && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={cancelEdit}
                  >
                    Cancelar Edição
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Fraternidades Cadastradas
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Visualização organizada por distrito para acompanhamento regional.
              </p>
            </div>

            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Distrito
              </label>
              <select
                value={distritoFilter}
                onChange={(e) => setDistritoFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="TODOS">Todos os Distritos</option>
                {DISTRITOS_OFS.map((distrito) => (
                  <option key={distrito} value={distrito}>
                    {distrito}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {listLoading ? (
            <p className="text-sm text-gray-600">Carregando fraternidades...</p>
          ) : fraternidadesPorDistrito.length === 0 ? (
            <p className="text-sm text-gray-600">
              Nenhuma fraternidade encontrada para o filtro selecionado.
            </p>
          ) : (
            <div className="space-y-5">
              {fraternidadesPorDistrito.map(([distrito, itens]) => (
                <div key={distrito} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{distrito}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700 font-medium">
                      {itens.length} fraternidade{itens.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {itens.map((fraternidade) => (
                      <div
                        key={fraternidade.id}
                        className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                      >
                        <p className="font-semibold text-gray-800">
                          {fraternidade.nomeFraternidade}
                        </p>
                        <p className="text-sm text-gray-600">Cidade: {fraternidade.cidade}</p>
                        <p className="text-sm text-gray-600">
                          Fundação: {new Date(fraternidade.dataFundacao).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-sm text-gray-600">
                          Contato do Ministro: {fraternidade.contatoMinistro}
                        </p>
                        <p className="text-sm mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              fraternidade.status === "ATIVA"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {fraternidade.status === "ATIVA" ? "Ativa" : "Inativa"}
                          </span>
                        </p>
                        <div className="mt-3">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => startEdit(fraternidade)}
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};
