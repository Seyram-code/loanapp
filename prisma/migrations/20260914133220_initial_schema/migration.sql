-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'ACCOUNTANT', 'MANAGER', 'CUSTOMER') NOT NULL DEFAULT 'ADMIN',
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastLoginAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_role_status_idx`(`role`, `status`),
    INDEX `User_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `customerNumber` VARCHAR(16) NOT NULL,
    `firstName` VARCHAR(80) NOT NULL,
    `middleName` VARCHAR(80) NULL,
    `lastName` VARCHAR(80) NOT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NULL,
    `phone` VARCHAR(32) NOT NULL,
    `alternatePhone` VARCHAR(32) NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(80) NULL,
    `region` VARCHAR(80) NULL,
    `country` VARCHAR(80) NOT NULL DEFAULT 'Ghana',
    `nationalId` VARCHAR(64) NULL,
    `occupation` VARCHAR(120) NULL,
    `employer` VARCHAR(120) NULL,
    `monthlyIncome` DECIMAL(14, 2) NULL,
    `emergencyContactName` VARCHAR(160) NULL,
    `emergencyContactPhone` VARCHAR(32) NULL,
    `emergencyContactRelationship` VARCHAR(80) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Customer_customerNumber_key`(`customerNumber`),
    UNIQUE INDEX `Customer_nationalId_key`(`nationalId`),
    INDEX `Customer_lastName_firstName_idx`(`lastName`, `firstName`),
    INDEX `Customer_phone_idx`(`phone`),
    INDEX `Customer_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Loan` (
    `id` VARCHAR(191) NOT NULL,
    `loanNumber` VARCHAR(32) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `loanTypeId` VARCHAR(191) NOT NULL,
    `requestedAmount` DECIMAL(14, 2) NOT NULL,
    `approvedAmount` DECIMAL(14, 2) NULL,
    `interestRate` DECIMAL(5, 2) NOT NULL,
    `interestType` ENUM('FLAT', 'REDUCING_BALANCE') NOT NULL,
    `term` INTEGER NOT NULL,
    `repaymentFrequency` ENUM('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY') NOT NULL,
    `purpose` VARCHAR(255) NULL,
    `applicationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvalDate` DATETIME(3) NULL,
    `disbursementDate` DATETIME(3) NULL,
    `maturityDate` DATETIME(3) NULL,
    `status` ENUM('DRAFT', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `rejectionReason` TEXT NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `approvedById` VARCHAR(191) NULL,
    `disbursedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Loan_loanNumber_key`(`loanNumber`),
    INDEX `Loan_customerId_status_idx`(`customerId`, `status`),
    INDEX `Loan_loanTypeId_status_idx`(`loanTypeId`, `status`),
    INDEX `Loan_createdById_createdAt_idx`(`createdById`, `createdAt`),
    INDEX `Loan_approvedById_approvalDate_idx`(`approvedById`, `approvalDate`),
    INDEX `Loan_disbursedById_disbursementDate_idx`(`disbursedById`, `disbursementDate`),
    INDEX `Loan_status_maturityDate_idx`(`status`, `maturityDate`),
    INDEX `Loan_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanType` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `defaultInterestRate` DECIMAL(5, 2) NOT NULL,
    `defaultTerm` INTEGER NOT NULL,
    `repaymentFrequency` ENUM('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY') NOT NULL,
    `minimumAmount` DECIMAL(14, 2) NOT NULL,
    `maximumAmount` DECIMAL(14, 2) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LoanType_name_key`(`name`),
    INDEX `LoanType_status_name_idx`(`status`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NumberSequence` (
    `key` VARCHAR(32) NOT NULL,
    `nextValue` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanRepaymentSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `loanId` VARCHAR(191) NOT NULL,
    `installmentNumber` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `expectedAmount` DECIMAL(14, 2) NOT NULL,
    `principalAmount` DECIMAL(14, 2) NOT NULL,
    `interestAmount` DECIMAL(14, 2) NOT NULL,
    `amountPaid` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `remainingAmount` DECIMAL(14, 2) NOT NULL,
    `status` ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED') NOT NULL DEFAULT 'PENDING',
    `paidDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LoanRepaymentSchedule_loanId_dueDate_idx`(`loanId`, `dueDate`),
    INDEX `LoanRepaymentSchedule_status_dueDate_idx`(`status`, `dueDate`),
    UNIQUE INDEX `LoanRepaymentSchedule_loanId_installmentNumber_key`(`loanId`, `installmentNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanDisbursement` (
    `id` VARCHAR(191) NOT NULL,
    `loanId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `disbursementDate` DATETIME(3) NOT NULL,
    `paymentMethod` ENUM('CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'OTHER') NOT NULL,
    `referenceNumber` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `disbursedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoanDisbursement_loanId_disbursementDate_idx`(`loanId`, `disbursementDate`),
    INDEX `LoanDisbursement_disbursedById_createdAt_idx`(`disbursedById`, `createdAt`),
    INDEX `LoanDisbursement_paymentMethod_disbursementDate_idx`(`paymentMethod`, `disbursementDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Repayment` (
    `id` VARCHAR(191) NOT NULL,
    `repaymentNumber` VARCHAR(32) NOT NULL,
    `loanId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL,
    `paymentMethod` ENUM('CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'OTHER') NOT NULL,
    `referenceNumber` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `recordedById` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'LATE', 'MISSED') NOT NULL DEFAULT 'PAID',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Repayment_repaymentNumber_key`(`repaymentNumber`),
    INDEX `Repayment_loanId_paymentDate_idx`(`loanId`, `paymentDate`),
    INDEX `Repayment_customerId_paymentDate_idx`(`customerId`, `paymentDate`),
    INDEX `Repayment_recordedById_createdAt_idx`(`recordedById`, `createdAt`),
    INDEX `Repayment_paymentMethod_paymentDate_idx`(`paymentMethod`, `paymentDate`),
    INDEX `Repayment_status_paymentDate_idx`(`status`, `paymentDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `entity` VARCHAR(64) NOT NULL,
    `entityId` VARCHAR(64) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_loanTypeId_fkey` FOREIGN KEY (`loanTypeId`) REFERENCES `LoanType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_disbursedById_fkey` FOREIGN KEY (`disbursedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanRepaymentSchedule` ADD CONSTRAINT `LoanRepaymentSchedule_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `Loan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanDisbursement` ADD CONSTRAINT `LoanDisbursement_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `Loan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanDisbursement` ADD CONSTRAINT `LoanDisbursement_disbursedById_fkey` FOREIGN KEY (`disbursedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Repayment` ADD CONSTRAINT `Repayment_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `Loan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Repayment` ADD CONSTRAINT `Repayment_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Repayment` ADD CONSTRAINT `Repayment_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
