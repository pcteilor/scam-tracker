import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = process.env.ADMIN_SEED_PASSWORD ?? "admin123";
  const hash = await bcrypt.hash(defaultPassword, 10);

  const existing = await prisma.adminConfig.findFirst();
  if (existing) {
    console.log("AdminConfig já existe, pulando seed.");
    return;
  }

  await prisma.adminConfig.create({
    data: { passwordHash: hash },
  });
  console.log("AdminConfig criado. Senha padrão (dev):", defaultPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
