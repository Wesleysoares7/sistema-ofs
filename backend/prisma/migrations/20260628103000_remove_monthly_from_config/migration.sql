-- Remove monthly contribution fields from regional config.
ALTER TABLE "Config"
  DROP COLUMN IF EXISTS "valorMensal",
  DROP COLUMN IF EXISTS "descricaoMensal";
