ALTER TABLE `Loan`
  ADD COLUMN `rolloverFromLoanId` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `Loan_rolloverFromLoanId_key`(`rolloverFromLoanId`),
  ADD CONSTRAINT `Loan_rolloverFromLoanId_fkey` FOREIGN KEY (`rolloverFromLoanId`) REFERENCES `Loan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;