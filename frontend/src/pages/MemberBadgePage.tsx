import React, { useEffect, useMemo, useState } from "react";
import { MemberLayout } from "../components/Layout.js";
import { Button, Card } from "../components/Common.js";
import { api } from "../services/api.js";

interface BadgeResponse {
  token: string;
  verificationUrl: string;
  member: {
    id: string;
    nome: string;
    tipoMembro?: string | null;
    status: string;
    role: string;
    fotoBase64?: string | null;
    fraternidade: {
      id: string;
      nomeFraternidade: string;
      cidade: string;
      distrito: string;
    } | null;
  };
  issuedAt: string;
}

export const MemberBadgePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BadgeResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBadge = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get<BadgeResponse>("/auth/badge");
        setData(response.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.error ||
            "Não foi possível carregar o crachá agora.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadBadge();
  }, []);

  const qrCodeUrl = useMemo(() => {
    if (!data?.verificationUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
      data.verificationUrl,
    )}`;
  }, [data?.verificationUrl]);

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center h-full">Carregando...</div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <h1 className="text-3xl font-bold text-gray-800">Meu Crachá OFS</h1>
          <p className="text-gray-600 mt-2">
            Apresente este crachá e permita a validação via QR Code.
          </p>
        </Card>

        {error && (
          <Card>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
              {error}
            </div>
          </Card>
        )}

        {data && (
          <Card className="border border-primary-100">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 items-start">
              <div>
                <div className="flex items-center gap-4">
                  <img
                    src={data.member.fotoBase64 || "https://placehold.co/96x96?text=OFS"}
                    alt="Foto do membro"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary-200"
                  />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{data.member.nome}</p>
                    <p className="text-sm text-gray-600">
                      {data.member.tipoMembro || "Membro"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Status: {data.member.status}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Fraternidade:</strong>{" "}
                    {data.member.fraternidade?.nomeFraternidade || "Não informada"}
                  </p>
                  <p>
                    <strong>Cidade:</strong>{" "}
                    {data.member.fraternidade?.cidade || "Não informada"}
                  </p>
                  <p>
                    <strong>Distrito:</strong>{" "}
                    {data.member.fraternidade?.distrito || "Não informado"}
                  </p>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => window.print()}
                  >
                    Imprimir Crachá
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigator.clipboard.writeText(data.verificationUrl)}
                  >
                    Copiar link de validação
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 text-center bg-white">
                <img
                  src={qrCodeUrl}
                  alt="QR Code de validação do crachá"
                  className="w-[260px] h-[260px] mx-auto"
                />
                <p className="text-xs text-gray-500 mt-3">
                  Escaneie para validar a autenticidade do crachá.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MemberLayout>
  );
};
