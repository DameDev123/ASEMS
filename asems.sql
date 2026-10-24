-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: ambo_performance_evaluation
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `academic_units`
--

DROP TABLE IF EXISTS `academic_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_units` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(180) NOT NULL,
  `unit_type` enum('College','Institute','School') NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_academic_units_name` (`name`),
  KEY `idx_academic_units_type_active` (`unit_type`,`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_units`
--

LOCK TABLES `academic_units` WRITE;
/*!40000 ALTER TABLE `academic_units` DISABLE KEYS */;
/*!40000 ALTER TABLE `academic_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,3,'login','user',3,'{}','::1','2026-10-21 16:47:15'),(2,3,'login','user',3,'{}','::1','2026-10-21 16:47:50'),(3,3,'login','user',3,'{}','::1','2026-10-21 17:15:12'),(4,3,'login','user',3,'{}','::1','2026-10-21 17:16:15'),(5,1,'auth.login_success','user',1,'{}',NULL,'2026-10-21 20:12:05'),(6,1,'auth.login_success','user',1,'{}',NULL,'2026-10-21 20:49:23'),(7,1,'auth.login_success','user',1,'{}',NULL,'2026-10-21 21:21:19'),(8,1,'auth.login','user',1,'{}',NULL,'2026-10-21 21:56:10'),(9,1,'user.updated','user',1,'{\"newRole\": \"admin\", \"previousRole\": \"admin\"}','::1','2026-10-21 22:03:09'),(10,1,'user.created','user',7,'{\"role\": \"teacher\"}','::1','2026-10-21 22:04:29'),(11,1,'auth.login','user',1,'{}',NULL,'2026-10-22 07:10:27'),(12,1,'auth.login','user',1,'{}',NULL,'2026-10-22 07:36:23'),(13,1,'auth.login','user',1,'{}',NULL,'2026-10-22 07:48:20'),(14,1,'cycle.created','evaluation_cycle',5,'{\"title\": \"ambo\", \"endDate\": \"2026-10-30\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}','::1','2026-10-22 07:59:43'),(15,1,'auth.login','user',1,'{}',NULL,'2026-10-22 08:15:18'),(16,1,'cycle.updated','evaluation_cycle',5,'{\"after\": {\"title\": \"ambo\", \"endDate\": \"2026-10-31\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}, \"before\": {\"title\": \"ambo\", \"endDate\": \"2026-10-30\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}}','::1','2026-10-22 08:15:54');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `course_code` varchar(50) NOT NULL DEFAULT '',
  `department` varchar(150) NOT NULL DEFAULT '',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_courses_title` (`title`),
  KEY `idx_courses_code` (`course_code`),
  KEY `idx_courses_department` (`department`),
  KEY `idx_courses_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `faculty_id` bigint unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_departments_faculty_name` (`faculty_id`,`name`),
  CONSTRAINT `fk_departments_faculty` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,2,'cs','2026-10-20 06:34:40','2026-10-20 06:34:40'),(2,2,'ELEC','2026-10-20 06:43:57','2026-10-20 06:43:57'),(3,2,'IT','2026-10-20 06:44:06','2026-10-20 06:44:06'),(4,3,'IS','2026-10-20 06:44:40','2026-10-20 06:44:40'),(5,4,'js','2026-10-20 18:59:54','2026-10-20 18:59:54');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `employee_type` enum('academic','administrative') NOT NULL DEFAULT 'academic',
  `job_title` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employees_user` (`user_id`),
  KEY `idx_employees_department` (`department_id`),
  CONSTRAINT `fk_employees_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,5,2,'academic',NULL,'2026-10-20 06:48:43','2026-10-20 06:48:43');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_assignments`
--

DROP TABLE IF EXISTS `evaluation_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cycle_id` bigint unsigned NOT NULL,
  `form_id` bigint unsigned NOT NULL,
  `instructor_id` bigint unsigned NOT NULL,
  `evaluator_id` bigint unsigned NOT NULL,
  `course_title` varchar(255) NOT NULL DEFAULT '',
  `course_code` varchar(50) NOT NULL DEFAULT '',
  `batch` enum('I','II','III','IV','V') DEFAULT NULL,
  `semester` enum('I','II') DEFAULT NULL,
  `status` enum('pending','draft','submitted') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_assignment` (`cycle_id`,`form_id`,`instructor_id`,`evaluator_id`,`course_code`),
  KEY `idx_assignments_evaluator` (`evaluator_id`,`status`),
  KEY `idx_assignments_instructor` (`instructor_id`),
  KEY `fk_assign_form` (`form_id`),
  CONSTRAINT `fk_assign_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`),
  CONSTRAINT `fk_assign_evaluator` FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_assign_form` FOREIGN KEY (`form_id`) REFERENCES `evaluation_forms` (`id`),
  CONSTRAINT `fk_assign_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_assignments`
--

