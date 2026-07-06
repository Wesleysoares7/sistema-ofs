import React, { useState, useEffect } from "react";
import { AdminLayout } from "../components/Layout.js";
import { Card, Button, Badge } from "../components/Common.js";
import { Modal } from "../components/Modal.js";
import { api } from "../services/api.js";
import { Fraternidade, User } from "../types/index.js";
import { useAuth } from "../hooks/useAuth.js";
import {
  imageToBase64,
  isValidImageFile,
  getImageUrl,
} from "../utils/imageHelper.js";
import { includesNormalized } from "../utils/textSearch.js";

export const AdminMembrosPage: React.FC = () => {
  const { user: loggedUser } = useAuth();
  const isRegionalAdmin =
    loggedUser?.role === "ADMIN_REGIONAL" || loggedUser?.role === "ADMIN";

  const isMemberUser = (role?: string) =>
    role === "IRMAO_MEMBRO" || role === "MEMBER";

  const isValidCPF = (value: string) => {
    const cpf = value.replace(/\D/g, "");
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    const calcDigit = (base: string, factor: number) => {
      let total = 0;
      for (let i = 0; i < base.length; i++) {
        total += parseInt(base[i], 10) * (factor - i);
      }
      const remainder = total % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const firstDigit = calcDigit(cpf.slice(0, 9), 10);
    const secondDigit = calcDigit(cpf.slice(0, 10), 11);

    return (
      firstDigit === parseInt(cpf[9], 10) &&
      secondDigit === parseInt(cpf[10], 10)
    );
  };

  const getRoleLabel = (role?: string) =>
    role === "ADMIN_LOCAL" ? "Administrador Local" : "Membro";

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [cadastrosPendentes, setCadastrosPendentes] = useState<User[]>([]);
  const [fraternidades, setFraternidades] = useState<Fraternidade[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFraternidades();
    loadPendingMembers();
  }, []);

  useEffect(() => {
    loadMembers();
  }, [statusFilter]);

  const loadFraternidades = async () => {
    try {
      const response = await api.get<Fraternidade[]>("/fraternidades");
      setFraternidades(response.data);
    } catch (error) {
      console.error("Erro ao carregar fraternidades:", error);
    }
  };

  const loadPendingMembers = async () => {
    try {
      const response = await api.get<User[]>("/users/status/PENDENTE?take=1000");
      setCadastrosPendentes(response.data);
    } catch (error) {
      console.error("Erro ao carregar cadastros pendentes:", error);
    }
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      let url = "/users";
      if (statusFilter) {
        url = `/users/status/${statusFilter}?take=1000`;
      } else {
        url = "/users?take=1000";
      }
      const response = await api.get<User[]>(url);
      setUsuarios(response.data);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFraternidadeLabel = (fraternidadeId?: string | null) => {
    if (!fraternidadeId) {
      return "Não informada";
    }

    const fraternidade = fraternidades.find((item) => item.id === fraternidadeId);
    if (!fraternidade) {
      return "Fraternidade não encontrada";
    }

    return `${fraternidade.nomeFraternidade} - ${fraternidade.cidade} (${fraternidade.distrito})`;
  };

  const handleApproveMember = async (user: User) => {
    if (!user.fraternidadeId) {
      alert(
        "Não é possível aprovar sem fraternidade vinculada. Edite o cadastro e informe a fraternidade antes de aprovar.",
      );
      return;
    }

    try {
      await api.post(`/users/${user.id}/approve`, {
        tipoMembro: "INICIANTE",
      });
      await loadMembers();
      await loadPendingMembers();
    } catch (error) {
      console.error("Erro ao aprovar membro:", error);
      const err = error as any;
      alert(
        err?.response?.data?.error ||
          "Não foi possível aprovar o cadastro no momento.",
      );
    }
  };

  const handleEditMember = async (user: User) => {
    try {
      const response = await api.get<User>(`/users/${user.id}`);
      const detail = response.data;
      const dataNascimento = detail.dataNascimento
        ? new Date(detail.dataNascimento).toISOString().split("T")[0]
        : "";

      setEditingUser(detail);
      setEditData({
        nome: detail.nome,
        cpf: detail.cpf,
        email: detail.email,
        telefone: detail.telefone,
        dataNascimento,
        role: detail.role || "IRMAO_MEMBRO",
        tipoMembro: detail.tipoMembro || "INICIANTE",
        status: detail.status,
        fraternidadeId: detail.fraternidadeId || "",
        fotoBase64: detail.fotoBase64 || null,
        senha: "",
        endereco: {
          rua: detail.endereco?.rua || "",
          numero: detail.endereco?.numero || "",
          bairro: detail.endereco?.bairro || "",
          cidade: detail.endereco?.cidade || "",
          estado: detail.endereco?.estado || "",
          cep: detail.endereco?.cep || "",
        },
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar detalhes do membro:", error);
    }
  };

  const handleDeleteMember = async (user: User) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o membro ${user.nome}? Esta ação não pode ser desfeita.`,
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/users/${user.id}`);
      await loadMembers();
      await loadPendingMembers();
    } catch (error) {
      console.error("Erro ao excluir membro:", error);
      alert("Erro ao excluir membro. Tente novamente.");
    }
  };

  const handleSaveMember = async () => {
    if (!editingUser) return;
    try {
      setSubmitting(true);
      const payload = { ...editData };

      if (!payload.nome) delete payload.nome;
      if (!payload.email) delete payload.email;
      if (payload.cpf !== undefined) {
        const cpfLimpo = String(payload.cpf).replace(/\D/g, "");
        if (cpfLimpo && !isValidCPF(cpfLimpo)) {
          alert("CPF inválido");
          return;
        }
        payload.cpf = cpfLimpo;
      }
      if (!payload.telefone) delete payload.telefone;
      if (!payload.dataNascimento) delete payload.dataNascimento;
      if (!payload.tipoMembro) delete payload.tipoMembro;
      if (!payload.status) delete payload.status;
      if (!payload.role) delete payload.role;

      if (!isRegionalAdmin) {
        delete payload.fraternidadeId;
      } else if (payload.fraternidadeId === "") {
        delete payload.fraternidadeId;
      }

      if (!payload.senha) {
        delete payload.senha;
      }

      if (payload.endereco) {
        const endereco = {
          rua: payload.endereco.rua || undefined,
          numero: payload.endereco.numero || undefined,
          bairro: payload.endereco.bairro || undefined,
          cidade: payload.endereco.cidade || undefined,
          estado: payload.endereco.estado || undefined,
          cep: payload.endereco.cep || undefined,
        };
        const hasAnyEndereco = Object.values(endereco).some(Boolean);
        payload.endereco = hasAnyEndereco ? endereco : undefined;
      }

      await api.put(`/users/${editingUser.id}`, payload);
      setIsModalOpen(false);
      await loadMembers();
      await loadPendingMembers();
    } catch (error) {
      console.error("Erro ao salvar membro:", error);
      const err = error as any;
      const validationMessage = err?.response?.data?.details
        ?.map((d: any) => `${d.path}: ${d.message}`)
        ?.join("\n");
      const message =
        validationMessage ||
        err?.response?.data?.error ||
        err?.message ||
        "Não foi possível salvar as alterações.";

      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      isValidImageFile(file);
      const base64 = await imageToBase64(file);
      setEditData({ ...editData, fotoBase64: base64 });
    } catch (error: any) {
      alert(
        error?.message ||
          "Erro ao processar imagem. Tente outro arquivo de imagem.",
      );
    }
  };

  const handleRemoveFoto = () => {
    setEditData({ ...editData, fotoBase64: null });
  };

  const usuariosFiltrados = usuarios.filter((user) => {
    const termo = busca.trim();
    if (!termo) return true;

    return (
      includesNormalized(user.nome, termo) ||
      includesNormalized(user.email, termo)
    );
  });

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
          <h1 className="text-3xl font-bold text-gray-800">Membros</h1>
          <p className="text-gray-600 mt-2">
            Gerenciar membros da fraternidade
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === null ? "primary" : "secondary"}
            onClick={() => setStatusFilter(null)}
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === "PENDENTE" ? "primary" : "secondary"}
            onClick={() => setStatusFilter("PENDENTE")}
          >
            Pendentes
          </Button>
          <Button
            variant={statusFilter === "ATIVO" ? "primary" : "secondary"}
            onClick={() => setStatusFilter("ATIVO")}
          >
            Ativos
          </Button>
          <Button
            variant={statusFilter === "INATIVO" ? "primary" : "secondary"}
            onClick={() => setStatusFilter("INATIVO")}
          >
            Inativos
          </Button>
        </div>

        <Card>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Cadastros Pendentes</h2>
          <p className="text-sm text-gray-600 mb-4">
            {isRegionalAdmin
              ? "Revise os pedidos de entrada, transfira a fraternidade quando necessário e aprove."
              : "Revise e aprove os pedidos de entrada da sua fraternidade."}
          </p>

          <div className="space-y-3">
            {cadastrosPendentes.length > 0 ? (
              cadastrosPendentes.map((user) => (
                <div
                  key={`pendente-${user.id}`}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user.nome}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Fraternidade solicitada: {getFraternidadeLabel(user.fraternidadeId)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="secondary"
                        onClick={() => handleEditMember(user)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleApproveMember(user)}
                        disabled={!user.fraternidadeId}
                        title={
                          !user.fraternidadeId
                            ? "Vincule uma fraternidade antes de aprovar"
                            : "Aprovar cadastro"
                        }
                      >
                        Aprovar
                      </Button>
                    </div>
                  </div>

                  {!user.fraternidadeId && (
                    <p className="text-xs text-red-600 mt-2">
                      A aprovação está bloqueada: este cadastro não possui fraternidade vinculada.
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Não há cadastros pendentes no momento.</p>
            )}
          </div>
        </Card>

        <div>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou email"
            className="w-full md:max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            Exibindo {usuariosFiltrados.length} de {usuarios.length} membros
          </p>
        </div>

        <Card>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((user) => (
                <div
                  key={user.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {user.nome}
                      </p>
                      <p className="text-xs text-gray-600 break-all">
                        {getFraternidadeLabel(user.fraternidadeId)}
                      </p>
                    </div>
                    <Badge status={user.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                    <span>Tipo: {user.tipoMembro || "—"}</span>
                    <span>Acesso: {getRoleLabel(user.role)}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3">
                    {user.status === "PENDENTE" && (
                      <button
                        onClick={() => handleApproveMember(user)}
                        disabled={!user.fraternidadeId}
                        className="text-primary-600 hover:text-primary-800 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        ✓ Aprovar
                      </button>
                    )}
                    <button
                      onClick={() => handleEditMember(user)}
                      className="text-gray-600 hover:text-gray-800 font-semibold"
                    >
                      ✎ Editar
                    </button>
                    {isMemberUser(user.role) && (
                      <button
                        onClick={() => handleDeleteMember(user)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        🗑 Excluir
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-600 py-4">
                Nenhum membro encontrado
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Nome
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Fraternidade Local
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Tipo
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Acesso
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-4 text-sm text-gray-800">
                        {user.nome}
                      </td>
                      <td className="px-3 md:px-6 py-4 text-sm text-gray-600 break-all">
                        {getFraternidadeLabel(user.fraternidadeId)}
                      </td>
                      <td className="px-3 md:px-6 py-4 text-sm">
                        <Badge status={user.status} />
                      </td>
                      <td className="px-3 md:px-6 py-4 text-sm text-gray-600">
                        {user.tipoMembro || "—"}
                      </td>
                      <td className="px-3 md:px-6 py-4 text-sm text-gray-600">
                        {getRoleLabel(user.role)}
                      </td>
                      <td className="px-3 md:px-6 py-4 text-sm space-x-2">
                        {user.status === "PENDENTE" && (
                          <button
                            onClick={() => handleApproveMember(user)}
                            disabled={!user.fraternidadeId}
                            className="text-primary-600 hover:text-primary-800 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            ✓ Aprovar
                          </button>
                        )}
                        <button
                          onClick={() => handleEditMember(user)}
                          className="text-gray-600 hover:text-gray-800 font-semibold"
                        >
                          ✎ Editar
                        </button>
                        {isMemberUser(user.role) && (
                          <button
                            onClick={() => handleDeleteMember(user)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            🗑 Excluir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 md:px-6 py-4 text-center text-gray-600"
                    >
                      Nenhum membro encontrado
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
        title="Editar Membro"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveMember}
        submitText="Salvar Alterações"
        loading={submitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Foto
            </label>
            <div className="flex flex-col items-center gap-3">
              <img
                src={getImageUrl(editData.fotoBase64)}
                alt="Foto"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
              />
              <div className="flex gap-2 w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="flex-1 text-sm"
                />
                {editData.fotoBase64 && (
                  <button
                    type="button"
                    onClick={handleRemoveFoto}
                    className="px-3 py-2 text-red-600 hover:text-red-800 font-semibold text-sm border border-red-200 rounded"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={editData.nome || ""}
              onChange={(e) =>
                setEditData({ ...editData, nome: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={editData.email || ""}
              onChange={(e) =>
                setEditData({ ...editData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF (opcional)
            </label>
            <input
              type="text"
              value={editData.cpf || ""}
              onChange={(e) =>
                setEditData({ ...editData, cpf: e.target.value })
              }
              placeholder="Somente números"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="text"
              value={editData.telefone || ""}
              onChange={(e) =>
                setEditData({ ...editData, telefone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Nascimento
            </label>
            <input
              type="date"
              value={editData.dataNascimento || ""}
              onChange={(e) =>
                setEditData({ ...editData, dataNascimento: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Perfil de Acesso
            </label>
            {isRegionalAdmin ? (
              <select
                value={editData.role || "IRMAO_MEMBRO"}
                onChange={(e) =>
                  setEditData({ ...editData, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="IRMAO_MEMBRO">Membro</option>
                <option value="ADMIN_LOCAL">Administrador Local</option>
              </select>
            ) : (
              <input
                type="text"
                value={editData.role === "ADMIN_LOCAL" ? "Administrador Local" : "Membro"}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            )}
            {!isRegionalAdmin && (
              <p className="text-xs text-gray-500 mt-1">
                Alteração de perfil de acesso permitida apenas ao Administrador Regional.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha (opcional)
            </label>
            <input
              type="password"
              value={editData.senha || ""}
              onChange={(e) =>
                setEditData({ ...editData, senha: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="Deixe em branco para nao alterar"
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Endereco</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rua
                </label>
                <input
                  type="text"
                  value={editData.endereco?.rua || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      endereco: { ...editData.endereco, rua: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero
                </label>
                <input
                  type="text"
                  value={editData.endereco?.numero || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      endereco: {
                        ...editData.endereco,
                        numero: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={editData.endereco?.bairro || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      endereco: {
                        ...editData.endereco,
                        bairro: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={editData.endereco?.cidade || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      endereco: {
                        ...editData.endereco,
                        cidade: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  value={editData.endereco?.estado || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      endereco: {
                        ...editData.endereco,
                        estado: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={editData.endereco?.cep || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      endereco: { ...editData.endereco, cep: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Membro
            </label>
            <select
              value={editData.tipoMembro || ""}
              onChange={(e) =>
                setEditData({ ...editData, tipoMembro: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Selecione...</option>
              <option value="INICIANTE">Iniciante</option>
              <option value="FORMANDO">Formando</option>
              <option value="PROFESSO">Professo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={editData.status || ""}
              onChange={(e) =>
                setEditData({ ...editData, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="ATIVO">Ativo</option>
              <option value="PENDENTE">Pendente</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fraternidade
            </label>
            {isRegionalAdmin ? (
              <select
                value={editData.fraternidadeId || ""}
                onChange={(e) =>
                  setEditData({ ...editData, fraternidadeId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="" disabled>
                  Selecione a fraternidade de destino
                </option>
                {fraternidades.map((fraternidade) => (
                  <option key={fraternidade.id} value={fraternidade.id}>
                    {fraternidade.nomeFraternidade} - {fraternidade.cidade} ({fraternidade.distrito})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={getFraternidadeLabel(editData.fraternidadeId)}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            )}
            {!isRegionalAdmin && (
              <p className="text-xs text-gray-500 mt-1">
                Transferência de fraternidade permitida apenas ao Administrador Regional.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};
