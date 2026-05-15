-- AlterTable
ALTER TABLE "registrations" ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "qr_stub" TEXT;
