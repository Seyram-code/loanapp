-- CreateIndex
CREATE INDEX `AuditLog_entityId_idx` ON `AuditLog`(`entityId`);

-- CreateIndex
CREATE INDEX `Customer_email_idx` ON `Customer`(`email`);

-- CreateIndex
CREATE INDEX `Loan_applicationDate_idx` ON `Loan`(`applicationDate`);

-- CreateIndex
CREATE INDEX `Repayment_paymentDate_idx` ON `Repayment`(`paymentDate`);
