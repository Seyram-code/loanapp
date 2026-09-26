ALTER TABLE `Customer`
  ADD COLUMN `referredByCustomerId` VARCHAR(191) NULL,
  ADD INDEX `Customer_referredByCustomerId_idx` (`referredByCustomerId`),
  ADD CONSTRAINT `Customer_referredByCustomerId_fkey`
    FOREIGN KEY (`referredByCustomerId`) REFERENCES `Customer` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;