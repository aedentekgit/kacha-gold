-- ====================================================================
-- GOLD BUYBACK APP - PRODUCTION DATABASE SCHEMA (MySQL / MariaDB)
-- Database Name: u248216155_kacha
-- Hostinger MySQL & MariaDB Fully Compatible
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `u248216155_kacha` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `u248216155_kacha`;

-- --------------------------------------------------------------------
-- Table 1: RATES
-- Stores historical 22K Board rates and 24K Kacha gold rates over time
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rates` (
    `id` VARCHAR(64) NOT NULL,
    `date` VARCHAR(10) NOT NULL,             -- Date format: YYYY-MM-DD
    `time` VARCHAR(20) NOT NULL,             -- Time format: HH:MM AM/PM
    `board` DECIMAL(10, 2) NOT NULL,         -- 22K Board rate per gram (INR)
    `kacha` DECIMAL(10, 2) NOT NULL,         -- 24K Kacha rate per 10g (INR)
    `created_at` BIGINT NOT NULL,            -- Unix timestamp in milliseconds
    `user_logged` TINYINT(1) DEFAULT 1,      -- 1 if logged manually, 0 if auto
    `auto_synced` TINYINT(1) DEFAULT 0,     -- 1 if auto-fetched from online source
    `source` VARCHAR(255) DEFAULT NULL,      -- Rate source identifier
    PRIMARY KEY (`id`),
    INDEX `idx_rates_date` (`date`),
    INDEX `idx_rates_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table 2: PURCHASES
-- Stores gold buyback purchase transactions and inventory items
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchases` (
    `id` VARCHAR(64) NOT NULL,
    `date` VARCHAR(10) NOT NULL,             -- Date format: YYYY-MM-DD
    `time` VARCHAR(20) DEFAULT NULL,         -- Time format: HH:MM AM/PM
    `grams` DECIMAL(10, 3) NOT NULL,         -- Weight of gold in grams
    `overall_price` DECIMAL(12, 2) NOT NULL, -- Total purchase price paid (INR)
    `rate_paid` DECIMAL(10, 2) NOT NULL,     -- Calculated rate paid per unit (INR)
    `kacha_at_purchase` DECIMAL(10, 2) DEFAULT NULL, -- 24K Kacha rate at buy time
    `board_at_purchase` DECIMAL(10, 2) DEFAULT NULL, -- 22K Board rate at buy time
    `thumbnail` LONGTEXT DEFAULT NULL,       -- Base64 image string or URL
    `notes` TEXT DEFAULT NULL,               -- Item description or notes
    `is_sold` TINYINT(1) DEFAULT 0,          -- 1 = sold, 0 = in inventory
    `created_at` BIGINT NOT NULL,            -- Unix timestamp in milliseconds
    PRIMARY KEY (`id`),
    INDEX `idx_purchases_date` (`date`),
    INDEX `idx_purchases_is_sold` (`is_sold`),
    INDEX `idx_purchases_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table 3: SETTINGS
-- Stores key-value configuration pairs (e.g. target profit, profit %)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
    `key` VARCHAR(64) NOT NULL,              -- Setting key identifier
    `value` TEXT NOT NULL,                   -- Setting value string/number
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- SEED DATA INSERTS (Default Initial System Data)
-- ====================================================================

-- Default Settings
INSERT INTO `settings` (`key`, `value`) VALUES 
('targetProfit', '250'),
('targetProfitPct', '5')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

