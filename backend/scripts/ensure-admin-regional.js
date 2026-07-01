import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@ofs.com";
  const senhaPlana = "Admin@123456";
  const senhaHash = await bcrypt.hash(senhaPlana, 10);

  const existente = await prisma.user.findUnique({ where: { email } });

  if (existente) {
    await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN_REGIONAL",
        status: "ATIVO",
        fraternidadeId: null,
        senha: senhaHash,
      },
    });

    console.log(
      JSON.stringify(
        {
          action: "updated",
          email,
        },
        null,
        2,
      ),
    );
    return;
  }

  const created = await prisma.user.create({
    data: {
      nome: "Administrador Regional OFS",
      cpf: `800${Date.now().toString().slice(-8)}`,
      dataNascimento: new Date("1985-01-01T00:00:00.000Z"),
      telefone: "81999999999",
      email,
      senha: senhaHash,
      role: "ADMIN_REGIONAL",
      status: "ATIVO",
      endereco: {
        create: {
          rua: "Rua do Conselho Regional",
          numero: "1",
          bairro: "Centro",
          cidade: "Teresina",
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
