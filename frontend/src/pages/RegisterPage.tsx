import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Button, Card } from "../components/Common.js";
import { Toast, useToast } from "../components/Toast.js";
import { imageToBase64, isValidImageFile } from "../utils/imageHelper.js";
import { api } from "../services/api.js";
import { Fraternidade } from "../types/index.js";

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
    fraternidadeId: "",
  });

  const [fraternidades, setFraternidades] = useState<Fraternidade[]>([]);
  const [fraternidadesLoading, setFraternidadesLoading] = useState(false);

  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmaSenha, setShowConfirmaSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, setToast } = useToast();

  React.useEffect(() => {
    const loadFraternidades = async () => {
      try {
        setFraternidadesLoading(true);
        const response = await api.get<Fraternidade[]>("/fraternidades/public");
        setFraternidades(response.data);
      } catch (error) {
        console.error("Erro ao carregar fraternidades:", error);
      } finally {
        setFraternidadesLoading(false);
      }
    };

    loadFraternidades();
  }, []);

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

    if (formData.senha !== formData.confirmaSenha) {
      showToast("As senhas não conferem", "error");
      return;
    }

    if (!formData.fraternidadeId) {
      showToast("Selecione a fraternidade local", "error");
      return;
    }

    setLoading(true);

    try {
      // Limpar telefone (remover parênteses, espaços, hífens)
      const telefoneLimpo = formData.telefone.replace(/\D/g, "");
      if (telefoneLimpo.length < 10) {
        throw new Error("Telefone deve ter no mínimo 10 dígitos");
      }

      // CPF opcional: validar apenas quando informado
      const cpfLimpo = formData.cpf.replace(/\D/g, "");
      if (cpfLimpo && !isValidCPF(cpfLimpo)) {
        throw new Error("CPF inválido");
      }

      // Converter data para ISO datetime
      const dataNascimentoISO = new Date(
        formData.dataNascimento + "T00:00:00",
      ).toISOString();

      const payload = {
        nome: formData.nome,
        cpf: cpfLimpo || undefined,
        dataNascimento: dataNascimentoISO,
        telefone: telefoneLimpo,
        email: formData.email,
        senha: formData.senha,
        fraternidadeId: formData.fraternidadeId,
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
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-800 to-primary-600 flex items-center justify-center p-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,214,153,0.14),_transparent_24%)] pointer-events-none" />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Card className="w-full max-w-3xl bg-white/88 backdrop-blur-xl border border-white/60 shadow-2xl shadow-black/10 rounded-3xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm text-primary-700 font-semibold">
            <span>🕊️</span>
            Cadastro OFS
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-4">Crie seu acesso</h2>
          <p className="text-gray-600 mt-2">Preencha seus dados e selecione a fraternidade local para análise.</p>
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF (opcional)
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="Somente números"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
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
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center ring-4 ring-primary-50 shadow-lg">
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
                  <div className="px-4 py-3 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 text-white rounded-xl hover:shadow-lg cursor-pointer text-center font-semibold transition-all">
                    Selecionar Foto
                  </div>
                </label>
                {fotoBase64 && (
                  <button
                    type="button"
                    onClick={handleRemoveFoto}
                    className="w-full px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors text-sm font-semibold"
                  >
                    Remover Foto
                  </button>
                )}
                <p className="text-xs text-gray-500">
                  Formatos: JPEG, PNG, GIF, WebP. Acima de 5MB a imagem é
                  reduzida automaticamente.
                </p>
              </div>
            </div>
          </div>

            {/* Fraternidade Local */}
            <div className="surface-panel rounded-2xl p-5 border border-primary-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Fraternidade Local
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fraternidade de interesse *
                </label>
                <select
                  name="fraternidadeId"
                  value={formData.fraternidadeId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fraternidadeId: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
                >
                  <option value="" disabled>
                    Selecione uma fraternidade
                  </option>
                  {fraternidades.map((fraternidade) => (
                    <option key={fraternidade.id} value={fraternidade.id}>
                      {fraternidade.nomeFraternidade} - {fraternidade.cidade} ({fraternidade.distrito})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Seu cadastro ficará pendente para análise do Administrador Local da fraternidade selecionada.
                </p>
                {fraternidadesLoading && (
                  <p className="text-xs text-gray-500 mt-1">Carregando fraternidades...</p>
                )}
              </div>
            </div>

          {/* Endereço */}
          <div className="surface-panel rounded-2xl p-5 border border-primary-100">
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
                />
              </div>
            </div>
          </div>

          <Button type="submit" variant="primary" loading={loading} className="w-full py-3 text-base">
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
