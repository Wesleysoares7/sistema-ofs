import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existentes = await prisma.fraternidade.count();

  const dados = [
    {
      nomeFraternidade: "Fraternidade Sao Francisco de Assis",
      cidade: "Parnaiba",
      distrito: "1o Distrito",
      dataFundacao: new Date("2005-10-04T00:00:00.000Z"),
      status: "ATIVA",
      contatoMinistro: "Ministro Local - Parnaiba",
    },
    {
      nomeFraternidade: "Fraternidade Santa Clara",
      cidade: "Teresina",
      distrito: "2o Distrito",
      dataFundacao: new Date("2010-08-11T00:00:00.000Z"),
      status: "ATIVA",
      contatoMinistro: "Ministro Local - Teresina",
    },
    {
      nomeFraternidade: "Fraternidade Imaculada Conceicao",
      cidade: "Piripiri",
      distrito: "3o Distrito",
      dataFundacao: new Date("2012-03-19T00:00:00.000Z"),
      status: "ATIVA",
      contatoMinistro: "Ministro Local - Piripiri",
    },
  ];

  if (existentes === 0) {
    for (const item of dados) {
      const jaExiste = await prisma.fraternidade.findFirst({
        where: {
          nomeFraternidade: item.nomeFraternidade,
          cidade: item.cidade,
        },
      });

      if (!jaExiste) {
        await prisma.fraternidade.create({ data: item });
      }
    }
  }

  const total = await prisma.fraternidade.count();
  const ativas = await prisma.fraternidade.count({ where: { status: "ATIVA" } });

  console.log(JSON.stringify({ total, ativas }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
