import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Limpar dados existentes
  await prisma.contribuicaoMensal.deleteMany();
  await prisma.contribuicaoAnual.deleteMany();
  await prisma.endereco.deleteMany();
  await prisma.user.deleteMany();

  // Criar admin padrão
  const adminPassword = await bcrypt.hash("Admin@123456", 10);
  
  const admin = await prisma.user.create({
    data: {
      nome: "Administrador OFS",
      cpf: "12345678901",
      dataNascimento: new Date("1990-01-15"),
      telefone: "(11) 98765-4321",
      email: "admin@ofs.com",
      senha: adminPassword,
      role: "ADMIN",
      status: "ATIVO",
      tipoMembro: null,
      endereco: {
        create: {
          rua: "Rua da Fraternidade",
          numero: "123",
          bairro: "Centro",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01310-100",
        },
      },
    },
  });

  // Criar membro de exemplo (Pendente)
  const memberPassword = await bcrypt.hash("Membro@123456", 10);
  
  const member = await prisma.user.create({
    data: {
      nome: "José da Silva",
      cpf: "98765432101",
      dataNascimento: new Date("1985-05-20"),
      telefone: "(11) 99876-5432",
      email: "jose@ofs.com",
      senha: memberPassword,
      role: "MEMBER",
      status: "PENDENTE",
      tipoMembro: null,
      endereco: {
        create: {
          rua: "Rua da Paz",
          numero: "456",
          bairro: "Vila Maria",
          cidade: "São Paulo",
          estado: "SP",
          cep: "02142-000",
        },
      },
    },
  });

  // Criar membro ativo de exemplo
  const activeMemberPassword = await bcrypt.hash("AtivaMembro@123", 10);
  
  const activeMember = await prisma.user.create({
    data: {
      nome: "Maria dos Santos",
      cpf: "55544433322",
      dataNascimento: new Date("1992-08-10"),
      telefone: "(11) 97777-8888",
      email: "maria@ofs.com",
      senha: activeMemberPassword,
      role: "MEMBER",
      status: "ATIVO",
      tipoMembro: "PROFESSO",
      endereco: {
        create: {
          rua: "Avenida Paulista",
          numero: "1000",
          bairro: "Bela Vista",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01311-100",
        },
      },
    },
  });

  // Gerar contribuições anuais para o membro ativo
  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 1; year <= currentYear; year++) {
    await prisma.contribuicaoAnual.create({
      data: {
        ano: year,
        status: year === currentYear - 1 ? "PAGO" : "PENDENTE",
        dataPagamento: year === currentYear - 1 ? new Date(year, 11, 15) : null,
        userId: activeMember.id,
      },
    });
  }

  // Gerar contribuições mensais para o membro ativo
  for (let month = 1; month <= 12; month++) {
    const isPaid = month <= 8;
    await prisma.contribuicaoMensal.create({
      data: {
        mes: month,
        ano: currentYear,
        status: isPaid ? "PAGO" : "PENDENTE",
        dataPagamento: isPaid ? new Date(currentYear, month - 1, 15) : null,
        userId: activeMember.id,
      },
    });
  }

  // Criar mais um membro ativo para testar (Wesley)
  const wesley = await prisma.user.create({
    data: {
      nome: "Wesley Silva Soares",
      cpf: "11122233344",
      dataNascimento: new Date("1980-03-25"),
      telefone: "(11) 98888-9999",
      email: "analiagood@gmail.com",
      senha: await bcrypt.hash("Lu16011988!", 10),
      role: "MEMBER",
      status: "ATIVO",
      tipoMembro: "PROFESSO",
      endereco: {
        create: {
          rua: "Rua das Flores",
          numero: "789",
          bairro: "Vila Mariana",
          cidade: "São Paulo",
          estado: "SP",
          cep: "04018-010",
        },
      },
    },
  });

  // Gerar contribuições anuais para Wesley
  for (let year = currentYear - 1; year <= currentYear; year++) {
    await prisma.contribuicaoAnual.create({
      data: {
        ano: year,
        status: "PENDENTE",
        dataPagamento: null,
        userId: wesley.id,
      },
    });
  }

  // Gerar contribuições mensais para Wesley
  for (let month = 1; month <= 12; month++) {
    await prisma.contribuicaoMensal.create({
      data: {
        mes: month,
        ano: currentYear,
        status: "PENDENTE",
        dataPagamento: null,
        userId: wesley.id,
      },
    });
  }

  console.log("✅ Seed realizado com sucesso!");
  console.log("\nDados criados:");
  console.log(`Admin: ${admin.email} | Senha: Admin@123456`);
  console.log(`Membro Pendente: ${member.email} | Senha: Membro@123456`);
  console.log(`Membro Ativo: ${activeMember.email} | Senha: AtivaMembro@123`);
  console.log(`Membro Ativo (Wesley): ${wesley.email} | Senha: Lu16011988!`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
