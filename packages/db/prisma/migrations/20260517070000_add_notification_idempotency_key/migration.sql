-- AlterTable: add optional idempotency_key to notifications
ALTER TABLE "notifications" ADD COLUMN "idempotency_key" TEXT;

-- CreateIndex: unique constraint so duplicate notification jobs are no-ops
CREATE UNIQUE INDEX "notifications_idempotency_key_key" ON "notifications"("idempotency_key");
