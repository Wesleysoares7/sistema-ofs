import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Button, Card } from "../components/Common.js";
import { Toast, useToast } from "../components/Toast.js";
import {
  imageToBase64,
  isValidImageFile,
  getImageUrl,
} from "../utils/imageHelper.js";

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    email: "",
    senha: "",
    confirmaSenha: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmaSenha, setShowConfirmaSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, setToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (file) {
        isValidImageFile(file);
        const base64 = await imageToBase64(file);
        setFotoBase64(base64);
        showToast("Foto carregada com sucesso", "success");
      }
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const handleRemoveFoto = () => {
    setFotoBase64(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.senha !== formData.confirmaSenha) {
      showToast("As senhas não conferem", "error");
      return;
    }

    setLoading(true);

    try {
      // Limpar telefone (remover parênteses, espaços, hífens)
      const telefoneLimpo = formData.telefone.replace(/\D/g, "");
      if (telefoneLimpo.length < 10) {
        throw new Error("Telefone deve ter no mínimo 10 dígitos");
      }

      // Limpar CPF (remover hífens, pontos)
      const cpfLimpo = formData.cpf.replace(/\D/g, "");
      if (cpfLimpo.length !== 11) {
        throw new Error("CPF deve ter exatamente 11 dígitos");
      }

      // Converter data para ISO datetime
      const dataNascimentoISO = new Date(
        formData.dataNascimento + "T00:00:00",
      ).toISOString();

      // Validar tamanho da foto se existir
      if (fotoBase64 && fotoBase64.length > 500000) {
        throw new Error("Foto muito grande! Máximo 5MB");
      }

      const payload = {
        nome: formData.nome,
        cpf: cpfLimpo,
        dataNascimento: dataNascimentoISO,
        telefone: telefoneLimpo,
        email: formData.email,
        senha: formData.senha,
        fotoBase64: fotoBase64 || undefined,
        endereco: {
          rua: formData.rua,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado.toUpperCase(),
          cep: formData.cep,
        },
      };

      console.log("Enviando cadastro com dados:", {
        ...payload,
        fotoBase64: payload.fotoBase64
          ? `[${payload.fotoBase64.length} chars]`
          : undefined,
        senha: "[PROTEGIDA]",
      });

      await register(payload);

      navigate("/login", {
        state: {
          toast: {
            message: "Cadastro realizado com sucesso! Aguarde aprovação.",
            type: "success",
          },
        },
      });
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error);
      showToast(error.message || "Erro ao cadastrar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4 py-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Card className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🕊️</h1>
          <h2 className="text-2xl font-bold text-gray-800">Cadastro OFS</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF *
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="11999999999"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(11) 98765-4321"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha (mín. 8 caracteres) *
                </label>
                <div className="relative">
                  <input
                    type={showSenha ? "text" : "password"}
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSenha ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 3C5.522 3 1.732 5.943.458 10c.3.959.774 1.877 1.403 2.734l1.414-1.414A6 6 0 1110 9a1 1 0 00-2 0 4 4 0 11-4.414-4.414L3.293 3.293zM15.172 13.338A7 7 0 1010 5a1 1 0 102 0c0-3.866-3.134-7-7-7a7 7 0 100 14 7 7 0 005.172-2.338z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmaSenha ? "text" : "password"}
                    name="confirmaSenha"
                    value={formData.confirmaSenha}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmaSenha(!showConfirmaSenha)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmaSenha ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 3C5.522 3 1.732 5.943.458 10c.3.959.774 1.877 1.403 2.734l1.414-1.414A6 6 0 1110 9a1 1 0 00-2 0 4 4 0 11-4.414-4.414L3.293 3.293zM15.172 13.338A7 7 0 1010 5a1 1 0 102 0c0-3.866-3.134-7-7-7a7 7 0 100 14 7 7 0 005.172-2.338z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Foto de Perfil */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Foto de Perfil (Opcional)
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {fotoBase64 ? (
                  <img
                    src={fotoBase64}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                  <div className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer text-center font-medium transition-colors">
                    Selecionar Foto
                  </div>
                </label>
                {fotoBase64 && (
                  <button
                    type="button"
                    onClick={handleRemoveFoto}
                    className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Remover Foto
                  </button>
                )}
                <p className="text-xs text-gray-500">
                  Máximo 5MB. Formatos: JPEG, PNG, GIF, WebP
                </p>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rua *
                </label>
                <input
                  type="text"
                  name="rua"
                  value={formData.rua}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro *
                </label>
                <input
                  type="text"
                  name="bairro"
                  value={formData.bairro}
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
                  Estado *
                </label>
                <input
                  type="text"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  placeholder="SP"
                  maxLength={2}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP *
                </label>
                <input
                  type="text"
                  name="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  placeholder="01310-100"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
          >
            Cadastrar
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Já tem conta?{" "}
          <Link
            to="/login"
            className="text-primary-600 hover:underline font-semibold"
          >
            Faça login
          </Link>
        </p>

        <p className="text-center text-xs text-gray-500 mt-4">
          Produzido por{" "}
          <a
            href="https://www.linkedin.com/in/wesley-soares-64154a239/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary-700 hover:underline"
          >
            WSWEB
          </a>
        </p>
      </Card>
    </div>
  );
};
