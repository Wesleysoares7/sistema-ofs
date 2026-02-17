import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../components/Layout.js";
import { Card, Button, Badge } from "../components/Common.js";
import { Modal } from "../components/Modal.js";
import { api } from "../services/api.js";
import { DashboardStats } from "../types/index.js";
import { User } from "../types/index.js";

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fichaModalOpen, setFichaModalOpen] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

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

  const openFichaModal = async () => {
    setFichaModalOpen(true);
    if (members.length > 0) return;

    try {
      setLoadingMembers(true);
      const response = await api.get<User[]>("/users");
      const onlyMembers = response.data.filter((user) => user.role === "MEMBER");
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
          <p className="text-gray-600 mt-2">
            Resumo geral do sistema OFS
          </p>
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
      </div>

      <Modal
        isOpen={fichaModalOpen}
        title="Ficha Cadastral do Membro"
        onClose={() => setFichaModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-gray-700">
            Escolha entre gerar a ficha de todos os membros ou de apenas um membro especifico.
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={() => openFichaPreview("all")}
            >
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
