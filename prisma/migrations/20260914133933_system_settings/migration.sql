-- CreateTable
CREATE TABLE `SystemSetting` (
    `id` VARCHAR(32) NOT NULL DEFAULT 'default',
    `organizationName` VARCHAR(160) NOT NULL DEFAULT 'Lendgh',
    `organizationLogoUrl` VARCHAR(512) NULL,
    `address` VARCHAR(255) NULL,
    `phone` VARCHAR(32) NULL,
    `email` VARCHAR(191) NULL,
    `currency` VARCHAR(8) NOT NULL DEFAULT 'GHS',
    `dateFormat` VARCHAR(32) NOT NULL DEFAULT 'DD/MM/YYYY',
    `defaultInterestRate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `defaultLoanTerm` INTEGER NOT NULL DEFAULT 12,
    `defaultRepaymentFrequency` ENUM('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY') NOT NULL DEFAULT 'MONTHLY',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
