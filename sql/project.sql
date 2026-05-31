CREATE TABLE `project` (
  `uuid` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` ENUM('slideshow', 'html') NOT NULL,
  `storyboard_outline` LONGTEXT NOT NULL,
  `video_source` LONGTEXT NOT NULL,
  PRIMARY KEY (`uuid`),
  KEY `idx_project_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `project_chat_message` (
  `uuid` CHAR(36) NOT NULL,
  `project_uuid` CHAR(36) NOT NULL,
  `sender` ENUM('assistant', 'user') NOT NULL,
  `content` LONGTEXT NOT NULL,
  `intent_action` VARCHAR(64) DEFAULT NULL,
  `intent_reason` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  KEY `idx_project_chat_message_project_created_at` (`project_uuid`, `created_at`),
  CONSTRAINT `fk_project_chat_message_project`
    FOREIGN KEY (`project_uuid`) REFERENCES `project` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
