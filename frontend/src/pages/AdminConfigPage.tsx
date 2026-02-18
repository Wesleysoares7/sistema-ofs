import React, { useState, useEffect } from "react";
import { AdminLayout } from "../components/Layout.js";
import { Card, Button } from "../components/Common.js";
import { api } from "../services/api.js";
import { isValidImageFile, imageToBase64 } from "../utils/imageHelper.js";
import { formatarValorComExtenso } from "../utils/formatCurrency.js";

interface ConfigData {
  id: string;
  nomeFraternidade?: string;
  logoBase64?: string;
  valorAnual: number;
  descricaoAnual?: string;
  valorMensal: number;
  descricaoMensal?: string;
  chavePix?: string;
  qrcodePixBase64?: string;
  createdAt: string;
  updatedAt: string;
}

export const AdminConfigPage: React.FC = () => {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    nomeFraternidade: "",
    logoBase64: null as string | null,
    valorAnual: 0,
    descricaoAnual: "",
    valorMensal: 0,
    descricaoMensal: "",
    chavePix: "",
    qrcodePixBase64: null as string | null,
  });

  const [qrcodePreview, setQrcodePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      console.log("📥 Carregando configurações...");
      const response = await api.get<any>("/config");
      console.log("✅ Response bruto:", response.data);
      
      // Detecta se veio encapsulado em {success: true, data: {...}}
      const configData = response.data.data || response.data;
      console.log("✅ ConfigData extraído:", configData);
      
      setConfig(configData);
      setFormData({
        nomeFraternidade: configData.nomeFraternidade || "",
        logoBase64: configData.logoBase64 || null,
        valorAnual: configData.valorAnual ?? 0,
        descricaoAnual: configData.descricaoAnual || "",
        valorMensal: configData.valorMensal ?? 0,
        descricaoMensal: configData.descricaoMensal || "",
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
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        "Erro ao carregar configurações";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "valorAnual" || name === "valorMensal") {
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

    if (!isValidImageFile(file)) {
      setErrorMessage("Arquivo inválido. Use PNG, JPG, GIF ou WebP com até 5MB");
      return;
    }

    try {
      const base64 = await imageToBase64(file);
      setFormData({
        ...formData,
        qrcodePixBase64: base64 as string,
      });
      setQrcodePreview(base64 as string);
      setErrorMessage("");
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      setErrorMessage("Erro ao processar QR code");
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!isValidImageFile(file)) {
      setErrorMessage("Arquivo inválido. Use PNG, JPG, GIF ou WebP com até 5MB");
      return;
    }

    try {
      const base64 = await imageToBase64(file);
      setFormData({
        ...formData,
        logoBase64: base64 as string,
      });
      setLogoPreview(base64 as string);
      setErrorMessage("");
    } catch (error) {
      console.error("Erro ao processar logo:", error);
      setErrorMessage("Erro ao processar logo");
    }
  };

  const handleRemoveQrcode = () => {
    setFormData({
      ...formData,
      qrcodePixBase64: null,
    });
    setQrcodePreview(null);
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

    if (formData.valorAnual < 0 || formData.valorMensal < 0) {
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
        valorMensal: formData.valorMensal,
        descricaoMensal: formData.descricaoMensal || undefined,
        chavePix: formData.chavePix || undefined,
        qrcodePixBase64: formData.qrcodePixBase64,
      };

      console.log("💾 Enviando dados para salvar:", updateData);
      const saveResponse = await api.put("/config", updateData);
      console.log("✅ Resposta do servidor:", saveResponse.data);

      setSuccessMessage("✅ Configurações atualizadas com sucesso!");
      console.log("⏳ Recarregando configurações...");
      await loadConfig();
      console.log("✅ Configurações recarregadas!");

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

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b pb-6">
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
                    Será exibido como: Ordem Franciscana Secular - Nome da Fraternidade
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
                    Formatos aceitos: PNG, JPG, GIF, WebP (máx 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Seção de Valores */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                💰 Valores de Contribuição
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Mensal (R$)
                  </label>
                  <input
                    type="number"
                    name="valorMensal"
                    value={formData.valorMensal}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Valor que cada membro deve pagar mensalmente
                  </p>
                </div>
              </div>

              {/* Descrições dos Valores */}
              <div className="mt-6 pt-6 border-t space-y-4">
                <p className="text-sm text-gray-600 italic">
                  ℹ️ Adicione descrições para explicar aos membros o que esses valores cobrem
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Descrição da Contribuição Anual
                  </label>
                  <textarea
                    name="descricaoAnual"
                    value={formData.descricaoAnual}
                    onChange={(e) => setFormData({...formData, descricaoAnual: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={2}
                    placeholder="Ex: Contribuição anual para manutenção das atividades e eventos da comunidade"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Exemplo: 'Contribuição anual para manutenção das atividades e eventos da comunidade'
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Descrição da Contribuição Mensal
                  </label>
                  <textarea
                    name="descricaoMensal"
                    value={formData.descricaoMensal}
                    onChange={(e) => setFormData({...formData, descricaoMensal: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={2}
                    placeholder="Ex: Contribuição mensal para material, refrescos e despesas operacionais"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Exemplo: 'Contribuição mensal para material, refrescos e despesas operacionais'
                  </p>
                </div>
              </div>
            </div>

            {/* Seção de PIX */}
            <div className="border-b pb-6">
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
                    Formatos aceitos: PNG, JPG, GIF, WebP (máx 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                📋 Resumo das Configurações
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>
                  <strong>Título:</strong> Ordem Franciscana Secular{formData.nomeFraternidade ? ` - ${formData.nomeFraternidade}` : ""}
                </p>
                <p>
                  <strong>Logo:</strong> {logoPreview ? "Carregada ✅" : "Não carregada"}
                </p>
                <p>
                  <strong>Valor Anual:</strong> {formatarValorComExtenso(formData.valorAnual || 0)}
                </p>
                {formData.descricaoAnual && (
                  <p className="ml-4 text-xs text-blue-700 italic">
                    📝 {formData.descricaoAnual}
                  </p>
                )}
                <p>
                  <strong>Valor Mensal:</strong> {formatarValorComExtenso(formData.valorMensal || 0)}
                </p>
                {formData.descricaoMensal && (
                  <p className="ml-4 text-xs text-blue-700 italic">
                    📝 {formData.descricaoMensal}
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
            <div className="flex gap-4 pt-4">
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
