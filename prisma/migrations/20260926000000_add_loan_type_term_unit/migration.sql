-- AlterTable
ALTER TABLE `LoanType`
  ADD COLUMN `defaultTermUnit` ENUM('DAY', 'WEEK', 'MONTH') NOT NULL DEFAULT 'MONTH';
