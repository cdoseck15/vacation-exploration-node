CREATE TABLE `static_texts` (
  `description` varchar(50) NOT NULL,
  `text` text NOT NULL,
  PRIMARY KEY (`description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `website` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_user_type_website` (`website`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_type` int NOT NULL,
  `token` varchar(255) NOT NULL,
  `username` varchar(30) DEFAULT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_user_username` (`username`),
  KEY `fk_user_user_type` (`user_type`),
  CONSTRAINT `fk_user_user_type` FOREIGN KEY (`user_type`) REFERENCES `user_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `friend` (
  `user_id_1` int NOT NULL,
  `user_id_2` int NOT NULL,
  PRIMARY KEY (`user_id_1`,`user_id_2`),
  KEY `fk_user_friend_2` (`user_id_2`),
  CONSTRAINT `friend_ibfk_1` FOREIGN KEY (`user_id_1`) REFERENCES `user` (`id`),
  CONSTRAINT `friend_ibfk_2` FOREIGN KEY (`user_id_2`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `friend_request` (
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `request_date` int NOT NULL,
  PRIMARY KEY (`sender_id`,`receiver_id`),
  KEY `fk_friend_request_receiver` (`receiver_id`),
  CONSTRAINT `friend_request_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `user` (`id`),
  CONSTRAINT `friend_request_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `place_id` (
  `place_id` varchar(767) NOT NULL,
  `refresh_date` datetime NOT NULL,
  PRIMARY KEY (`place_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vacation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `place_id` varchar(767) NOT NULL,
  `rating` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `details` text,
  `is_public` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_vacation_user` (`user_id`),
  KEY `fk_vacation_place_id` (`place_id`),
  CONSTRAINT `fk_vacation_place_id` FOREIGN KEY (`place_id`) REFERENCES `place_id` (`place_id`),
  CONSTRAINT `fk_vacation_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `attraction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacation_id` int NOT NULL,
  `place_id` varchar(767) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_attraction_vacation_place` (`vacation_id`,`place_id`),
  KEY `fk_attraction_vacation` (`vacation_id`),
  KEY `fk_attraction_place_id` (`place_id`),
  CONSTRAINT `fk_attraction_place_id` FOREIGN KEY (`place_id`) REFERENCES `place_id` (`place_id`),
  CONSTRAINT `fk_attraction_vacation` FOREIGN KEY (`vacation_id`) REFERENCES `vacation` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
