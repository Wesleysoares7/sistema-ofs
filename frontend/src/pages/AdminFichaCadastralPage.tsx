import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { User } from "../types/index.js";
import { includesNormalized } from "../utils/textSearch.js";

interface FichaUser extends User {
  fotoBase64?: string | null;
}

interface BrandingConfig {
  nomeFraternidade?: string;
  logoBase64?: string;
}

export const AdminFichaCadastralPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<FichaUser[]>([]);
  const [busca, setBusca] = useState("");
  const [branding, setBranding] = useState<BrandingConfig | null>(null);

  const memberId = searchParams.get("id");
  const mode = searchParams.get("mode");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [configResponse, membersResponse] = await Promise.all([
          api.get<any>("/config"),
          memberId
            ? api.get<FichaUser>(`/users/${memberId}`)
            : mode === "all"
              ? api.get<FichaUser[]>("/users/detailed")
              : Promise.resolve({ data: [] as FichaUser[] }),
        ]);

        const configData = configResponse.data.data || configResponse.data;
        setBranding({
          nomeFraternidade: configData.nomeFraternidade,
          logoBase64: configData.logoBase64,
        });

        if (memberId) {
          setMembers([membersResponse.data as FichaUser]);
        } else if (mode === "all") {
          const onlyMembers = (membersResponse.data as FichaUser[]).filter(
            (user) => user.role === "MEMBER",
          );
          setMembers(onlyMembers);
        } else {
          setMembers([]);
        }
      } catch (error) {
        console.error("Erro ao carregar ficha cadastral:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [memberId, mode]);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (members.length === 0) {
    return (
      <div className="p-6">
        Nenhum membro encontrado para gerar a ficha cadastral.
      </div>
    );
  }

  const filteredMembers = members.filter((member) => {
    const termo = busca.trim();
    if (!termo) return true;

    return (
      includesNormalized(member.nome, termo) ||
      includesNormalized(member.email, termo)
    );
  });

  const tituloSistema = `Ordem Franciscana Secular${branding?.nomeFraternidade ? ` - ${branding.nomeFraternidade}` : ""}`;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 16mm 14mm;
            box-shadow: none !important;
          }
        }
      `}</style>

      {mode === "all" && (
        <div className="no-print max-w-5xl mx-auto mt-4 px-4">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou email"
            className="w-full md:max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            Exibindo {filteredMembers.length} de {members.length} fichas
          </p>
        </div>
      )}

      {filteredMembers.length === 0 ? (
        <div className="p-6 text-center text-gray-600">
          Nenhum membro encontrado para essa busca.
        </div>
      ) : (
        filteredMembers.map((member, index) => (
          <div
            key={member.id}
            className={`print-page mx-auto my-6 bg-white shadow-sm border border-gray-200 ${
              index > 0 ? "page-break" : ""
            }`}
            style={{ width: "210mm", minHeight: "297mm", padding: "16mm 14mm" }}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                {branding?.logoBase64 ? (
                  <img
                    src={branding.logoBase64}
                    alt="Logo da fraternidade"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center text-xl">
                    🕊️
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-bold">{tituloSistema}</h1>
                  <p className="text-sm text-gray-600">
                    Ficha Cadastral do Membro
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>Data: {new Date().toLocaleDateString("pt-BR")}</p>
                <p>ID: {member.id}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-[120px_1fr] gap-6">
              <div>
                <div className="w-28 h-36 border border-gray-300 rounded overflow-hidden bg-gray-50">
                  {member.fotoBase64 ? (
                    <img
                      src={member.fotoBase64}
                      alt={`Foto de ${member.nome}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                      Sem foto
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700">
                    Informacoes Pessoais
                  </h2>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Nome</p>
                      <p className="font-medium">{member.nome}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">CPF</p>
                      <p className="font-medium">{member.cpf}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Data de Nascimento</p>
                      <p className="font-medium">
                        {member.dataNascimento
                          ? new Date(member.dataNascimento).toLocaleDateString(
                              "pt-BR",
                            )
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tipo de Membro</p>
                      <p className="font-medium">{member.tipoMembro || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="font-medium">{member.status}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-700">
                    Contato
                  </h2>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{member.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Telefone</p>
                      <p className="font-medium">{member.telefone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-700">
                    Endereco
                  </h2>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Rua</p>
                      <p className="font-medium">
                        {member.endereco?.rua || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Numero</p>
                      <p className="font-medium">
                        {member.endereco?.numero || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Bairro</p>
                      <p className="font-medium">
                        {member.endereco?.bairro || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cidade</p>
                      <p className="font-medium">
                        {member.endereco?.cidade || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Estado</p>
                      <p className="font-medium">
                        {member.endereco?.estado || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">CEP</p>
                      <p className="font-medium">
                        {member.endereco?.cep || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
