-- AlterTable
ALTER TABLE `Loan` ADD COLUMN `referredByCustomerId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Loan_referredByCustomerId_idx` ON `Loan`(`referredByCustomerId`);

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_referredByCustomerId_fkey` FOREIGN KEY (`referredByCustomerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
