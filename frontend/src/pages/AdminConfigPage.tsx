import React, { useState, useEffect } from "react";
import { AdminLayout } from "../components/Layout.js";
import { Card, Button } from "../components/Common.js";
import { api } from "../services/api.js";
import { isValidImageFile, imageToBase64 } from "../utils/imageHelper.js";
import { formatarValorComExtenso } from "../utils/formatCurrency.js";
import { useAuth } from "../hooks/useAuth.js";
import { persistBranding } from "../utils/branding.js";

interface FraternidadeFinanceiraConfig {
  fraternidadeId: string;
  mensalAtiva: boolean;
  valorMensal: number | null;
  chavePix: string | null;
  qrcodePixBase64: string | null;
}

export const AdminConfigPage: React.FC = () => {
  const { user } = useAuth();
  const isLocalAdmin = user?.role === "ADMIN_LOCAL";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [financialConfig, setFinancialConfig] =
    useState<FraternidadeFinanceiraConfig | null>(null);

  const [formData, setFormData] = useState({
    nomeFraternidade: "",
    logoBase64: null as string | null,
    valorAnual: 0,
    descricaoAnual: "",
    chavePix: "",
    qrcodePixBase64: null as string | null,
  });

  const [qrcodePreview, setQrcodePreview] = useState<string | null>(null);
  const [monthlyQrcodePreview, setMonthlyQrcodePreview] =
    useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);

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
          chavePix: configData.chavePix || null,
          qrcodePixBase64: configData.qrcodePixBase64 || null,
        });

        if (configData.qrcodePixBase64) {
          setMonthlyQrcodePreview(configData.qrcodePixBase64);
        } else {
          setMonthlyQrcodePreview(null);
        }
        return;
      }

      const response = await api.get<any>("/config");

      // Detecta se veio encapsulado em {success: true, data: {...}}
      const configData = response.data.data || response.data;

      setFormData({
        nomeFraternidade: configData.nomeFraternidade || "",
        logoBase64: configData.logoBase64 || null,
        valorAnual: configData.valorAnual ?? 0,
        descricaoAnual: configData.descricaoAnual || "",
        chavePix: configData.chavePix || "",
        qrcodePixBase64: configData.qrcodePixBase64 || null,
      });
      if (configData.qrcodePixBase64) {
        setQrcodePreview(configData.qrcodePixBase64);
      }
      if (configData.logoBase64) {
        setLogoPreview(configData.logoBase64);
      }
    } catch (error: any) {
      console.error("❌ Erro ao carregar configurações:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === "string"
          ? error.response.data
          : null) ||
        "Erro ao carregar configurações";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "valorAnual") {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleQrcodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      isValidImageFile(file);
      const base64 = await imageToBase64(file);
      setFormData({
        ...formData,
        qrcodePixBase64: base64 as string,
      });
      setQrcodePreview(base64 as string);
      setErrorMessage("");
    } catch (error: any) {
      console.error("Erro ao processar imagem:", error);
      setErrorMessage(
        error?.message || "Erro ao processar QR code. Tente outra imagem.",
      );
    }
  };

  const handleMonthlyQrcodeChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      isValidImageFile(file);
      const base64 = await imageToBase64(file);

      setFinancialConfig((prev) =>
        prev
          ? {
              ...prev,
              qrcodePixBase64: base64,
            }
          : prev,
      );
      setMonthlyQrcodePreview(base64);
      setErrorMessage("");
    } catch (error: any) {
      console.error("Erro ao processar QR code mensal:", error);
      setErrorMessage(
        error?.message ||
          "Erro ao processar QR code PIX mensal. Tente outra imagem.",
      );
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      isValidImageFile(file);
      const base64 = await imageToBase64(file);
      setFormData({
        ...formData,
        logoBase64: base64 as string,
      });
      setLogoPreview(base64 as string);
      setErrorMessage("");
    } catch (error: any) {
      console.error("Erro ao processar logo:", error);
      setErrorMessage(
        error?.message || "Erro ao processar logo. Tente outra imagem.",
      );
    }
  };

  const handleRemoveQrcode = () => {
    setFormData({
      ...formData,
      qrcodePixBase64: null,
    });
    setQrcodePreview(null);
  };

  const handleRemoveMonthlyQrcode = () => {
    setFinancialConfig((prev) =>
      prev
        ? {
            ...prev,
            qrcodePixBase64: null,
          }
        : prev,
    );
    setMonthlyQrcodePreview(null);
  };

  const handleRemoveLogo = () => {
    setFormData({
      ...formData,
      logoBase64: null,
    });
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocalAdmin) {
      if (!financialConfig) return;

      try {
        setSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        await api.put("/config/fraternidade-financeira", {
          mensalAtiva: financialConfig.mensalAtiva,
          valorMensal: financialConfig.mensalAtiva
            ? financialConfig.valorMensal || 0
            : null,
          chavePix: financialConfig.chavePix?.trim()
            ? financialConfig.chavePix.trim()
            : null,
          qrcodePixBase64: financialConfig.qrcodePixBase64,
        });

        setSuccessMessage("✅ Configuração mensal da fraternidade salva com sucesso!");
        await loadConfig();

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } catch (error) {
        console.error("❌ Erro ao salvar configuração mensal:", error);
        const message =
          (error as any)?.response?.data?.error ||
          "Erro ao salvar configuração mensal. Tente novamente.";
        setErrorMessage(message);
      } finally {
        setSubmitting(false);
      }

      return;
    }

    if (formData.valorAnual < 0) {
      setErrorMessage("Os valores não podem ser negativos");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const updateData: any = {
        nomeFraternidade: formData.nomeFraternidade || null,
        logoBase64: formData.logoBase64,
        valorAnual: formData.valorAnual,
        descricaoAnual: formData.descricaoAnual || undefined,
        chavePix: formData.chavePix.trim() ? formData.chavePix.trim() : null,
        qrcodePixBase64: formData.qrcodePixBase64,
      };

      await api.put("/config", updateData);
      persistBranding({
        nomeFraternidade: updateData.nomeFraternidade || undefined,
        logoBase64: updateData.logoBase64 || undefined,
      });

      setSuccessMessage("✅ Configurações atualizadas com sucesso!");
      await loadConfig();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("❌ Erro ao atualizar configurações:", error);
      const message =
        (error as any)?.response?.data?.error ||
        "Erro ao atualizar configurações. Tente novamente.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (isLocalAdmin) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-800">
                ⚙️ Configuração Local de Mensalidade
              </h1>
            </div>

            {errorMessage && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  💰 Mensalidade da Fraternidade
                </h2>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!financialConfig?.mensalAtiva}
                    onChange={(e) =>
                      setFinancialConfig((prev) =>
                        prev
                          ? { ...prev, mensalAtiva: e.target.checked }
                          : prev,
                      )
                    }
                  />
                  Esta fraternidade cobra mensalidade
                </label>

                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor mensal local (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!financialConfig?.mensalAtiva}
                    value={financialConfig?.valorMensal ?? 0}
                    onChange={(e) =>
                      setFinancialConfig((prev) =>
                        prev
                          ? { ...prev, valorMensal: parseFloat(e.target.value) || 0 }
                          : prev,
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                    placeholder="0.00"
                  />
                </div>

                <p className="text-sm text-gray-500">
                  Valor atual: {formatarValorComExtenso(financialConfig?.valorMensal || 0)}
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave PIX para contribuição mensal
                  </label>
                  <input
                    type="text"
                    disabled={!financialConfig?.mensalAtiva}
                    value={financialConfig?.chavePix || ""}
                    onChange={(e) =>
                      setFinancialConfig((prev) =>
                        prev
                          ? { ...prev, chavePix: e.target.value }
                          : prev,
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                    placeholder="Ex: email@dominio.com, CPF ou telefone"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Chave PIX usada para recebimento da mensalidade desta fraternidade.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code PIX da mensalidade
                  </label>

                  {monthlyQrcodePreview ? (
                    <div className="mb-4">
                      <div className="bg-gray-100 p-4 rounded-lg inline-block">
                        <img
                          src={monthlyQrcodePreview}
                          alt="QR Code PIX mensal"
                          className="w-48 h-48 object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        disabled={!financialConfig?.mensalAtiva}
                        onClick={handleRemoveMonthlyQrcode}
                        className="ml-4 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg"
                      >
                        ❌ Remover QR Code
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-4 rounded-lg text-center mb-4">
                      <p className="text-gray-500">Nenhum QR code mensal carregado</p>
                    </div>
                  )}

                  <label
                    className={`block px-4 py-3 border-2 border-dashed rounded-lg text-center transition ${
                      financialConfig?.mensalAtiva
                        ? "bg-blue-50 border-blue-300 cursor-pointer hover:bg-blue-100"
                        : "bg-gray-100 border-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <span
                      className={`font-medium ${
                        financialConfig?.mensalAtiva
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      📤 Fazer upload do QR Code PIX mensal
                    </span>
                    <input
                      type="file"
                      onChange={handleMonthlyQrcodeChange}
                      accept="image/*"
                      disabled={!financialConfig?.mensalAtiva}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos aceitos: PNG, JPG, GIF, WebP. Acima de 5MB, o
                    sistema reduz automaticamente.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {submitting ? "💾 Salvando..." : "💾 Salvar Configuração Mensal"}
              </Button>
            </form>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              ⚙️ Configurações do Sistema
            </h1>
          </div>

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {successMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-6"
          >
            <div className="border-b pb-6 xl:border xl:border-gray-200 xl:rounded-lg xl:p-6 xl:pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                🏷️ Identidade da Fraternidade
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Fraternidade
                  </label>
                  <input
                    type="text"
                    name="nomeFraternidade"
                    value={formData.nomeFraternidade}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Fraternidade São Francisco de Assis"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Será exibido como: Ordem Franciscana Secular - Nome da
                    Fraternidade
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo do Sistema
                  </label>

                  {logoPreview ? (
                    <div className="mb-4 flex items-center gap-4">
                      <div className="bg-gray-100 p-3 rounded-lg inline-block">
                        <img
                          src={logoPreview}
                          alt="Logo do sistema"
                          className="w-24 h-24 object-cover rounded"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                      >
                        ❌ Remover Logo
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-4 rounded-lg text-center mb-4">
                      <p className="text-gray-500">Nenhuma logo carregada</p>
                    </div>
                  )}

                  <label className="block px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg text-center cursor-pointer hover:bg-blue-100 transition">
                    <span className="text-blue-600 font-medium">
                      📤 Fazer upload da Logo
                    </span>
                    <input
                      type="file"
                      onChange={handleLogoChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos aceitos: PNG, JPG, GIF, WebP. Acima de 5MB, o
                    sistema reduz automaticamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Seção de Valores */}
            <div className="border-b pb-6 xl:border xl:border-gray-200 xl:rounded-lg xl:p-6 xl:pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                💰 Valores de Contribuição
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Anual (R$)
                  </label>
                  <input
                    type="number"
                    name="valorAnual"
                    value={formData.valorAnual}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Valor que cada membro deve pagar anualmente
                  </p>
                </div>
              </div>

              {/* Descrições dos Valores */}
              <div className="mt-6 pt-6 border-t space-y-4">
                <p className="text-sm text-gray-600 italic">
                  ℹ️ Adicione descrições para explicar aos membros o que esses
                  valores cobrem
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Descrição da Contribuição Anual
                  </label>
                  <textarea
                    name="descricaoAnual"
                    value={formData.descricaoAnual}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        descricaoAnual: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={2}
                    placeholder="Ex: Contribuição anual para manutenção das atividades e eventos da comunidade"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Exemplo: 'Contribuição anual para manutenção das atividades
                    e eventos da comunidade'
                  </p>
                </div>

              </div>
            </div>

            {/* Seção de PIX */}
            <div className="border-b pb-6 xl:col-span-2 xl:border xl:border-gray-200 xl:rounded-lg xl:p-6 xl:pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                💳 Informações de Pagamento PIX
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    name="chavePix"
                    value={formData.chavePix}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: seu-email@dominio.com ou CPF ou CNPJ"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Email, CPF, CNPJ ou chave telefônica para PIX
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code PIX
                  </label>

                  {qrcodePreview ? (
                    <div className="mb-4">
                      <div className="bg-gray-100 p-4 rounded-lg inline-block">
                        <img
                          src={qrcodePreview}
                          alt="QR Code PIX"
                          className="w-48 h-48 object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleRemoveQrcode}
                        className="ml-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                      >
                        ❌ Remover QR Code
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-4 rounded-lg text-center mb-4">
                      <p className="text-gray-500">Nenhum QR code carregado</p>
                    </div>
                  )}

                  <label className="block px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg text-center cursor-pointer hover:bg-blue-100 transition">
                    <span className="text-blue-600 font-medium">
                      📤 Fazer upload do QR Code PIX
                    </span>
                    <input
                      type="file"
                      onChange={handleQrcodeChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos aceitos: PNG, JPG, GIF, WebP. Acima de 5MB, o
                    sistema reduz automaticamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-blue-50 p-4 rounded-lg xl:col-span-2">
              <h3 className="font-semibold text-blue-900 mb-2">
                📋 Resumo das Configurações
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>
                  <strong>Título:</strong> Ordem Franciscana Secular
                  {formData.nomeFraternidade
                    ? ` - ${formData.nomeFraternidade}`
                    : ""}
                </p>
                <p>
                  <strong>Logo:</strong>{" "}
                  {logoPreview ? "Carregada ✅" : "Não carregada"}
                </p>
                <p>
                  <strong>Valor Anual:</strong>{" "}
                  {formatarValorComExtenso(formData.valorAnual || 0)}
                </p>
                {formData.descricaoAnual && (
                  <p className="ml-4 text-xs text-blue-700 italic">
                    📝 {formData.descricaoAnual}
                  </p>
                )}
                <p>
                  <strong>Chave PIX:</strong>{" "}
                  {formData.chavePix || "Não informada"}
                </p>
                <p>
                  <strong>QR Code:</strong>{" "}
                  {qrcodePreview ? "Carregado ✅" : "Não carregado"}
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4 xl:col-span-2">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {submitting ? "💾 Salvando..." : "💾 Salvar Configurações"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};
