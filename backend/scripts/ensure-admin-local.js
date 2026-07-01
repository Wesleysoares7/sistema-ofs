import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const fraternidade = await prisma.fraternidade.findFirst({
    where: { status: "ATIVA" },
    orderBy: { createdAt: "asc" },
  });

  if (!fraternidade) {
    throw new Error("Nenhuma fraternidade ativa encontrada para vincular ADMIN_LOCAL");
  }

  const email = "admin.local@ofs.com";
  const senhaPlana = "AdminLocal@123";
  const senhaHash = await bcrypt.hash(senhaPlana, 10);

  const existente = await prisma.user.findUnique({ where: { email } });

  if (existente) {
    await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN_LOCAL",
        status: "ATIVO",
        fraternidadeId: fraternidade.id,
      },
    });

    console.log(
      JSON.stringify(
        {
          action: "updated",
          email,
          senha: senhaPlana,
          fraternidadeId: fraternidade.id,
          fraternidadeNome: fraternidade.nomeFraternidade,
        },
        null,
        2,
      ),
    );
    return;
  }

  const cpfBase = "90000000000";

  const created = await prisma.user.create({
    data: {
      nome: "Administrador Local OFS",
      cpf: cpfBase,
      dataNascimento: new Date("1988-01-16T00:00:00.000Z"),
      telefone: "86999999999",
      email,
      senha: senhaHash,
      role: "ADMIN_LOCAL",
      status: "ATIVO",
      fraternidadeId: fraternidade.id,
      endereco: {
        create: {
          rua: "Rua da Fraternidade Local",
          numero: "100",
          bairro: "Centro",
          cidade: fraternidade.cidade,
          estado: "PI",
          cep: "64200-000",
        },
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        action: "created",
        id: created.id,
        email,
        senha: senhaPlana,
        fraternidadeId: fraternidade.id,
        fraternidadeNome: fraternidade.nomeFraternidade,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
