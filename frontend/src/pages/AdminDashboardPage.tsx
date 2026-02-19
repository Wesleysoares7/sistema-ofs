import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../components/Layout.js";
import { Card, Button } from "../components/Common.js";
import { Modal } from "../components/Modal.js";
import { api } from "../services/api.js";
import { DashboardStats, User, Aviso, AvisoTipo } from "../types/index.js";

interface AvisoFormData {
  titulo: string;
  mensagem: string;
  tipo: AvisoTipo;
  publicoAlvo: "MEMBER" | "ALL";
  dataExpiracao: string;
  ativo: boolean;
}

const defaultAvisoFormData: AvisoFormData = {
  titulo: "",
  mensagem: "",
  tipo: "COMUNICADO",
  publicoAlvo: "MEMBER",
  dataExpiracao: "",
  ativo: true,
};

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [fichaModalOpen, setFichaModalOpen] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [avisosLoading, setAvisosLoading] = useState(false);
  const [avisosSubmitting, setAvisosSubmitting] = useState(false);
  const [editingAvisoId, setEditingAvisoId] = useState<string | null>(null);
  const [avisoFormData, setAvisoFormData] =
    useState<AvisoFormData>(defaultAvisoFormData);
  const [avisoMessage, setAvisoMessage] = useState("");
  const [avisoError, setAvisoError] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadStats(), loadAvisos()]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get<DashboardStats>("/users/dashboard/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvisos = async () => {
    try {
      setAvisosLoading(true);
      const response = await api.get<Aviso[]>("/avisos/admin");
      setAvisos(response.data);
    } catch (error) {
      console.error("Erro ao carregar avisos:", error);
      setAvisoError("Erro ao carregar avisos da fraternidade.");
    } finally {
      setAvisosLoading(false);
    }
  };

  const resetAvisoForm = () => {
    setEditingAvisoId(null);
    setAvisoFormData(defaultAvisoFormData);
  };

  const handleAvisoInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setAvisoFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditAviso = (aviso: Aviso) => {
    setEditingAvisoId(aviso.id);
    setAvisoError("");
    setAvisoMessage("");
    setAvisoFormData({
      titulo: aviso.titulo,
      mensagem: aviso.mensagem,
      tipo: aviso.tipo,
      publicoAlvo: aviso.publicoAlvo === "ALL" ? "ALL" : "MEMBER",
      dataExpiracao: aviso.dataExpiracao
        ? new Date(aviso.dataExpiracao).toISOString().slice(0, 10)
        : "",
      ativo: aviso.ativo,
    });
  };

  const buildAvisoPayload = () => {
    const payload: {
      titulo: string;
      mensagem: string;
      tipo: AvisoTipo;
      publicoAlvo: "MEMBER" | "ALL";
      ativo: boolean;
      dataExpiracao?: string | null;
    } = {
      titulo: avisoFormData.titulo.trim(),
      mensagem: avisoFormData.mensagem.trim(),
      tipo: avisoFormData.tipo,
      publicoAlvo: avisoFormData.publicoAlvo,
      ativo: avisoFormData.ativo,
    };

    if (avisoFormData.dataExpiracao) {
      payload.dataExpiracao = new Date(
        `${avisoFormData.dataExpiracao}T23:59:59.000Z`,
      ).toISOString();
    }

    return payload;
  };

  const handleSaveAviso = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!avisoFormData.titulo.trim() || !avisoFormData.mensagem.trim()) {
      setAvisoError("Preencha título e mensagem do aviso.");
      return;
    }

    try {
      setAvisosSubmitting(true);
      setAvisoError("");
      setAvisoMessage("");

      const payload = buildAvisoPayload();

      if (editingAvisoId) {
        await api.put(`/avisos/${editingAvisoId}`, payload);
        setAvisoMessage("Aviso atualizado com sucesso.");
      } else {
        await api.post("/avisos", payload);
        setAvisoMessage("Aviso criado com sucesso.");
      }

      resetAvisoForm();
      await loadAvisos();
    } catch (error) {
      console.error("Erro ao salvar aviso:", error);
      setAvisoError("Não foi possível salvar o aviso.");
    } finally {
      setAvisosSubmitting(false);
    }
  };

  const handleDeleteAviso = async (avisoId: string) => {
    const confirmDelete = window.confirm("Deseja realmente excluir este aviso?");
    if (!confirmDelete) return;

    try {
      setAvisoError("");
      setAvisoMessage("");
      await api.delete(`/avisos/${avisoId}`);
      setAvisoMessage("Aviso excluído com sucesso.");
      await loadAvisos();
    } catch (error) {
      console.error("Erro ao excluir aviso:", error);
      setAvisoError("Não foi possível excluir o aviso.");
    }
  };

  const formatarData = (value?: string | null) => {
    if (!value) return "Sem expiração";
    return new Date(value).toLocaleDateString("pt-BR");
  };

  const getAvisoTipoLabel = (tipo: AvisoTipo) => {
    if (tipo === "EVENTO") return "Evento";
    if (tipo === "LEMBRETE") return "Lembrete";
    return "Comunicado";
  };

  const getAvisoTipoStyle = (tipo: AvisoTipo) => {
    if (tipo === "EVENTO") return "bg-blue-100 text-blue-700";
    if (tipo === "LEMBRETE") return "bg-amber-100 text-amber-700";
    return "bg-green-100 text-green-700";
  };

  const openFichaModal = async () => {
    setFichaModalOpen(true);
    if (members.length > 0) return;

    try {
      setLoadingMembers(true);
      const response = await api.get<User[]>("/users");
      const onlyMembers = response.data.filter(
        (user) => user.role === "MEMBER",
      );
      setMembers(onlyMembers);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const openFichaPreview = (mode: "all" | "single") => {
    const baseUrl = "/admin/ficha-cadastral";
    const url =
      mode === "all"
        ? `${baseUrl}?mode=all`
        : `${baseUrl}?id=${selectedMemberId}`;

    window.open(url, "_blank", "noopener,noreferrer");
    setFichaModalOpen(false);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Dashboard Administrativo
          </h1>
          <p className="text-gray-600 mt-2">Resumo geral do sistema OFS</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="text-center">
              <div className="text-4xl font-bold text-primary-600">
                {stats.totalMembers}
              </div>
              <p className="text-gray-600 text-sm mt-2">Total de Membros</p>
            </Card>

            <Card className="text-center">
              <div className="text-4xl font-bold text-green-600">
                {stats.activeMembers}
              </div>
              <p className="text-gray-600 text-sm mt-2">Membros Ativos</p>
            </Card>

            <Card className="text-center">
              <div className="text-4xl font-bold text-yellow-600">
                {stats.pendingMembers}
              </div>
              <p className="text-gray-600 text-sm mt-2">Pendentes</p>
            </Card>

            <Card className="text-center">
              <div className="text-4xl font-bold text-red-600">
                {stats.inactiveMembers}
              </div>
              <p className="text-gray-600 text-sm mt-2">Inativos</p>
            </Card>

            <Card className="text-center">
              <div className="text-4xl font-bold text-purple-600">
                {stats.totalAdmins}
              </div>
              <p className="text-gray-600 text-sm mt-2">Administradores</p>
            </Card>
          </div>
        )}

        <Card>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Ações Rápidas
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => navigate("/admin/membros")}
            >
              Listar Membros
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate("/admin/contribuicoes")}
            >
              Gerenciar Contribuições
            </Button>
            <Button variant="secondary" onClick={openFichaModal}>
              Ficha Cadastral do Membro
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Avisos da Fraternidade
          </h2>

          {avisoError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {avisoError}
            </div>
          )}

          {avisoMessage && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {avisoMessage}
            </div>
          )}

          <form onSubmit={handleSaveAviso} className="space-y-3 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="titulo"
                value={avisoFormData.titulo}
                onChange={handleAvisoInputChange}
                placeholder="Título do aviso"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />

              <select
                name="tipo"
                value={avisoFormData.tipo}
                onChange={handleAvisoInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="COMUNICADO">Comunicado</option>
                <option value="EVENTO">Evento</option>
                <option value="LEMBRETE">Lembrete</option>
              </select>
            </div>

            <textarea
              name="mensagem"
              value={avisoFormData.mensagem}
              onChange={handleAvisoInputChange}
              placeholder="Mensagem do aviso"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                name="publicoAlvo"
                value={avisoFormData.publicoAlvo}
                onChange={handleAvisoInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="MEMBER">Somente membros</option>
                <option value="ALL">Todos (admin e membro)</option>
              </select>

              <input
                type="date"
                name="dataExpiracao"
                value={avisoFormData.dataExpiracao}
                onChange={handleAvisoInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" loading={avisosSubmitting}>
                {editingAvisoId ? "Atualizar aviso" : "Criar aviso"}
              </Button>
              {editingAvisoId && (
                <Button type="button" variant="secondary" onClick={resetAvisoForm}>
                  Cancelar edição
                </Button>
              )}
            </div>
          </form>

          {avisosLoading ? (
            <p className="text-sm text-gray-600">Carregando avisos...</p>
          ) : avisos.length === 0 ? (
            <p className="text-sm text-gray-600">
              Nenhum aviso cadastrado no momento.
            </p>
          ) : (
            <div className="space-y-3">
              {avisos.map((aviso) => {
                const expirado =
                  !!aviso.dataExpiracao &&
                  new Date(aviso.dataExpiracao).getTime() < Date.now();

                return (
                  <div
                    key={aviso.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">{aviso.titulo}</h3>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getAvisoTipoStyle(
                          aviso.tipo,
                        )}`}
                      >
                        {getAvisoTipoLabel(aviso.tipo)}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {aviso.publicoAlvo === "ALL"
                          ? "Todos"
                          : "Membros"}
                      </span>
                      {!aviso.ativo && (
                        <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">
                          Inativo
                        </span>
                      )}
                      {expirado && (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                          Expirado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{aviso.mensagem}</p>
                    <p className="text-xs text-gray-500 mb-3">
                      Expiração: {formatarData(aviso.dataExpiracao)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleEditAviso(aviso)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => handleDeleteAviso(aviso.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={fichaModalOpen}
        title="Ficha Cadastral do Membro"
        onClose={() => setFichaModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-gray-700">
            Escolha entre gerar a ficha de todos os membros ou de apenas um
            membro especifico.
          </div>

          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={() => openFichaPreview("all")}>
              Gerar ficha de todos os membros
            </Button>

            <div className="border rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar membro
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">Selecione um membro...</option>
                {loadingMembers && (
                  <option value="" disabled>
                    Carregando membros...
                  </option>
                )}
                {!loadingMembers &&
                  members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.nome}
                    </option>
                  ))}
              </select>

              <div className="mt-3">
                <Button
                  variant="secondary"
                  disabled={!selectedMemberId}
                  onClick={() => openFichaPreview("single")}
                >
                  Gerar ficha do membro selecionado
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};
