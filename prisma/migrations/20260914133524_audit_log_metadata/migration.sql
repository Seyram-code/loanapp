/*
  Warnings:

  - Added the required column `description` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `AuditLog` ADD COLUMN `description` VARCHAR(255) NOT NULL,
    ADD COLUMN `ipAddress` VARCHAR(45) NULL,
    ADD COLUMN `userAgent` VARCHAR(512) NULL;

-- CreateIndex
CREATE INDEX `AuditLog_userId_createdAt_idx` ON `AuditLog`(`userId`, `createdAt`);

-- CreateIndex
CREATE INDEX `AuditLog_action_createdAt_idx` ON `AuditLog`(`action`, `createdAt`);
