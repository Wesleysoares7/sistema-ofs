import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const member = await prisma.user.findFirst({
    where: {
      role: { in: ["IRMAO_MEMBRO", "MEMBER"] },
      fraternidade: {
        nomeFraternidade: {
          contains: "Santa Clara",
          mode: "insensitive",
        },
      },
    },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      status: true,
      fraternidadeId: true,
      fraternidade: {
        select: {
          nomeFraternidade: true,
          cidade: true,
        },
      },
    },
  });

  console.log(JSON.stringify(member, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