LOCK TABLES `evaluation_assignments` WRITE;
/*!40000 ALTER TABLE `evaluation_assignments` DISABLE KEYS */;
INSERT INTO `evaluation_assignments` VALUES (1,1,1,5,2,'java','100','II','II','submitted','2026-10-20 07:25:22','2026-10-20 19:06:42'),(2,1,2,5,3,'','',NULL,'I','pending','2026-10-20 16:37:05','2026-10-20 16:37:05'),(3,1,2,4,3,'','',NULL,'I','submitted','2026-10-20 16:37:05','2026-10-20 16:41:47'),(5,1,4,4,4,'','',NULL,'I','pending','2026-10-20 16:37:05','2026-10-20 16:37:05'),(6,1,4,5,5,'','',NULL,'I','pending','2026-10-20 16:37:05','2026-10-20 16:37:05');
/*!40000 ALTER TABLE `evaluation_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_cycles`
--

DROP TABLE IF EXISTS `evaluation_cycles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_cycles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('upcoming','active','closed') NOT NULL DEFAULT 'upcoming',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cycle_title_year` (`title`,`academic_year`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_cycles`
--

LOCK TABLES `evaluation_cycles` WRITE;
/*!40000 ALTER TABLE `evaluation_cycles` DISABLE KEYS */;
INSERT INTO `evaluation_cycles` VALUES (1,'hia','hia','2026-10-20','2026-10-20','active','2026-10-20 06:00:04','2026-10-20 06:04:15'),(2,'html','2020','2026-10-20','2026-10-20','upcoming','2026-10-20 06:00:59','2026-10-20 06:00:59'),(3,'hia','2024','2026-10-21','2026-10-21','upcoming','2026-10-20 06:03:59','2026-10-20 06:03:59'),(4,'hkjjkhjkh','2024','2026-10-21','2026-10-30','upcoming','2026-10-20 19:01:08','2026-10-20 19:01:08'),(5,'ambo','2024','2026-10-22','2026-10-31','upcoming','2026-10-22 07:59:43','2026-10-22 08:15:54');
/*!40000 ALTER TABLE `evaluation_cycles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_forms`
--

DROP TABLE IF EXISTS `evaluation_forms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_forms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` char(1) NOT NULL,
  `title` varchar(255) NOT NULL,
  `evaluator_type` enum('student','department_head','peer','self') NOT NULL,
  `weight` decimal(5,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_forms_code` (`code`),
  UNIQUE KEY `uq_forms_evaluator` (`evaluator_type`),
  CONSTRAINT `chk_forms_weight` CHECK (((`weight` >= 0) and (`weight` <= 100)))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_forms`
--

LOCK TABLES `evaluation_forms` WRITE;
/*!40000 ALTER TABLE `evaluation_forms` DISABLE KEYS */;
INSERT INTO `evaluation_forms` VALUES (1,'A','Teachers\' Evaluation by Students','student',40.00,1,'2026-10-19 22:37:57','2026-10-19 22:37:57'),(2,'B','Teachers\' Evaluation by Department Head','department_head',35.00,1,'2026-10-19 22:37:57','2026-10-19 22:37:57'),(3,'C','Teachers\' Evaluation by Peer','peer',15.00,1,'2026-10-19 22:37:57','2026-10-19 22:37:57'),(4,'D','Self Evaluation by the Instructor','self',10.00,1,'2026-10-19 22:37:57','2026-10-19 22:37:57');
/*!40000 ALTER TABLE `evaluation_forms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_reviews`
--

DROP TABLE IF EXISTS `evaluation_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `evaluation_id` bigint unsigned NOT NULL,
  `reviewer_id` bigint unsigned NOT NULL,
  `action` enum('approved','rejected','returned') NOT NULL,
  `comment` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_evaluation` (`evaluation_id`),
  KEY `fk_reviews_reviewer` (`reviewer_id`),
  CONSTRAINT `fk_reviews_evaluation` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`),
  CONSTRAINT `fk_reviews_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_reviews`
--

LOCK TABLES `evaluation_reviews` WRITE;
/*!40000 ALTER TABLE `evaluation_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluation_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_scores`
--

DROP TABLE IF EXISTS `evaluation_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_scores` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `evaluation_id` bigint unsigned NOT NULL,
  `criterion_id` bigint unsigned NOT NULL,
  `score` tinyint unsigned DEFAULT NULL,
  `is_na` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_scores_eval_criterion` (`evaluation_id`,`criterion_id`),
  KEY `idx_scores_criterion` (`criterion_id`),
  CONSTRAINT `fk_scores_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `form_criteria` (`id`),
  CONSTRAINT `fk_scores_evaluation` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_scores_na` CHECK ((((`is_na` = 1) and (`score` is null)) or ((`is_na` = 0) and (`score` is not null)))),
  CONSTRAINT `chk_scores_range` CHECK (((`score` is null) or (`score` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_scores`
--

LOCK TABLES `evaluation_scores` WRITE;
/*!40000 ALTER TABLE `evaluation_scores` DISABLE KEYS */;
INSERT INTO `evaluation_scores` VALUES (1,1,31,5,0),(2,1,32,4,0),(3,1,33,5,0),(4,1,34,5,0),(5,1,35,5,0),(6,1,36,5,0),(7,1,37,5,0),(8,1,38,5,0),(9,1,39,5,0),(10,1,40,5,0),(11,1,41,5,0),(12,1,42,5,0),(13,1,43,5,0),(14,1,44,5,0),(15,1,45,5,0),(16,1,46,5,0),(17,1,47,5,0),(18,1,48,5,0),(19,1,49,5,0),(20,1,50,4,0),(21,1,51,3,0),(22,1,52,2,0),(23,1,53,3,0),(24,1,54,4,0),(25,1,55,5,0),(26,1,56,4,0),(27,1,57,4,0),(28,2,1,5,0),(29,2,2,5,0),(30,2,3,5,0),(31,2,4,5,0),(32,2,5,5,0),(33,2,6,4,0),(34,2,7,3,0),(35,2,8,3,0),(36,2,9,4,0),(37,2,10,5,0),(38,2,11,4,0),(39,2,12,4,0),(40,2,13,5,0),(41,2,14,4,0),(42,2,15,5,0),(43,2,16,5,0),(44,2,17,4,0),(45,2,18,4,0),(46,2,19,4,0),(47,2,20,4,0),(48,2,21,4,0),(49,2,22,4,0),(50,2,23,4,0),(51,2,24,4,0),(52,2,25,4,0),(53,2,26,4,0),(54,2,27,4,0),(55,2,28,4,0),(56,2,29,4,0),(57,2,30,4,0);
/*!40000 ALTER TABLE `evaluation_scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_summaries`
--

DROP TABLE IF EXISTS `evaluation_summaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_summaries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cycle_id` bigint unsigned NOT NULL,
  `instructor_id` bigint unsigned NOT NULL,
  `student_average` decimal(7,3) DEFAULT NULL,
  `student_weighted` decimal(7,3) NOT NULL DEFAULT '0.000',
  `department_head_average` decimal(7,3) DEFAULT NULL,
  `department_head_weighted` decimal(7,3) NOT NULL DEFAULT '0.000',
  `peer_average` decimal(7,3) DEFAULT NULL,
  `peer_weighted` decimal(7,3) NOT NULL DEFAULT '0.000',
  `self_average` decimal(7,3) DEFAULT NULL,
  `self_weighted` decimal(7,3) NOT NULL DEFAULT '0.000',
  `total_score` decimal(7,3) NOT NULL DEFAULT '0.000',
  `status` enum('incomplete','complete','reviewed','archived') NOT NULL DEFAULT 'incomplete',
  `committee_strengths` text,
  `committee_improvements` text,
  `finalized_by` bigint unsigned DEFAULT NULL,
  `finalized_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_summary_cycle_instructor` (`cycle_id`,`instructor_id`),
  KEY `fk_summary_instructor` (`instructor_id`),
  KEY `fk_summary_finalizer` (`finalized_by`),
  KEY `idx_summary_status` (`status`,`cycle_id`),
  CONSTRAINT `fk_summary_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_summary_finalizer` FOREIGN KEY (`finalized_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_summary_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_summaries`
--

LOCK TABLES `evaluation_summaries` WRITE;
/*!40000 ALTER TABLE `evaluation_summaries` DISABLE KEYS */;
INSERT INTO `evaluation_summaries` VALUES (1,1,5,4.175,33.400,NULL,0.000,NULL,0.000,NULL,0.000,33.400,'incomplete',NULL,NULL,NULL,NULL,'2026-10-21 05:25:39','2026-10-21 05:25:39'),(2,1,4,NULL,0.000,4.352,30.464,NULL,0.000,NULL,0.000,30.464,'incomplete',NULL,NULL,NULL,NULL,'2026-10-21 05:25:39','2026-10-21 05:25:39');
/*!40000 ALTER TABLE `evaluation_summaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluations`
--

DROP TABLE IF EXISTS `evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `assignment_id` bigint unsigned NOT NULL,
  `status` enum('draft','submitted','returned','approved','rejected') NOT NULL DEFAULT 'draft',
  `comment_strengths` text,
  `comment_improvements` text,
  `overall_average` decimal(7,3) DEFAULT NULL,
  `weighted_score` decimal(7,3) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_evaluations_assignment` (`assignment_id`),
  KEY `idx_evaluations_status` (`status`),
  CONSTRAINT `fk_evaluations_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `evaluation_assignments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluations`
--

LOCK TABLES `evaluations` WRITE;
/*!40000 ALTER TABLE `evaluations` DISABLE KEYS */;
INSERT INTO `evaluations` VALUES (1,3,'submitted',NULL,NULL,4.352,30.466,'2026-10-20 19:41:47','2026-10-20 16:41:47','2026-10-20 16:41:47'),(2,1,'submitted','nn,m','lnll',4.175,33.400,'2026-10-20 22:06:42','2026-10-20 19:06:42','2026-10-20 19:06:42');
/*!40000 ALTER TABLE `evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faculties`
--

DROP TABLE IF EXISTS `faculties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculties` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_faculties_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculties`
--

LOCK TABLES `faculties` WRITE;
/*!40000 ALTER TABLE `faculties` DISABLE KEYS */;
INSERT INTO `faculties` VALUES (2,'cs','2026-10-20 06:29:29','2026-10-20 06:29:29'),(3,'ELC','2026-10-20 06:43:51','2026-10-20 06:43:51'),(4,'dfdgf','2026-10-20 18:59:25','2026-10-20 18:59:25');
/*!40000 ALTER TABLE `faculties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_criteria`
--

DROP TABLE IF EXISTS `form_criteria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_criteria` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `section_id` bigint unsigned NOT NULL,
  `text` varchar(600) NOT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_criteria_section` (`section_id`,`sort_order`),
  CONSTRAINT `fk_criteria_section` FOREIGN KEY (`section_id`) REFERENCES `form_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=291 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_criteria`
--

LOCK TABLES `form_criteria` WRITE;
/*!40000 ALTER TABLE `form_criteria` DISABLE KEYS */;
INSERT INTO `form_criteria` VALUES (1,1,'Presents the course objective clearly.',1,1),(2,1,'Specifies the activities to be done during the lesson clearly.',2,1),(3,1,'Explains the content of each units/chapters clearly.',3,1),(4,1,'Covers the course content according to time table given.',4,1),(5,1,'Presents the course clearly using the language of instruction.',5,1),(6,1,'Responds students\' question positively.',6,1),(7,1,'Links the lesson clearly to the previous and future lessons.',7,1),(8,1,'Adapt knowledge to the level of the learners.',8,1),(9,1,'Makes students active participant during teaching and learning.',9,1),(10,1,'Tries to support students\' attempt in solving problems.',10,1),(11,1,'Gives time for students during lessons.',11,1),(12,1,'Use a variety of teaching techniques to accommodate different student learning styles.',12,1),(13,1,'Make the class thought provoking and interesting.',13,1),(14,1,'Gives make up classes properly if classes are missed',14,1),(15,1,'Gives tutorial classes properly when assigned',15,1),(16,2,'Begins and ends class on time.',1,1),(17,2,'Make effective use of class time (time on task).',2,1),(18,2,'Gives consultation service for students in arranged hours.',3,1),(19,2,'Show genuine concern for student\'s learning/problems.',4,1),(20,2,'Encourages students to freely express feelings/opinion/ideas in classes.',5,1),(21,2,'Encourages students\' peer/cooperative learning.',6,1),(22,2,'Acts in a professionally acceptable manner.',7,1),(23,2,'Able to handle classroom atmosphere conducive.',8,1),(24,3,'Checks if students have understood the topic.',1,1),(25,3,'Assesses students\' learning with various techniques.',2,1),(26,3,'Shows timely students results in every assessment.',3,1),(27,3,'Gives subsequent feedback on time.',4,1),(28,3,'Constructs tests that represent the course content.',5,1),(29,3,'Allots appropriate time to complete exams.',6,1),(30,3,'Assesses student performance continually to improve instruction.',7,1),(31,4,'Efforts of self development in his/her specialization',1,1),(32,4,'Adequacy of subject matter knowledge',2,1),(33,4,'Willingness to accept additional teaching assignments when compelling situation arises in the department',3,1),(34,4,'Willingness to accept related assignments other than regular teaching in the department (mentorship…)',4,1),(35,4,'Effectiveness as a mentor in educational development army, internship etc..',5,1),(36,4,'Active participation in improvement of teaching-learning process',6,1),(37,4,'Participation in community service affairs',7,1),(38,4,'Participating actively in seminars/workshop/symposia',8,1),(39,4,'Identifying priority areas in one\'s discipline and pursuing research in that area',9,1),(40,4,'Participation in research project and project proposal development',10,1),(41,4,'Performance as an academic advisor',11,1),(42,5,'Participation in problem identification and solving at department/college/institution',1,1),(43,5,'Continuous assessment implementation',2,1),(44,5,'Participating actively in departmental/College/institution affairs',3,1),(45,5,'Providing and reporting tutorial activities designed for the students',4,1),(46,5,'Participation in preparation and reviewing of teaching materials',5,1),(47,5,'Updating teaching materials',6,1),(48,5,'Willingness to share University resources with other colleagues',7,1),(49,6,'Executing assigned classes/invigilation on time.',1,1),(50,6,'Notifying and implementing consultation timely',2,1),(51,6,'Giving timely feedback to students',3,1),(52,6,'Meeting deadlines (in reporting, SIMS result feeding, submission of grade/ documents.etc)',4,1),(53,7,'Having positive attitude to work with others',1,1),(54,7,'Showing concern for the use of resources of the department and the University',2,1),(55,7,'Willingness and participation in committee works at department /University level',3,1),(56,7,'Willingness to take assignments outside the University in his area of specialization',4,1),(57,7,'His/her professional ethics (dressing, hair style, personality…)',5,1),(58,8,'Contribution in preparing and searching for teaching materials',1,1),(59,8,'Continuous update of the subject matter',2,1),(60,8,'Attending seminars organized by the department/college/school/institute',3,1),(61,8,'Level of his/her subject matter knowledge and skill',4,1),(62,9,'Willingness and level of engagement in community service activities',1,1),(63,9,'Participation on seminars/workshops at department/ college/school/ institute level during the year',2,1),(64,9,'Identifying priority areas in one\'s discipline and pursuing research in that area',3,1),(65,9,'Willingness to prepare research projects with other colleagues',4,1),(66,9,'Willingness to help colleagues in identifying areas of research and proposal development',5,1),(67,10,'Guidance and counseling role to students',1,1),(68,10,'Contributing ideas and activities that improve the teaching learning process.',2,1),(69,10,'Participation in problem identification and solving at department/college/institution',3,1),(70,10,'Willingness and preparedness to implement change tools',4,1),(71,10,'Willing to actively participate in 1-5 grouping(Education development army) activities',5,1),(72,10,'Implementation of different teaching methods in his/her discipline.',6,1),(73,10,'Properly invigilate exams and tests to ensure academic integrity',7,1),(74,11,'Willingness to participate and level of commitment in committee works',1,1),(75,11,'Participating actively in departmental/college/ institute meetings',2,1),(76,11,'Willingness to share university resources with other colleagues',3,1),(77,11,'Showing cordiality to others',4,1),(78,11,'Having positive attitude to work with others',5,1),(79,11,'Respecting ideas of others',6,1),(80,11,'Level of respect to rules and guidelines of the institution',7,1),(81,11,'His/her discipline (dressing, addictions, personality etc…)',8,1),(82,12,'Time management in department Affairs',1,1),(83,12,'Time utilization for consultation hours',2,1),(84,13,'Presents the course objective clearly.',1,1),(85,13,'Specifies the activities to be done during the lesson clearly.',2,1),(86,13,'Explains the content of each units/chapters clearly.',3,1),(87,13,'Covers the course content according to time table given.',4,1),(88,13,'Presents the course clearly using the language of instruction.',5,1),(89,13,'Responds students\' question positively.',6,1),(90,13,'Links the lesson clearly to the previous and future lessons.',7,1),(91,13,'Adapt knowledge to the level of the learners.',8,1),(92,13,'Makes students active participant during teaching and learning.',9,1),(93,13,'Tries to support students\' attempt in solving problems.',10,1),(94,13,'Gives time for students during lessons.',11,1),(95,13,'Use a variety of teaching techniques to accommodate different student learning styles.',12,1),(96,13,'Make the class thought provoking and interesting.',13,1),(97,13,'Gives make up classes properly if classes are missed',14,1),(98,13,'Gives tutorial classes properly when assigned',15,1),(99,14,'Begins and ends class on time.',1,1),(100,14,'Make effective use of class time (time on task).',2,1),(101,14,'Gives consultation service for students in arranged hours.',3,1),(102,14,'Show genuine concern for student\'s learning/problems.',4,1),(103,14,'Encourages students to freely express feelings/opinion/ideas in classes.',5,1),(104,14,'Encourages students\' peer/cooperative learning.',6,1),(105,14,'Acts in a professionally acceptable manner.',7,1),(106,14,'Able to handle classroom atmosphere conducive.',8,1),(107,15,'Provides students with appropriate assignments.',1,1),(108,15,'Checks if students have understood the topic.',2,1),(109,15,'Assesses students\' learning with various techniques.',3,1),(110,15,'Shows timely students results in every assessment.',4,1),(111,15,'Gives subsequent feedback on time.',5,1),(112,15,'Constructs tests that represent the course content.',6,1),(113,15,'Allots appropriate time to complete exams.',7,1),(114,15,'Assesses student performance continually to improve instruction.',8,1),(115,15,'Using continuous assessment during instruction.',9,1),(116,16,'Offer appropriate respect for his/her colleagues and heads.',1,1),(117,16,'Keeps dignity of his/her job and professional ethics.',2,1),(118,16,'Free from alcohol and any drug addiction.',3,1),(119,16,'Arrives on time for appointments/ meetings she/he has with colleagues for institutional activities.',4,1),(120,16,'Role model for students and surrounding society.',5,1),(121,16,'Take appropriate care for materials he/she borrows from the institution for teaching –learning process.',6,1),(122,16,'Free from considering others work or findings as if it is his/her own.',7,1),(123,16,'Raise his /her complains in the right way to the appropriate body.',8,1),(124,16,'Propose ideas on how teaching –learning activities could be improved in his/her department.',9,1),(125,17,'Attending in professional meetings and seminars.',1,1),(126,17,'Participates in activities to improve personal knowledge.',2,1),(127,17,'Participates in solving the problem arises in the department',3,1),(128,17,'Engage Professional researches in his/her field.',4,1),(129,17,'Lets the concerned college community know the outcome of his/her research.',5,1),(130,17,'Gets him/her self ready to share his/her knowledge and experience to his/her colleagues.',6,1),(131,17,'Accept constructive comments of evaluation and attempts to put in to practice for improvement.',7,1),(132,17,'Show willingness to help less experienced colleagues in identifying areas of research and develop proposals.',8,1),(133,18,'Perform additional mandates/responsibilities given to him/her.',1,1),(134,18,'Participate in the instructor\'s performance efficiency evaluation which takes place in his/her department.',2,1),(135,18,'Participate with other college and the department head in curriculum development and in accomplishing the instructional mission of the department.',3,1),(136,18,'Instructor adheres to establish laws, policies, rules and regulations that are important for the teaching and learning effectiveness.',4,1),(137,18,'Service, especially in a leadership role, on major university and college committees.',5,1),(138,18,'Handling resources and materials carefully and wisely.',6,1),(139,19,'Participates in the development of a broad vision of the university.',1,1),(140,19,'Foster relationships with institutions, colleagues, department and communities to support students learning and well-being.',2,1),(141,19,'Is aware of, and acts in accordance with the university policies and practices.',3,1),(142,19,'Holds meetings with students to discuss their learning problems.',4,1),(143,19,'Communicate with students and instructors positively.',5,1),(144,19,'Work cooperatively with his/her department head.',6,1),(145,19,'Work collegial with other college and staff in the department',7,1);
/*!40000 ALTER TABLE `form_criteria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_criteria_backup`
--

DROP TABLE IF EXISTS `form_criteria_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_criteria_backup` (
  `id` bigint unsigned NOT NULL DEFAULT '0',
  `section_id` bigint unsigned NOT NULL,
  `text` varchar(600) NOT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_criteria_backup`
--

LOCK TABLES `form_criteria_backup` WRITE;
/*!40000 ALTER TABLE `form_criteria_backup` DISABLE KEYS */;
INSERT INTO `form_criteria_backup` VALUES (1,1,'Presents the course objective clearly.',1,1),(2,1,'Specifies the activities to be done during the lesson clearly.',2,1),(3,1,'Explains the content of each units/chapters clearly.',3,1),(4,1,'Covers the course content according to time table given.',4,1),(5,1,'Presents the course clearly using the language of instruction.',5,1),(6,1,'Responds students\' question positively.',6,1),(7,1,'Links the lesson clearly to the previous and future lessons.',7,1),(8,1,'Adapt knowledge to the level of the learners.',8,1),(9,1,'Makes students active participant during teaching and learning.',9,1),(10,1,'Tries to support students\' attempt in solving problems.',10,1),(11,1,'Gives time for students during lessons.',11,1),(12,1,'Use a variety of teaching techniques to accommodate different student learning styles.',12,1),(13,1,'Make the class thought provoking and interesting.',13,1),(14,1,'Gives make up classes properly if classes are missed',14,1),(15,1,'Gives tutorial classes properly when assigned',15,1),(16,2,'Begins and ends class on time.',1,1),(17,2,'Make effective use of class time (time on task).',2,1),(18,2,'Gives consultation service for students in arranged hours.',3,1),(19,2,'Show genuine concern for student\'s learning/problems.',4,1),(20,2,'Encourages students to freely express feelings/opinion/ideas in classes.',5,1),(21,2,'Encourages students\' peer/cooperative learning.',6,1),(22,2,'Acts in a professionally acceptable manner.',7,1),(23,2,'Able to handle classroom atmosphere conducive.',8,1),(24,3,'Checks if students have understood the topic.',1,1),(25,3,'Assesses students\' learning with various techniques.',2,1),(26,3,'Shows timely students results in every assessment.',3,1),(27,3,'Gives subsequent feedback on time.',4,1),(28,3,'Constructs tests that represent the course content.',5,1),(29,3,'Allots appropriate time to complete exams.',6,1),(30,3,'Assesses student performance continually to improve instruction.',7,1),(31,4,'Efforts of self development in his/her specialization',1,1),(32,4,'Adequacy of subject matter knowledge',2,1),(33,4,'Willingness to accept additional teaching assignments when compelling situation arises in the department',3,1),(34,4,'Willingness to accept related assignments other than regular teaching in the department (mentorship…)',4,1),(35,4,'Effectiveness as a mentor in educational development army, internship etc..',5,1),(36,4,'Active participation in improvement of teaching-learning process',6,1),(37,4,'Participation in community service affairs',7,1),(38,4,'Participating actively in seminars/workshop/symposia',8,1),(39,4,'Identifying priority areas in one\'s discipline and pursuing research in that area',9,1),(40,4,'Participation in research project and project proposal development',10,1),(41,4,'Performance as an academic advisor',11,1),(42,5,'Participation in problem identification and solving at department/college/institution',1,1),(43,5,'Continuous assessment implementation',2,1),(44,5,'Participating actively in departmental/College/institution affairs',3,1),(45,5,'Providing and reporting tutorial activities designed for the students',4,1),(46,5,'Participation in preparation and reviewing of teaching materials',5,1),(47,5,'Updating teaching materials',6,1),(48,5,'Willingness to share University resources with other colleagues',7,1),(49,6,'Executing assigned classes/invigilation on time.',1,1),(50,6,'Notifying and implementing consultation timely',2,1),(51,6,'Giving timely feedback to students',3,1),(52,6,'Meeting deadlines (in reporting, SIMS result feeding, submission of grade/ documents.etc)',4,1),(53,7,'Having positive attitude to work with others',1,1),(54,7,'Showing concern for the use of resources of the department and the University',2,1),(55,7,'Willingness and participation in committee works at department /University level',3,1),(56,7,'Willingness to take assignments outside the University in his area of specialization',4,1),(57,7,'His/her professional ethics (dressing, hair style, personality…)',5,1),(58,8,'Contribution in preparing and searching for teaching materials',1,1),(59,8,'Continuous update of the subject matter',2,1),(60,8,'Attending seminars organized by the department/college/school/institute',3,1),(61,8,'Level of his/her subject matter knowledge and skill',4,1),(62,9,'Willingness and level of engagement in community service activities',1,1),(63,9,'Participation on seminars/workshops at department/ college/school/ institute level during the year',2,1),(64,9,'Identifying priority areas in one\'s discipline and pursuing research in that area',3,1),(65,9,'Willingness to prepare research projects with other colleagues',4,1),(66,9,'Willingness to help colleagues in identifying areas of research and proposal development',5,1),(67,10,'Guidance and counseling role to students',1,1),(68,10,'Contributing ideas and activities that improve the teaching learning process.',2,1),(69,10,'Participation in problem identification and solving at department/college/institution',3,1),(70,10,'Willingness and preparedness to implement change tools',4,1),(71,10,'Willing to actively participate in 1-5 grouping(Education development army) activities',5,1),(72,10,'Implementation of different teaching methods in his/her discipline.',6,1),(73,10,'Properly invigilate exams and tests to ensure academic integrity',7,1),(74,11,'Willingness to participate and level of commitment in committee works',1,1),(75,11,'Participating actively in departmental/college/ institute meetings',2,1),(76,11,'Willingness to share university resources with other colleagues',3,1),(77,11,'Showing cordiality to others',4,1),(78,11,'Having positive attitude to work with others',5,1),(79,11,'Respecting ideas of others',6,1),(80,11,'Level of respect to rules and guidelines of the institution',7,1),(81,11,'His/her discipline (dressing, addictions, personality etc…)',8,1),(82,12,'Time management in department Affairs',1,1),(83,12,'Time utilization for consultation hours',2,1),(84,13,'Presents the course objective clearly.',1,1),(85,13,'Specifies the activities to be done during the lesson clearly.',2,1),(86,13,'Explains the content of each units/chapters clearly.',3,1),(87,13,'Covers the course content according to time table given.',4,1),(88,13,'Presents the course clearly using the language of instruction.',5,1),(89,13,'Responds students\' question positively.',6,1),(90,13,'Links the lesson clearly to the previous and future lessons.',7,1),(91,13,'Adapt knowledge to the level of the learners.',8,1),(92,13,'Makes students active participant during teaching and learning.',9,1),(93,13,'Tries to support students\' attempt in solving problems.',10,1),(94,13,'Gives time for students during lessons.',11,1),(95,13,'Use a variety of teaching techniques to accommodate different student learning styles.',12,1),(96,13,'Make the class thought provoking and interesting.',13,1),(97,13,'Gives make up classes properly if classes are missed',14,1),(98,13,'Gives tutorial classes properly when assigned',15,1),(99,14,'Begins and ends class on time.',1,1),(100,14,'Make effective use of class time (time on task).',2,1),(101,14,'Gives consultation service for students in arranged hours.',3,1),(102,14,'Show genuine concern for student\'s learning/problems.',4,1),(103,14,'Encourages students to freely express feelings/opinion/ideas in classes.',5,1),(104,14,'Encourages students\' peer/cooperative learning.',6,1),(105,14,'Acts in a professionally acceptable manner.',7,1),(106,14,'Able to handle classroom atmosphere conducive.',8,1),(107,15,'Provides students with appropriate assignments.',1,1),(108,15,'Checks if students have understood the topic.',2,1),(109,15,'Assesses students\' learning with various techniques.',3,1),(110,15,'Shows timely students results in every assessment.',4,1),(111,15,'Gives subsequent feedback on time.',5,1),(112,15,'Constructs tests that represent the course content.',6,1),(113,15,'Allots appropriate time to complete exams.',7,1),(114,15,'Assesses student performance continually to improve instruction.',8,1),(115,15,'Using continuous assessment during instruction.',9,1),(116,16,'Offer appropriate respect for his/her colleagues and heads.',1,1),(117,16,'Keeps dignity of his/her job and professional ethics.',2,1),(118,16,'Free from alcohol and any drug addiction.',3,1),(119,16,'Arrives on time for appointments/ meetings she/he has with colleagues for institutional activities.',4,1),(120,16,'Role model for students and surrounding society.',5,1),(121,16,'Take appropriate care for materials he/she borrows from the institution for teaching –learning process.',6,1),(122,16,'Free from considering others work or findings as if it is his/her own.',7,1),(123,16,'Raise his /her complains in the right way to the appropriate body.',8,1),(124,16,'Propose ideas on how teaching –learning activities could be improved in his/her department.',9,1),(125,17,'Attending in professional meetings and seminars.',1,1),(126,17,'Participates in activities to improve personal knowledge.',2,1),(127,17,'Participates in solving the problem arises in the department',3,1),(128,17,'Engage Professional researches in his/her field.',4,1),(129,17,'Lets the concerned college community know the outcome of his/her research.',5,1),(130,17,'Gets him/her self ready to share his/her knowledge and experience to his/her colleagues.',6,1),(131,17,'Accept constructive comments of evaluation and attempts to put in to practice for improvement.',7,1),(132,17,'Show willingness to help less experienced colleagues in identifying areas of research and develop proposals.',8,1),(133,18,'Perform additional mandates/responsibilities given to him/her.',1,1),(134,18,'Participate in the instructor\'s performance efficiency evaluation which takes place in his/her department.',2,1),(135,18,'Participate with other college and the department head in curriculum development and in accomplishing the instructional mission of the department.',3,1),(136,18,'Instructor adheres to establish laws, policies, rules and regulations that are important for the teaching and learning effectiveness.',4,1),(137,18,'Service, especially in a leadership role, on major university and college committees.',5,1),(138,18,'Handling resources and materials carefully and wisely.',6,1),(139,19,'Participates in the development of a broad vision of the university.',1,1),(140,19,'Foster relationships with institutions, colleagues, department and communities to support students learning and well-being.',2,1),(141,19,'Is aware of, and acts in accordance with the university policies and practices.',3,1),(142,19,'Holds meetings with students to discuss their learning problems.',4,1),(143,19,'Communicate with students and instructors positively.',5,1),(144,19,'Work cooperatively with his/her department head.',6,1),(145,19,'Work collegial with other college and staff in the department',7,1),(146,39,'Presents the course objective clearly.',1,1),(147,39,'Specifies the activities to be done during the lesson clearly.',2,1),(148,39,'Explains the content of each unit/chapter clearly.',3,1),(149,39,'Covers the course content according to the timetable given.',4,1),(150,39,'Presents the course clearly using the language of instruction.',5,1),(151,39,'Responds to students’ questions positively.',6,1),(152,39,'Links the lesson clearly to previous and future lessons.',7,1),(153,39,'Adapts knowledge to the level of the learners.',8,1),(154,39,'Makes students active participants during teaching and learning.',9,1),(155,39,'Supports students’ attempts in solving problems.',10,1),(156,39,'Gives time for students during lessons.',11,1),(157,39,'Uses a variety of teaching techniques to accommodate different student learning styles.',12,1),(158,39,'Makes the class thought-provoking and interesting.',13,1),(159,39,'Provides make-up classes properly when classes are missed.',14,1),(160,39,'Provides tutorial classes properly when assigned.',15,1),(161,40,'Begins and ends class on time.',1,1),(162,40,'Makes effective use of class time (time on task).',2,1),(163,40,'Provides consultation service for students during arranged hours.',3,1),(164,40,'Shows genuine concern for students’ learning and problems.',4,1),(165,40,'Encourages students to freely express feelings, opinions, and ideas in class.',5,1),(166,40,'Encourages students’ peer/cooperative learning.',6,1),(167,40,'Acts in a professionally acceptable manner.',7,1),(168,40,'Maintains a classroom atmosphere conducive to learning.',8,1),(169,41,'Checks whether students have understood the topic.',1,1),(170,41,'Assesses students’ learning with various techniques.',2,1),(171,41,'Provides student results on time for every assessment.',3,1),(172,41,'Gives subsequent feedback on time.',4,1),(173,41,'Constructs tests that represent the course content.',5,1),(174,41,'Allots appropriate time to complete examinations.',6,1),(175,41,'Assesses student performance continually to improve instruction.',7,1),(176,42,'Makes efforts toward self-development in their specialization.',1,1),(177,42,'Demonstrates adequate subject-matter knowledge.',2,1),(178,42,'Willingly accepts additional teaching assignments when compelling situations arise in the department.',3,1),(179,42,'Willingly accepts related assignments other than regular teaching in the department (e.g., mentorship).',4,1),(180,42,'Demonstrates effectiveness as a mentor in educational development activities, internships, etc.',5,1),(181,42,'Actively participates in improving the teaching-learning process.',6,1),(182,42,'Participates in community service affairs.',7,1),(183,42,'Actively participates in seminars, workshops, and symposia.',8,1),(184,42,'Identifies priority areas in their discipline and pursues research in those areas.',9,1),(185,42,'Participates in research projects and project-proposal development.',10,1),(186,42,'Performs effectively as an academic advisor.',11,1),(187,43,'Participates in problem identification and solving at department, college, or institution level.',1,1),(188,43,'Implements continuous assessment.',2,1),(189,43,'Actively participates in departmental, college, and institutional affairs.',3,1),(190,43,'Provides and reports tutorial activities designed for students.',4,1),(191,43,'Participates in preparing and reviewing teaching materials.',5,1),(192,43,'Updates teaching materials.',6,1),(193,43,'Willingly shares university resources with colleagues.',7,1),(194,44,'Executes assigned classes and invigilation duties on time.',1,1),(195,44,'Notifies and implements consultation in a timely manner.',2,1),(196,44,'Gives timely feedback to students.',3,1),(197,44,'Meets deadlines for reporting, SIMS result entry, and submission of grades/documents.',4,1),(198,45,'Maintains a positive attitude toward working with others.',1,1),(199,45,'Shows concern for the use of departmental and university resources.',2,1),(200,45,'Willingly participates in committee work at department/university level.',3,1),(201,45,'Willingly accepts assignments outside the university in their area of specialization.',4,1),(202,45,'Maintains professional ethics (e.g., dress, hairstyle, and professional conduct).',5,1),(203,46,'Contributes to preparing and searching for teaching materials.',1,1),(204,46,'Continuously updates subject-matter knowledge.',2,1),(205,46,'Attends seminars organized by the department, college, school, or institute.',3,1),(206,46,'Demonstrates subject-matter knowledge and skill.',4,1),(207,47,'Shows willingness and engagement in community-service activities.',1,1),(208,47,'Participates in seminars/workshops at department, college, school, or institute level during the year.',2,1),(209,47,'Identifies priority areas in their discipline and pursues research in those areas.',3,1),(210,47,'Shows willingness to prepare research projects with colleagues.',4,1),(211,47,'Helps colleagues identify research areas and develop proposals.',5,1),(212,48,'Provides guidance and counseling to students.',1,1),(213,48,'Contributes ideas and activities that improve the teaching-learning process.',2,1),(214,48,'Participates in problem identification and solving at department, college, or institution level.',3,1),(215,48,'Shows willingness and preparedness to implement change tools.',4,1),(216,48,'Willingly participates in 1–5 grouping (Education Development Army) activities.',5,1),(217,48,'Implements different teaching methods in their discipline.',6,1),(218,48,'Properly invigilates examinations and tests to ensure academic integrity.',7,1),(219,49,'Shows willingness to participate and commitment in committee work.',1,1),(220,49,'Actively participates in departmental, college, or institute meetings.',2,1),(221,49,'Willingly shares university resources with colleagues.',3,1),(222,49,'Shows cordiality toward others.',4,1),(223,49,'Maintains a positive attitude toward working with others.',5,1),(224,49,'Respects the ideas of others.',6,1),(225,49,'Respects institutional rules and guidelines.',7,1),(226,49,'Maintains professional discipline (e.g., dress, addictions, and personality/conduct).',8,1),(227,50,'Manages time effectively in departmental affairs.',1,1),(228,50,'Uses consultation hours effectively.',2,1),(229,51,'Presents the course objective clearly.',1,1),(230,51,'Specifies the activities to be done during the lesson clearly.',2,1),(231,51,'Explains the content of each unit/chapter clearly.',3,1),(232,51,'Covers the course content according to the timetable given.',4,1),(233,51,'Presents the course clearly using the language of instruction.',5,1),(234,51,'Responds to students’ questions positively.',6,1),(235,51,'Links the lesson clearly to previous and future lessons.',7,1),(236,51,'Adapts knowledge to the level of the learners.',8,1),(237,51,'Makes students active participants during teaching and learning.',9,1),(238,51,'Supports students’ attempts in solving problems.',10,1),(239,51,'Gives time for students during lessons.',11,1),(240,51,'Uses a variety of teaching techniques to accommodate different student learning styles.',12,1),(241,51,'Makes the class thought-provoking and interesting.',13,1),(242,51,'Provides make-up classes properly when classes are missed.',14,1),(243,51,'Provides tutorial classes properly when assigned.',15,1),(244,52,'Begins and ends class on time.',1,1),(245,52,'Makes effective use of class time (time on task).',2,1),(246,52,'Provides consultation service for students during arranged hours.',3,1),(247,52,'Shows genuine concern for students’ learning and problems.',4,1),(248,52,'Encourages students to freely express feelings, opinions, and ideas in class.',5,1),(249,52,'Encourages students’ peer/cooperative learning.',6,1),(250,52,'Acts in a professionally acceptable manner.',7,1),(251,52,'Maintains a classroom atmosphere conducive to learning.',8,1),(252,53,'Provides students with appropriate assignments.',1,1),(253,53,'Checks whether students have understood the topic.',2,1),(254,53,'Assesses students’ learning with various techniques.',3,1),(255,53,'Provides student results on time for every assessment.',4,1),(256,53,'Gives subsequent feedback on time.',5,1),(257,53,'Constructs tests that represent the course content.',6,1),(258,53,'Allots appropriate time to complete examinations.',7,1),(259,53,'Assesses student performance continually to improve instruction.',8,1),(260,53,'Uses continuous assessment during instruction.',9,1),(261,54,'Shows appropriate respect for colleagues and department heads.',1,1),(262,54,'Maintains the dignity of the job and professional ethics.',2,1),(263,54,'Is free from alcohol and drug addiction.',3,1),(264,54,'Arrives on time for appointments and meetings with colleagues for institutional activities.',4,1),(265,54,'Acts as a role model for students and the surrounding society.',5,1),(266,54,'Takes appropriate care of materials borrowed from the institution for teaching and learning.',6,1),(267,54,'Does not present others’ work or findings as their own.',7,1),(268,54,'Raises complaints through the proper process and to the appropriate body.',8,1),(269,54,'Proposes ideas for improving teaching-learning activities in the department.',9,1),(270,55,'Attends professional meetings and seminars.',1,1),(271,55,'Participates in activities to improve personal knowledge.',2,1),(272,55,'Participates in solving problems that arise in the department.',3,1),(273,55,'Engages in professional research in their field.',4,1),(274,55,'Shares research outcomes with the concerned college community.',5,1),(275,55,'Is ready to share knowledge and experience with colleagues.',6,1),(276,55,'Accepts constructive evaluation comments and attempts to apply them for improvement.',7,1),(277,55,'Helps less experienced colleagues identify research areas and develop proposals.',8,1),(278,55,'Performs additional mandates and responsibilities assigned to them.',9,1),(279,55,'Participates in instructor performance-efficiency evaluation in the department.',10,1),(280,55,'Participates with the college and department head in curriculum development and accomplishing the department’s instructional mission.',11,1),(281,55,'Adheres to established laws, policies, rules, and regulations that support effective teaching and learning.',12,1),(282,55,'Serves in leadership roles on major university and college committees.',13,1),(283,55,'Handles resources and materials carefully and wisely.',14,1),(284,56,'Participates in developing a broad vision for the university.',1,1),(285,56,'Fosters relationships with institutions, colleagues, departments, and communities to support student learning and well-being.',2,1),(286,56,'Is aware of and acts in accordance with university policies and practices.',3,1),(287,56,'Holds meetings with students to discuss their learning problems.',4,1),(288,56,'Communicates positively with students and instructors.',5,1),(289,56,'Works cooperatively with their department head.',6,1),(290,56,'Works collegially with other college and departmental staff.',7,1);
/*!40000 ALTER TABLE `form_criteria_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_sections`
--

DROP TABLE IF EXISTS `form_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_sections` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `form_id` bigint unsigned NOT NULL,
  `section_key` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sections_form_key` (`form_id`,`section_key`),
  CONSTRAINT `fk_sections_form` FOREIGN KEY (`form_id`) REFERENCES `evaluation_forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_sections`
--

LOCK TABLES `form_sections` WRITE;
/*!40000 ALTER TABLE `form_sections` DISABLE KEYS */;
INSERT INTO `form_sections` VALUES (1,1,'instructional','Instructional Skills',1),(2,1,'ethics','Professional Ethics and Attitude Towards Students',2),(3,1,'assessment','Assessment Methods & Feedback',3),(4,2,'core','Core Competency',1),(5,2,'professional','Professional Competency',2),(6,2,'time','Time Management',3),(7,2,'ethical','Ethical Competence',4),(8,3,'subject','Subject Matter Competency',1),(9,3,'research','Research and Community Services',2),(10,3,'professional','Professional Competency',3),(11,3,'ethical','Ethical Competence',4),(12,3,'time','Time Management',5),(13,4,'instructional','Instructional Skills',1),(14,4,'ethics','Professional Ethics and Attitude Towards Students',2),(15,4,'assessment','Assessment Methods & Feedback',3),(16,4,'behavior','Overall Personal Behavior',4),(17,4,'attitude','Professional Attitude',5),(18,4,'noninstructional','Performing Non-instructional Duties',6),(19,4,'interpersonal','Interpersonal Relationship Capability',7);
/*!40000 ALTER TABLE `form_sections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_sections_backup`
--

DROP TABLE IF EXISTS `form_sections_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_sections_backup` (
  `id` bigint unsigned NOT NULL DEFAULT '0',
  `form_id` bigint unsigned NOT NULL,
  `section_key` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_sections_backup`
--

LOCK TABLES `form_sections_backup` WRITE;
/*!40000 ALTER TABLE `form_sections_backup` DISABLE KEYS */;
INSERT INTO `form_sections_backup` VALUES (1,1,'instructional','Instructional Skills',1),(2,1,'ethics','Professional Ethics and Attitude Towards Students',2),(3,1,'assessment','Assessment Methods & Feedback',3),(4,2,'core','Core Competency',1),(5,2,'professional','Professional Competency',2),(6,2,'time','Time Management',3),(7,2,'ethical','Ethical Competence',4),(8,3,'subject','Subject Matter Competency',1),(9,3,'research','Research and Community Services',2),(10,3,'professional','Professional Competency',3),(11,3,'ethical','Ethical Competence',4),(12,3,'time','Time Management',5),(13,4,'instructional','Instructional Skills',1),(14,4,'ethics','Professional Ethics and Attitude Towards Students',2),(15,4,'assessment','Assessment Methods & Feedback',3),(16,4,'behavior','Overall Personal Behavior',4),(17,4,'attitude','Professional Attitude',5),(18,4,'noninstructional','Performing Non-instructional Duties',6),(19,4,'interpersonal','Interpersonal Relationship Capability',7),(39,1,'A-1','Instructional skills',1),(40,1,'A-2','Professional Ethics and Attitude Towards Students',2),(41,1,'A-3','Assessment Methods & Feedback',3),(42,2,'B-1','Core Competency',1),(43,2,'B-2','Professional Competency',2),(44,2,'B-3','Time Management',3),(45,2,'B-4','Ethical Competence',4),(46,3,'C-1','Subject Matter Competency',1),(47,3,'C-2','Research and Community Services',2),(48,3,'C-3','Professional Competency',3),(49,3,'C-4','Ethical Competence',4),(50,3,'C-5','Time Management',5),(51,4,'D-1','Instructional Skills',1),(52,4,'D-2','Professional Ethics and Attitude Towards Students',2),(53,4,'D-3','Assessment Methods & Feedback',3),(54,4,'D-4','Overall Personal Behavior',4),(55,4,'D-5','Professional Attitude',5),(56,4,'D-6','Interpersonal Relationship Capability',6);
/*!40000 ALTER TABLE `form_sections_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instructors`
--

DROP TABLE IF EXISTS `instructors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instructors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(180) NOT NULL,
  `college` varchar(150) NOT NULL,
  `department` varchar(150) NOT NULL,
  `email` varchar(254) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_instructors_email` (`email`),
  KEY `idx_instructors_name` (`full_name`),
  KEY `idx_instructors_college` (`college`),
  KEY `idx_instructors_department` (`department`),
  KEY `idx_instructors_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instructors`
--

LOCK TABLES `instructors` WRITE;
/*!40000 ALTER TABLE `instructors` DISABLE KEYS */;
/*!40000 ALTER TABLE `instructors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`,`is_read`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','student','teacher','department_head','dean','committee','management') NOT NULL DEFAULT 'student',
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phone` varchar(20) DEFAULT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `id_number` varchar(40) DEFAULT NULL COMMENT 'employee or student ID, set by admin',
  `profile_photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'dame','damedereje123@gmail.com','$2b$12$S3Su2Ew7rqSNTGEbV3i7gOCSq2U7ArnaBg7ZP2YHnHv0ksJAlYg7q','admin','active','2026-10-19 20:34:00','2026-10-19 23:31:07',NULL,NULL,NULL,NULL,NULL,NULL),(2,'Dame Dereje','damedereje@gmail.com','$2b$12$LJwXVLlzSNqUgczXDAjkp.APUNomxAmfjhyZ6Oe.qTIx.Wym8txjG','student','active','2026-10-19 21:59:02','2026-10-19 21:59:02',NULL,NULL,NULL,NULL,NULL,NULL),(3,'amo','amo@gmail.com','$2b$12$eb.SNyBr1VoMX4ochFjZ8.lCin6KawVy8VDhAGVD.zrlNRUAXVi1W','department_head','active','2026-10-20 00:07:00','2026-10-20 00:07:00',NULL,NULL,NULL,NULL,NULL,NULL),(4,'caalaa','caalaa@gmail.com','$2b$12$xKQgDQdhnj1eQz4VYERqcOqthQB5ERQH96sL2hcxuOs5LOA5LCNw6','teacher','active','2026-10-20 00:07:41','2026-10-20 00:07:41',NULL,NULL,NULL,NULL,NULL,NULL),(5,'solan','sol@gmail.com','$2b$12$l2RgBy3INCuMvQvPD9OH3OrPRVvxycU8BWr1.KFgWmyQQg1rGw7SS','teacher','active','2026-10-20 06:48:43','2026-10-20 06:48:43',NULL,NULL,NULL,NULL,NULL,NULL),(6,'gammee','dame@gmail.com','$2b$12$.qoPKQd9fyNB/2Ss1d5wTehTqR0tYw/XNTbGuzDZDXcYS3.W407UG','committee','active','2026-10-21 05:00:25','2026-10-21 05:00:25',NULL,NULL,NULL,NULL,NULL,NULL),(7,'saamii','sami@gmail.com','$2b$12$MTxqPIfZ8zZQuivPAnOx.efJJGWFtnRj/d/WWjMVb4bjs4fVginuy','teacher','active','2026-10-21 22:04:29','2026-10-21 22:04:29','0929423026','male','2026-10-30','Ethio','6745',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-22 11:18:02
