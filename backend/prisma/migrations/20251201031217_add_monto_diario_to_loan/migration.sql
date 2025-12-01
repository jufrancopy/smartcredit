/*
  Warnings:

  - Added the required column `monto_diario` to the `Loan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "monto_diario" DOUBLE PRECISION NOT NULL DEFAULT 0;
