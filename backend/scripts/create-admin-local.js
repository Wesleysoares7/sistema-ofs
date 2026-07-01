import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : "";
}

async function main() {
  const fraternidadeNome = getArg("fraternidade");
  const email = getArg("email");
  const senha = getArg("senha");

  if (!fraternidadeNome || !email || !senha) {
    throw new Error(
      "Uso: node scripts/create-admin-local.js --fraternidade=Santa Clara --email=admin.santaclara@ofs.com --senha=AdminSantaClara@123",
    );
  }

  const fraternidade = await prisma.fraternidade.findFirst({
    where: {
      nomeFraternidade: {
        contains: fraternidadeNome,
        mode: "insensitive",
      },
    },
  });

  if (!fraternidade) {
    throw new Error(`Fraternidade nao encontrada: ${fraternidadeNome}`);
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const existente = await prisma.user.findUnique({
    where: { email },
    include: { endereco: true },
  });

  if (existente) {
    await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN_LOCAL",
        status: "ATIVO",
        fraternidadeId: fraternidade.id,
        senha: senhaHash,
      },
    });

    console.log(
      JSON.stringify(
        {
          action: "updated",
          email,
          senha,
          fraternidadeId: fraternidade.id,
          fraternidadeNome: fraternidade.nomeFraternidade,
        },
        null,
        2,
      ),
    );
    return;
  }

  const timestamp = Date.now().toString().slice(-8);

  const created = await prisma.user.create({
    data: {
      nome: `Administrador Local - ${fraternidade.nomeFraternidade}`,
      cpf: `99${timestamp}00`,
      dataNascimento: new Date("1988-01-16T00:00:00.000Z"),
      telefone: "86999999999",
      email,
      senha: senhaHash,
      role: "ADMIN_LOCAL",
      status: "ATIVO",
      fraternidadeId: fraternidade.id,
      endereco: {
        create: {
          rua: "Rua da Fraternidade",
          numero: "100",
          bairro: "Centro",
          cidade: fraternidade.cidade,
          estado: "PI",
          cep: "64000-000",
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
        senha,
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
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
