-- El RIGI pasa a cargarse desde la planilla oficial: suma la resolución, los
-- empleos declarados y la descripción de cada proyecto.
ALTER TABLE "rigi_project" ADD COLUMN "resolution" TEXT;
ALTER TABLE "rigi_project" ADD COLUMN "jobs" INTEGER;
ALTER TABLE "rigi_project" ADD COLUMN "description" TEXT;
