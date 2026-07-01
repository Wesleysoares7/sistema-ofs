-- CPF becomes optional for member registration.
ALTER TABLE "User"
  ALTER COLUMN "cpf" DROP NOT NULL;
