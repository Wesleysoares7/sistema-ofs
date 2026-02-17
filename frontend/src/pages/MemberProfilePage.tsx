import React, { useState, useEffect } from "react";
import { MemberLayout } from "../components/Layout.js";
import { Card, Button, Badge } from "../components/Common.js";
import { api } from "../services/api.js";
import { User, Endereco } from "../types/index.js";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../components/Toast.js";
import { Toast } from "../components/Toast.js";
import { imageToBase64, isValidImageFile, getImageUrl } from "../utils/imageHelper.js";

export const MemberProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const { toast, showToast, setToast } = useToast();

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await api.get<User>("/auth/profile");
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      showToast("Erro ao carregar perfil", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("endereco.")) {
      const field = name.replace("endereco.", "");
      setFormData({
        ...formData,
        endereco: {
          ...formData.endereco,
          [field]: value,
        } as Endereco,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.put("/auth/profile", formData);
      showToast("Perfil atualizado com sucesso!", "success");
      setEditing(false);
      loadProfile();
    } catch (error: any) {
      showToast(
        error.response?.data?.error || "Erro ao atualizar perfil",
        "error",
      );
    }
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      showToast("Arquivo inválido! Use JPEG, PNG, GIF ou WebP com até 5MB.", "error");
      return;
    }

    try {
      const base64 = await imageToBase64(file);
      setFormData({ ...formData, fotoBase64: base64 });
    } catch (error) {
      showToast("Erro ao processar imagem", "error");
    }
  };

  const handleRemoveFoto = () => {
    setFormData({ ...formData, fotoBase64: null });
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Meu Perfil</h1>
          <p className="text-gray-600 mt-2">
            Gerenciar suas informações pessoais
          </p>
        </div>

        {profile && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Informações Básicas
                </h2>
                <Button
                  type="button"
                  variant={editing ? "secondary" : "primary"}
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? "Cancelar" : "Editar"}
                </Button>
              </div>

              {/* Foto */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Foto de Perfil
                </label>
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={getImageUrl(formData.fotoBase64)}
                    alt="Foto de perfil"
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary-200"
                  />
                  {editing && (
                    <div className="flex gap-2 w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFotoChange}
                        className="flex-1 text-sm"
                      />
                      {formData.fotoBase64 && (
                        <button
                          type="button"
                          onClick={handleRemoveFoto}
                          className="px-3 py-2 text-red-600 hover:text-red-800 font-semibold text-sm border border-red-200 rounded"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={profile.cpf}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={
                      profile.dataNascimento
                        ? profile.dataNascimento.split("T")[0]
                        : ""
                    }
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Badge status={profile.status} className="w-full text-center" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Membro
                  </label>
                  <input
                    type="text"
                    value={profile.tipoMembro || "—"}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>
            </Card>

            {/* Endereço */}
            <Card>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Endereço
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rua
                  </label>
                  <input
                    type="text"
                    name="endereco.rua"
                    value={formData.endereco?.rua || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    name="endereco.numero"
                    value={formData.endereco?.numero || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="endereco.bairro"
                    value={formData.endereco?.bairro || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="endereco.cidade"
                    value={formData.endereco?.cidade || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    name="endereco.estado"
                    value={formData.endereco?.estado || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="endereco.cep"
                    value={formData.endereco?.cep || ""}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>
              </div>
            </Card>

            {editing && (
              <div className="flex gap-4">
                <Button type="submit" variant="primary">
                  Salvar Alterações
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </form>
        )}
      </div>
    </MemberLayout>
  );
};
