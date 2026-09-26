-- Resource ilk açılışta bu tabloyu kendisi oluşturur; elle kurmak isterseniz bu dosyayı çalıştırın.
CREATE TABLE IF NOT EXISTS `broid_bank_transactions` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `citizenid` VARCHAR(50) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `amount` BIGINT UNSIGNED NOT NULL,
    `party` VARCHAR(100) DEFAULT NULL,
    `note` VARCHAR(100) DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `citizenid_id` (`citizenid`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
