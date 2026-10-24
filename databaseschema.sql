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
) ENGINE=InnoDB AUTO_INCREMENT=486 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,3,'login','user',3,'{}','::1','2026-10-21 16:47:15'),(2,3,'login','user',3,'{}','::1','2026-10-21 16:47:50'),(3,3,'login','user',3,'{}','::1','2026-10-21 17:15:12'),(4,3,'login','user',3,'{}','::1','2026-10-21 17:16:15'),(5,1,'auth.login_success','user',1,'{}',NULL,'2026-10-21 20:12:05'),(6,1,'auth.login_success','user',1,'{}',NULL,'2026-10-21 20:49:23'),(7,1,'auth.login_success','user',1,'{}',NULL,'2026-10-21 21:21:19'),(8,1,'auth.login','user',1,'{}',NULL,'2026-10-21 21:56:10'),(9,1,'user.updated','user',1,'{\"newRole\": \"admin\", \"previousRole\": \"admin\"}','::1','2026-10-21 22:03:09'),(10,1,'user.created','user',7,'{\"role\": \"teacher\"}','::1','2026-10-21 22:04:29'),(11,1,'auth.login','user',1,'{}',NULL,'2026-10-22 07:10:27'),(12,1,'auth.login','user',1,'{}',NULL,'2026-10-22 07:36:23'),(13,1,'auth.login','user',1,'{}',NULL,'2026-10-22 07:48:20'),(14,1,'cycle.created','evaluation_cycle',5,'{\"title\": \"ambo\", \"endDate\": \"2026-10-30\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}','::1','2026-10-22 07:59:43'),(15,1,'auth.login','user',1,'{}',NULL,'2026-10-22 08:15:18'),(16,1,'cycle.updated','evaluation_cycle',5,'{\"after\": {\"title\": \"ambo\", \"endDate\": \"2026-10-31\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}, \"before\": {\"title\": \"ambo\", \"endDate\": \"2026-10-30\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}}','::1','2026-10-22 08:15:54'),(17,1,'auth.login','user',1,'{}',NULL,'2026-10-22 08:34:36'),(18,1,'auth.login','user',1,'{}',NULL,'2026-10-22 09:46:55'),(19,1,'user.created','user',8,'{\"role\": \"student\"}','::1','2026-10-22 09:48:44'),(20,8,'auth.login','user',8,'{}',NULL,'2026-10-22 09:48:57'),(21,8,'auth.login','user',8,'{}',NULL,'2026-10-22 10:07:06'),(22,1,'auth.login','user',1,'{}',NULL,'2026-10-22 10:07:24'),(23,1,'auth.login','user',1,'{}',NULL,'2026-10-22 10:35:12'),(24,1,'auth.login','user',1,'{}',NULL,'2026-10-22 10:36:22'),(25,1,'auth.login','user',1,'{}',NULL,'2026-10-22 10:46:53'),(26,7,'auth.login','user',7,'{}',NULL,'2026-10-22 10:49:12'),(27,1,'auth.login','user',1,'{}',NULL,'2026-10-22 11:25:18'),(28,1,'cycle.created','evaluation_cycle',6,'{\"title\": \"dom\", \"endDate\": \"2026-10-30\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}','::1','2026-10-22 11:25:58'),(29,1,'cycle.created','evaluation_cycle',7,'{\"title\": \"java\", \"endDate\": \"2026-11-07\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}','::1','2026-10-22 11:29:38'),(30,1,'tasks.created','evaluation_cycle',7,'{\"created\": 4, \"skipped\": 0, \"courseCode\": \"100\", \"instructorId\": 7}','::1','2026-10-22 11:30:49'),(31,7,'auth.login','user',7,'{}',NULL,'2026-10-22 11:31:18'),(32,8,'auth.login','user',8,'{}',NULL,'2026-10-22 11:32:18'),(33,7,'auth.login','user',7,'{}',NULL,'2026-10-22 11:34:49'),(34,1,'auth.login','user',1,'{}',NULL,'2026-10-22 11:35:13'),(35,1,'cycle.created','evaluation_cycle',8,'{\"title\": \"javas\", \"endDate\": \"2026-10-31\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}','::1','2026-10-22 11:37:31'),(36,1,'cycle.updated','evaluation_cycle',8,'{\"after\": {\"title\": \"javas\", \"endDate\": \"2026-10-31\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}, \"before\": {\"title\": \"javas\", \"endDate\": \"2026-10-31\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}}','::1','2026-10-22 11:37:42'),(37,8,'auth.login','user',8,'{}',NULL,'2026-10-22 11:43:45'),(38,7,'auth.login','user',7,'{}',NULL,'2026-10-22 11:44:51'),(39,1,'auth.login','user',1,'{}',NULL,'2026-10-22 11:45:07'),(40,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 1, \"assignmentId\": 2}','::1','2026-10-22 11:45:40'),(41,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 1, \"assignmentId\": 2}','::1','2026-10-22 11:45:48'),(42,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 2, \"assignmentId\": 2}','::1','2026-10-22 11:45:49'),(43,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 3, \"assignmentId\": 2}','::1','2026-10-22 11:46:05'),(44,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 5, \"assignmentId\": 2}','::1','2026-10-22 11:46:08'),(45,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 6, \"assignmentId\": 2}','::1','2026-10-22 11:46:11'),(46,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 7, \"assignmentId\": 2}','::1','2026-10-22 11:46:13'),(47,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 8, \"assignmentId\": 2}','::1','2026-10-22 11:46:15'),(48,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 10, \"assignmentId\": 2}','::1','2026-10-22 11:46:17'),(49,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 11, \"assignmentId\": 2}','::1','2026-10-22 11:46:20'),(50,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 13, \"assignmentId\": 2}','::1','2026-10-22 11:46:24'),(51,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 16, \"assignmentId\": 2}','::1','2026-10-22 11:46:28'),(52,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 18, \"assignmentId\": 2}','::1','2026-10-22 11:46:31'),(53,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 20, \"assignmentId\": 2}','::1','2026-10-22 11:46:37'),(54,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 24, \"assignmentId\": 2}','::1','2026-10-22 11:46:43'),(55,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 26, \"assignmentId\": 2}','::1','2026-10-22 11:46:46'),(56,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 27, \"assignmentId\": 2}','::1','2026-10-22 11:46:48'),(57,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 27, \"assignmentId\": 2}','::1','2026-10-22 11:46:56'),(58,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 27, \"assignmentId\": 2}','::1','2026-10-22 11:47:01'),(59,1,'evaluation_saved_draft','evaluation',3,'{\"scoreCount\": 27, \"assignmentId\": 2}','::1','2026-10-22 11:47:37'),(60,1,'evaluation_submitted','evaluation',3,'{\"average\": 0.926, \"assignmentId\": 2, \"weightedScore\": 6.481}','::1','2026-10-22 11:47:37'),(61,8,'auth.login','user',8,'{}',NULL,'2026-10-22 11:48:24'),(62,8,'auth.login','user',8,'{}',NULL,'2026-10-22 11:51:56'),(63,1,'auth.login','user',1,'{}',NULL,'2026-10-22 11:52:03'),(64,1,'cycle.status_changed','evaluation_cycle',1,'{\"newStatus\": \"closed\", \"previousStatus\": \"active\"}','::1','2026-10-22 11:53:03'),(65,1,'cycle.status_changed','evaluation_cycle',8,'{\"newStatus\": \"active\", \"previousStatus\": \"upcoming\"}','::1','2026-10-22 11:54:23'),(66,8,'auth.login','user',8,'{}',NULL,'2026-10-22 11:54:35'),(67,7,'auth.login','user',7,'{}',NULL,'2026-10-22 11:55:35'),(68,7,'auth.login','user',7,'{}',NULL,'2026-10-22 11:56:43'),(69,7,'auth.login','user',7,'{}',NULL,'2026-10-22 11:57:28'),(70,1,'auth.login','user',1,'{}',NULL,'2026-10-22 11:58:38'),(71,1,'cycle.status_changed','evaluation_cycle',8,'{\"newStatus\": \"closed\", \"previousStatus\": \"active\"}','::1','2026-10-22 11:59:31'),(72,1,'cycle.status_changed','evaluation_cycle',7,'{\"newStatus\": \"active\", \"previousStatus\": \"upcoming\"}','::1','2026-10-22 11:59:45'),(73,8,'auth.login','user',8,'{}',NULL,'2026-10-22 11:59:57'),(74,1,'auth.login','user',1,'{}',NULL,'2026-10-22 12:00:24'),(75,8,'auth.login','user',8,'{}',NULL,'2026-10-22 12:01:29'),(76,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 2, \"assignmentId\": 9}','::1','2026-10-22 12:01:51'),(77,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 5, \"assignmentId\": 9}','::1','2026-10-22 12:01:59'),(78,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 6, \"assignmentId\": 9}','::1','2026-10-22 12:02:01'),(79,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 8, \"assignmentId\": 9}','::1','2026-10-22 12:02:04'),(80,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 10, \"assignmentId\": 9}','::1','2026-10-22 12:02:06'),(81,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 12, \"assignmentId\": 9}','::1','2026-10-22 12:02:09'),(82,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 14, \"assignmentId\": 9}','::1','2026-10-22 12:02:12'),(83,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 18, \"assignmentId\": 9}','::1','2026-10-22 12:02:18'),(84,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 20, \"assignmentId\": 9}','::1','2026-10-22 12:02:21'),(85,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 21, \"assignmentId\": 9}','::1','2026-10-22 12:02:23'),(86,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 22, \"assignmentId\": 9}','::1','2026-10-22 12:02:24'),(87,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 23, \"assignmentId\": 9}','::1','2026-10-22 12:02:26'),(88,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 24, \"assignmentId\": 9}','::1','2026-10-22 12:02:28'),(89,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 25, \"assignmentId\": 9}','::1','2026-10-22 12:02:29'),(90,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 27, \"assignmentId\": 9}','::1','2026-10-22 12:02:32'),(91,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 29, \"assignmentId\": 9}','::1','2026-10-22 12:02:34'),(92,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 29, \"assignmentId\": 9}','::1','2026-10-22 12:02:39'),(93,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 29, \"assignmentId\": 9}','::1','2026-10-22 12:02:50'),(94,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 30, \"assignmentId\": 9}','::1','2026-10-22 12:03:03'),(95,8,'evaluation_saved_draft','evaluation',4,'{\"scoreCount\": 30, \"assignmentId\": 9}','::1','2026-10-22 12:03:34'),(96,8,'evaluation_submitted','evaluation',4,'{\"average\": 1.867, \"assignmentId\": 9, \"weightedScore\": 14.933}','::1','2026-10-22 12:03:34'),(97,7,'auth.login','user',7,'{}',NULL,'2026-10-22 12:03:47'),(98,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 3, \"assignmentId\": 11}','::1','2026-10-22 12:13:07'),(99,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 4, \"assignmentId\": 11}','::1','2026-10-22 12:13:09'),(100,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 5, \"assignmentId\": 11}','::1','2026-10-22 12:13:11'),(101,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 7, \"assignmentId\": 11}','::1','2026-10-22 12:13:14'),(102,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 9, \"assignmentId\": 11}','::1','2026-10-22 12:13:17'),(103,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 10, \"assignmentId\": 11}','::1','2026-10-22 12:13:19'),(104,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 12, \"assignmentId\": 11}','::1','2026-10-22 12:13:23'),(105,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 15, \"assignmentId\": 11}','::1','2026-10-22 12:13:26'),(106,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 17, \"assignmentId\": 11}','::1','2026-10-22 12:13:29'),(107,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 18, \"assignmentId\": 11}','::1','2026-10-22 12:13:31'),(108,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 21, \"assignmentId\": 11}','::1','2026-10-22 12:13:36'),(109,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 24, \"assignmentId\": 11}','::1','2026-10-22 12:13:41'),(110,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 25, \"assignmentId\": 11}','::1','2026-10-22 12:13:44'),(111,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 26, \"assignmentId\": 11}','::1','2026-10-22 12:13:45'),(112,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 28, \"assignmentId\": 11}','::1','2026-10-22 12:13:49'),(113,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 31, \"assignmentId\": 11}','::1','2026-10-22 12:13:53'),(114,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 34, \"assignmentId\": 11}','::1','2026-10-22 12:13:57'),(115,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 36, \"assignmentId\": 11}','::1','2026-10-22 12:13:59'),(116,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 40, \"assignmentId\": 11}','::1','2026-10-22 12:14:04'),(117,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 41, \"assignmentId\": 11}','::1','2026-10-22 12:14:06'),(118,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 44, \"assignmentId\": 11}','::1','2026-10-22 12:14:09'),(119,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 48, \"assignmentId\": 11}','::1','2026-10-22 12:14:15'),(120,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 50, \"assignmentId\": 11}','::1','2026-10-22 12:14:18'),(121,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 51, \"assignmentId\": 11}','::1','2026-10-22 12:14:20'),(122,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 51, \"assignmentId\": 11}','::1','2026-10-22 12:14:24'),(123,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 52, \"assignmentId\": 11}','::1','2026-10-22 12:14:26'),(124,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 53, \"assignmentId\": 11}','::1','2026-10-22 12:14:28'),(125,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 59, \"assignmentId\": 11}','::1','2026-10-22 12:14:37'),(126,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 61, \"assignmentId\": 11}','::1','2026-10-22 12:14:40'),(127,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 61, \"assignmentId\": 11}','::1','2026-10-22 12:14:44'),(128,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 61, \"assignmentId\": 11}','::1','2026-10-22 12:14:47'),(129,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 61, \"assignmentId\": 11}','::1','2026-10-22 12:14:49'),(130,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 62, \"assignmentId\": 11}','::1','2026-10-22 12:14:55'),(131,7,'evaluation_saved_draft','evaluation',5,'{\"scoreCount\": 62, \"assignmentId\": 11}','::1','2026-10-22 12:15:00'),(132,7,'evaluation_submitted','evaluation',5,'{\"average\": 2.452, \"assignmentId\": 11, \"weightedScore\": 4.903}','::1','2026-10-22 12:15:00'),(133,8,'auth.login','user',8,'{}',NULL,'2026-10-22 12:15:24'),(134,1,'auth.login','user',1,'{}',NULL,'2026-10-22 12:15:39'),(135,3,'auth.login','user',3,'{}',NULL,'2026-10-22 12:16:43'),(136,1,'auth.login','user',1,'{}',NULL,'2026-10-22 12:18:36'),(137,1,'evaluation_approved','evaluation',3,'{\"stage\": \"committee\", \"comment\": \"goood\"}','::1','2026-10-22 12:19:48'),(138,1,'evaluation_approved','evaluation',2,'{\"stage\": \"committee\", \"comment\": \"good\"}','::1','2026-10-22 12:20:00'),(139,1,'evaluation_approved','evaluation',1,'{\"stage\": \"committee\", \"comment\": \"good\"}','::1','2026-10-22 12:20:06'),(140,1,'evaluation_approved','evaluation',2,'{\"stage\": \"department_head\", \"comment\": \"good\"}','::1','2026-10-22 12:20:19'),(141,1,'evaluation_approved','evaluation',2,'{\"stage\": \"dean\", \"comment\": \"goood\"}','::1','2026-10-22 12:20:27'),(142,1,'evaluation_approved','evaluation',2,'{\"stage\": \"management\", \"comment\": \"good\"}','::1','2026-10-22 12:20:34'),(143,1,'evaluation_approved','evaluation',3,'{\"stage\": \"department_head\", \"comment\": \"goo\"}','::1','2026-10-22 12:20:42'),(144,7,'auth.login','user',7,'{}',NULL,'2026-10-22 12:23:05'),(145,1,'auth.login','user',1,'{}',NULL,'2026-10-22 12:23:58'),(146,3,'auth.login','user',3,'{}',NULL,'2026-10-22 12:24:27'),(147,1,'auth.login','user',1,'{}',NULL,'2026-10-22 12:59:03'),(148,1,'auth.login','user',1,'{}',NULL,'2026-10-22 13:57:33'),(149,1,'auth.login','user',1,'{}',NULL,'2026-10-22 16:02:08'),(150,3,'auth.login','user',3,'{}',NULL,'2026-10-22 16:16:27'),(151,8,'auth.login','user',8,'{}',NULL,'2026-10-22 16:17:20'),(152,1,'auth.login','user',1,'{}',NULL,'2026-10-22 16:17:57'),(153,1,'cycle.status_changed','evaluation_cycle',7,'{\"newStatus\": \"closed\", \"previousStatus\": \"active\"}','::1','2026-10-22 16:18:30'),(154,1,'cycle.updated','evaluation_cycle',6,'{\"after\": {\"title\": \"dom\", \"endDate\": \"2026-10-31\", \"startDate\": \"2026-10-23\", \"academicYear\": \"2024\"}, \"before\": {\"title\": \"dom\", \"endDate\": \"2026-10-30\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}}','::1','2026-10-22 16:19:16'),(155,1,'cycle.status_changed','evaluation_cycle',5,'{\"newStatus\": \"active\", \"previousStatus\": \"upcoming\"}','::1','2026-10-22 16:20:18'),(156,8,'auth.login','user',8,'{}',NULL,'2026-10-22 16:20:32'),(157,1,'auth.login','user',1,'{}',NULL,'2026-10-22 16:21:36'),(158,1,'cycle.created','evaluation_cycle',9,'{\"title\": \"dom\", \"endDate\": \"2026-10-30\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2025\"}','::1','2026-10-22 16:22:25'),(159,1,'cycle.status_changed','evaluation_cycle',5,'{\"newStatus\": \"closed\", \"previousStatus\": \"active\"}','::1','2026-10-22 16:22:36'),(160,1,'cycle.status_changed','evaluation_cycle',9,'{\"newStatus\": \"active\", \"previousStatus\": \"upcoming\"}','::1','2026-10-22 16:22:47'),(161,8,'auth.login','user',8,'{}',NULL,'2026-10-22 16:23:03'),(162,3,'auth.login','user',3,'{}',NULL,'2026-10-22 16:23:40'),(163,1,'auth.login','user',1,'{}',NULL,'2026-10-22 16:25:10'),(164,1,'cycle.status_changed','evaluation_cycle',9,'{\"newStatus\": \"closed\", \"previousStatus\": \"active\"}','::1','2026-10-22 16:27:04'),(165,1,'cycle.status_changed','evaluation_cycle',2,'{\"newStatus\": \"active\", \"previousStatus\": \"upcoming\"}','::1','2026-10-22 16:27:12'),(166,1,'tasks.created','evaluation_cycle',6,'{\"created\": 6, \"skipped\": 0, \"courseCode\": \"100\", \"instructorId\": 4}','::1','2026-10-22 16:29:11'),(167,1,'evaluation_approved','evaluation',1,'{\"stage\": \"department_head\", \"comment\": \"jh\"}','::1','2026-10-22 16:29:33'),(168,1,'evaluation_approved','evaluation',1,'{\"stage\": \"dean\", \"comment\": null}','::1','2026-10-22 16:29:50'),(169,8,'auth.login','user',8,'{}',NULL,'2026-10-22 16:30:01'),(170,8,'auth.login','user',8,'{}',NULL,'2026-10-22 17:10:28'),(171,8,'auth.login','user',8,'{}',NULL,'2026-10-22 17:10:48'),(172,1,'auth.login','user',1,'{}',NULL,'2026-10-22 17:11:08'),(173,1,'cycle.created','evaluation_cycle',10,'{\"title\": \"active\", \"endDate\": \"2026-10-30\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2024\"}','::1','2026-10-22 17:13:42'),(174,1,'cycle.status_changed','evaluation_cycle',2,'{\"newStatus\": \"closed\", \"previousStatus\": \"active\"}','::1','2026-10-22 17:14:23'),(175,1,'cycle.created','evaluation_cycle',11,'{\"title\": \"Academic Staff Evaluation 2026\", \"endDate\": \"2026-10-30\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2026\"}','::1','2026-10-22 17:16:30'),(176,1,'cycle.status_changed','evaluation_cycle',11,'{\"newStatus\": \"active\", \"previousStatus\": \"upcoming\"}','::1','2026-10-22 17:17:02'),(177,1,'tasks.created','evaluation_cycle',11,'{\"created\": 6, \"skipped\": 0, \"courseCode\": \"100\", \"instructorId\": 7}','::1','2026-10-22 17:21:39'),(178,7,'auth.login','user',7,'{}',NULL,'2026-10-22 17:25:23'),(179,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 1, \"assignmentId\": 23}','::1','2026-10-22 17:26:18'),(180,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 2, \"assignmentId\": 23}','::1','2026-10-22 17:26:21'),(181,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 3, \"assignmentId\": 23}','::1','2026-10-22 17:26:26'),(182,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 5, \"assignmentId\": 23}','::1','2026-10-22 17:26:31'),(183,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 7, \"assignmentId\": 23}','::1','2026-10-22 17:26:34'),(184,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 13, \"assignmentId\": 23}','::1','2026-10-22 17:26:42'),(185,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 20, \"assignmentId\": 23}','::1','2026-10-22 17:26:50'),(186,8,'auth.login','user',8,'{}',NULL,'2026-10-22 17:27:00'),(187,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 1, \"assignmentId\": 19}','::1','2026-10-22 17:27:21'),(188,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 2, \"assignmentId\": 19}','::1','2026-10-22 17:27:23'),(189,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 6, \"assignmentId\": 19}','::1','2026-10-22 17:27:30'),(190,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 7, \"assignmentId\": 19}','::1','2026-10-22 17:27:31'),(191,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 10, \"assignmentId\": 19}','::1','2026-10-22 17:27:35'),(192,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 11, \"assignmentId\": 19}','::1','2026-10-22 17:27:37'),(193,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 12, \"assignmentId\": 19}','::1','2026-10-22 17:27:39'),(194,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 15, \"assignmentId\": 19}','::1','2026-10-22 17:27:44'),(195,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 17, \"assignmentId\": 19}','::1','2026-10-22 17:27:47'),(196,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 18, \"assignmentId\": 19}','::1','2026-10-22 17:27:48'),(197,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 21, \"assignmentId\": 19}','::1','2026-10-22 17:27:52'),(198,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 24, \"assignmentId\": 19}','::1','2026-10-22 17:27:56'),(199,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 27, \"assignmentId\": 19}','::1','2026-10-22 17:28:00'),(200,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 30, \"assignmentId\": 19}','::1','2026-10-22 17:28:03'),(201,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 30, \"assignmentId\": 19}','::1','2026-10-22 17:28:24'),(202,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 30, \"assignmentId\": 19}','::1','2026-10-22 17:28:39'),(203,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 30, \"assignmentId\": 19}','::1','2026-10-22 17:28:41'),(204,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 30, \"assignmentId\": 19}','::1','2026-10-22 17:28:52'),(205,8,'evaluation_saved_draft','evaluation',7,'{\"scoreCount\": 30, \"assignmentId\": 19}','::1','2026-10-22 17:29:00'),(206,8,'evaluation_submitted','evaluation',7,'{\"average\": 2.267, \"assignmentId\": 19, \"weightedScore\": 18.133}','::1','2026-10-22 17:29:00'),(207,1,'auth.login','user',1,'{}',NULL,'2026-10-22 17:57:22'),(208,3,'auth.login','user',3,'{}',NULL,'2026-10-22 17:57:42'),(209,1,'auth.login','user',1,'{}',NULL,'2026-10-22 18:37:14'),(210,7,'auth.login','user',7,'{}',NULL,'2026-10-22 18:38:18'),(211,1,'auth.login','user',1,'{}',NULL,'2026-10-22 18:40:26'),(212,1,'auth.login','user',1,'{}',NULL,'2026-10-22 18:42:15'),(213,1,'auth.login','user',1,'{}',NULL,'2026-10-22 18:42:34'),(214,6,'auth.login','user',6,'{}',NULL,'2026-10-22 18:43:26'),(215,3,'auth.login','user',3,'{}',NULL,'2026-10-22 18:44:16'),(216,7,'auth.login','user',7,'{}',NULL,'2026-10-22 18:44:39'),(217,1,'auth.login','user',1,'{}',NULL,'2026-10-22 18:45:40'),(218,1,'tasks.created','evaluation_cycle',11,'{\"created\": 0, \"skipped\": 4, \"courseCode\": \"100\", \"instructorId\": 7}','::1','2026-10-22 18:53:23'),(219,5,'auth.login','user',5,'{}',NULL,'2026-10-22 18:54:18'),(220,1,'auth.login','user',1,'{}',NULL,'2026-10-22 18:54:50'),(221,3,'auth.login','user',3,'{}',NULL,'2026-10-22 18:58:33'),(222,1,'auth.login','user',1,'{}',NULL,'2026-10-22 18:59:09'),(223,1,'tasks.created','evaluation_cycle',6,'{\"created\": 2, \"skipped\": 0, \"courseCode\": \"100\", \"instructorId\": 7}','::1','2026-10-22 18:59:40'),(224,3,'auth.login','user',3,'{}',NULL,'2026-10-22 19:00:30'),(225,1,'auth.login','user',1,'{}',NULL,'2026-10-22 19:01:41'),(226,1,'cycle.updated','evaluation_cycle',11,'{\"after\": {\"title\": \"Academic Staff Evaluation 2026\", \"endDate\": \"2026-10-30\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2026\"}, \"before\": {\"title\": \"Academic Staff Evaluation 2026\", \"endDate\": \"2026-10-30\", \"startDate\": \"2026-10-22\", \"academicYear\": \"2026\"}}','::1','2026-10-22 19:02:55'),(227,3,'auth.login','user',3,'{}',NULL,'2026-10-22 19:03:05'),(228,1,'auth.login','user',1,'{}',NULL,'2026-10-22 19:03:49'),(229,3,'auth.login','user',3,'{}',NULL,'2026-10-22 19:06:21'),(230,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 2, \"assignmentId\": 20}','::1','2026-10-22 19:07:27'),(231,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 3, \"assignmentId\": 20}','::1','2026-10-22 19:07:33'),(232,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 4, \"assignmentId\": 20}','::1','2026-10-22 19:07:36'),(233,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 5, \"assignmentId\": 20}','::1','2026-10-22 19:07:40'),(234,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 6, \"assignmentId\": 20}','::1','2026-10-22 19:07:42'),(235,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 7, \"assignmentId\": 20}','::1','2026-10-22 19:07:43'),(236,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 9, \"assignmentId\": 20}','::1','2026-10-22 19:07:48'),(237,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 10, \"assignmentId\": 20}','::1','2026-10-22 19:07:49'),(238,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 11, \"assignmentId\": 20}','::1','2026-10-22 19:07:51'),(239,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 12, \"assignmentId\": 20}','::1','2026-10-22 19:07:53'),(240,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 13, \"assignmentId\": 20}','::1','2026-10-22 19:07:55'),(241,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 15, \"assignmentId\": 20}','::1','2026-10-22 19:07:59'),(242,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 15, \"assignmentId\": 20}','::1','2026-10-22 19:08:01'),(243,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 15, \"assignmentId\": 20}','::1','2026-10-22 19:08:04'),(244,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 17, \"assignmentId\": 20}','::1','2026-10-22 19:08:08'),(245,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 18, \"assignmentId\": 20}','::1','2026-10-22 19:08:10'),(246,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 20, \"assignmentId\": 20}','::1','2026-10-22 19:08:12'),(247,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 22, \"assignmentId\": 20}','::1','2026-10-22 19:08:16'),(248,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 23, \"assignmentId\": 20}','::1','2026-10-22 19:08:17'),(249,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 24, \"assignmentId\": 20}','::1','2026-10-22 19:08:19'),(250,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 26, \"assignmentId\": 20}','::1','2026-10-22 19:08:24'),(251,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 27, \"assignmentId\": 20}','::1','2026-10-22 19:08:25'),(252,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 27, \"assignmentId\": 20}','::1','2026-10-22 19:08:32'),(253,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 27, \"assignmentId\": 20}','::1','2026-10-22 19:08:46'),(254,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 27, \"assignmentId\": 20}','::1','2026-10-22 19:08:48'),(255,3,'evaluation_saved_draft','evaluation',8,'{\"scoreCount\": 27, \"assignmentId\": 20}','::1','2026-10-22 19:08:59'),(256,3,'evaluation_submitted','evaluation',8,'{\"average\": 1.37, \"assignmentId\": 20, \"weightedScore\": 9.593}','::1','2026-10-22 19:09:00'),(257,6,'auth.login','user',6,'{}',NULL,'2026-10-22 19:09:17'),(258,8,'auth.login','user',8,'{}',NULL,'2026-10-22 19:10:02'),(259,7,'auth.login','user',7,'{}',NULL,'2026-10-22 19:10:40'),(260,3,'auth.login','user',3,'{}',NULL,'2026-10-22 19:11:29'),(261,6,'auth.login','user',6,'{}',NULL,'2026-10-22 19:11:46'),(262,3,'auth.login','user',3,'{}',NULL,'2026-10-22 19:12:37'),(263,3,'auth.login','user',3,'{}',NULL,'2026-10-22 19:14:13'),(264,6,'auth.login','user',6,'{}',NULL,'2026-10-22 19:14:32'),(265,6,'evaluation_approved','evaluation',4,'{\"stage\": \"committee\", \"comment\": null}','::1','2026-10-22 19:21:29'),(266,6,'evaluation_approved','evaluation',5,'{\"stage\": \"committee\", \"comment\": null}','::1','2026-10-22 19:21:42'),(267,6,'evaluation_approved','evaluation',7,'{\"stage\": \"committee\", \"comment\": null}','::1','2026-10-22 19:21:46'),(268,6,'evaluation_approved','evaluation',8,'{\"stage\": \"committee\", \"comment\": null}','::1','2026-10-22 19:21:49'),(269,3,'auth.login','user',3,'{}',NULL,'2026-10-22 19:23:28'),(270,3,'evaluation_approved','evaluation',4,'{\"stage\": \"department_head\", \"comment\": \"Reviewed the submitted student evaluation. The evaluation is ready to proceed to the next approval stage.\"}','::1','2026-10-22 19:28:52'),(271,3,'evaluation_approved','evaluation',5,'{\"stage\": \"department_head\", \"comment\": \"Reviewed the submitted student evaluation. The evaluation is ready to proceed to the next approval stage.\"}','::1','2026-10-22 19:29:02'),(272,3,'evaluation_approved','evaluation',7,'{\"stage\": \"department_head\", \"comment\": \"Reviewed the submitted student evaluation. The evaluation is ready to proceed to the next approval stage.\"}','::1','2026-10-22 19:29:08'),(273,3,'evaluation_approved','evaluation',8,'{\"stage\": \"department_head\", \"comment\": \"Reviewed the submitted student evaluation. The evaluation is ready to proceed to the next approval stage.\"}','::1','2026-10-22 19:29:16'),(274,1,'auth.login','user',1,'{}',NULL,'2026-10-22 19:31:42'),(275,1,'user.created','user',9,'{\"role\": \"dean\"}','::1','2026-10-22 19:33:05'),(276,9,'auth.login','user',9,'{}',NULL,'2026-10-22 19:34:48'),(277,1,'auth.login','user',1,'{}',NULL,'2026-10-22 19:35:38'),(278,1,'user.created','user',10,'{\"role\": \"management\"}','::1','2026-10-22 19:36:34'),(279,10,'auth.login','user',10,'{}',NULL,'2026-10-22 20:09:02'),(280,9,'auth.login','user',9,'{}',NULL,'2026-10-22 20:09:35'),(281,9,'auth.login','user',9,'{}',NULL,'2026-10-22 20:10:49'),(282,1,'auth.login','user',1,'{}',NULL,'2026-10-22 20:10:58'),(283,9,'auth.login','user',9,'{}',NULL,'2026-10-22 20:15:38'),(284,3,'auth.login','user',3,'{}',NULL,'2026-10-22 20:15:59'),(285,6,'auth.login','user',6,'{}',NULL,'2026-10-22 20:16:18'),(286,9,'auth.login','user',9,'{}',NULL,'2026-10-22 20:22:10'),(287,9,'evaluation_approved','evaluation',3,'{\"stage\": \"dean\", \"comment\": \"that is goog\"}','::1','2026-10-22 20:23:39'),(288,9,'evaluation_approved','evaluation',4,'{\"stage\": \"dean\", \"comment\": \"good\"}','::1','2026-10-22 20:30:03'),(289,9,'evaluation_approved','evaluation',5,'{\"stage\": \"dean\", \"comment\": \"good\"}','::1','2026-10-22 20:30:12'),(290,9,'evaluation_approved','evaluation',7,'{\"stage\": \"dean\", \"comment\": \"good\"}','::1','2026-10-22 20:30:20'),(291,9,'evaluation_approved','evaluation',8,'{\"stage\": \"dean\", \"comment\": \"good\"}','::1','2026-10-22 20:30:26'),(292,5,'auth.login','user',5,'{}',NULL,'2026-10-22 20:30:51'),(293,10,'auth.login','user',10,'{}',NULL,'2026-10-22 20:31:36'),(294,10,'evaluation_approved','evaluation',1,'{\"stage\": \"management\", \"comment\": \"good\"}','::1','2026-10-22 20:31:55'),(295,10,'evaluation_approved','evaluation',3,'{\"stage\": \"management\", \"comment\": \"good\"}','::1','2026-10-22 20:32:00'),(296,10,'evaluation_approved','evaluation',4,'{\"stage\": \"management\", \"comment\": \"good\"}','::1','2026-10-22 20:32:07'),(297,10,'evaluation_approved','evaluation',5,'{\"stage\": \"management\", \"comment\": \"good\"}','::1','2026-10-22 20:32:12'),(298,10,'evaluation_approved','evaluation',7,'{\"stage\": \"management\", \"comment\": \"good\"}','::1','2026-10-22 20:32:18'),(299,10,'evaluation_approved','evaluation',8,'{\"stage\": \"management\", \"comment\": \"good\"}','::1','2026-10-22 20:32:25'),(300,1,'auth.login','user',1,'{}',NULL,'2026-10-22 20:34:51'),(301,7,'auth.login','user',7,'{}',NULL,'2026-10-22 20:39:53'),(302,7,'auth.login','user',7,'{}',NULL,'2026-10-22 20:49:57'),(303,7,'auth.login','user',7,'{}',NULL,'2026-10-22 20:54:01'),(304,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 23, \"assignmentId\": 23}','::1','2026-10-22 21:01:31'),(305,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 24, \"assignmentId\": 23}','::1','2026-10-22 21:01:33'),(306,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 26, \"assignmentId\": 23}','::1','2026-10-22 21:01:36'),(307,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 28, \"assignmentId\": 23}','::1','2026-10-22 21:01:39'),(308,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 30, \"assignmentId\": 23}','::1','2026-10-22 21:01:42'),(309,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 32, \"assignmentId\": 23}','::1','2026-10-22 21:01:45'),(310,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 34, \"assignmentId\": 23}','::1','2026-10-22 21:01:48'),(311,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 35, \"assignmentId\": 23}','::1','2026-10-22 21:01:50'),(312,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 37, \"assignmentId\": 23}','::1','2026-10-22 21:01:52'),(313,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 39, \"assignmentId\": 23}','::1','2026-10-22 21:01:55'),(314,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 41, \"assignmentId\": 23}','::1','2026-10-22 21:01:58'),(315,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 42, \"assignmentId\": 23}','::1','2026-10-22 21:02:00'),(316,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 45, \"assignmentId\": 23}','::1','2026-10-22 21:02:04'),(317,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 47, \"assignmentId\": 23}','::1','2026-10-22 21:02:06'),(318,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 49, \"assignmentId\": 23}','::1','2026-10-22 21:02:09'),(319,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 51, \"assignmentId\": 23}','::1','2026-10-22 21:02:12'),(320,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 52, \"assignmentId\": 23}','::1','2026-10-22 21:02:14'),(321,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 54, \"assignmentId\": 23}','::1','2026-10-22 21:02:17'),(322,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 55, \"assignmentId\": 23}','::1','2026-10-22 21:02:19'),(323,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 57, \"assignmentId\": 23}','::1','2026-10-22 21:02:25'),(324,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 59, \"assignmentId\": 23}','::1','2026-10-22 21:02:28'),(325,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 61, \"assignmentId\": 23}','::1','2026-10-22 21:02:31'),(326,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 62, \"assignmentId\": 23}','::1','2026-10-22 21:02:33'),(327,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 62, \"assignmentId\": 23}','::1','2026-10-22 21:02:36'),(328,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 62, \"assignmentId\": 23}','::1','2026-10-22 21:02:38'),(329,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 62, \"assignmentId\": 23}','::1','2026-10-22 21:02:43'),(330,7,'evaluation_saved_draft','evaluation',6,'{\"scoreCount\": 62, \"assignmentId\": 23}','::1','2026-10-22 21:02:57'),(331,7,'evaluation_submitted','evaluation',6,'{\"average\": 1.629, \"assignmentId\": 23, \"weightedScore\": 3.258}','::1','2026-10-22 21:02:57'),(332,5,'auth.login','user',5,'{}',NULL,'2026-10-22 21:03:30'),(333,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 2, \"assignmentId\": 22}','::1','2026-10-22 21:03:54'),(334,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 4, \"assignmentId\": 22}','::1','2026-10-22 21:03:57'),(335,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 6, \"assignmentId\": 22}','::1','2026-10-22 21:04:01'),(336,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 9, \"assignmentId\": 22}','::1','2026-10-22 21:04:05'),(337,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 11, \"assignmentId\": 22}','::1','2026-10-22 21:04:08'),(338,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 14, \"assignmentId\": 22}','::1','2026-10-22 21:04:12'),(339,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 16, \"assignmentId\": 22}','::1','2026-10-22 21:04:15'),(340,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 18, \"assignmentId\": 22}','::1','2026-10-22 21:04:18'),(341,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 20, \"assignmentId\": 22}','::1','2026-10-22 21:04:21'),(342,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 22, \"assignmentId\": 22}','::1','2026-10-22 21:04:24'),(343,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 24, \"assignmentId\": 22}','::1','2026-10-22 21:04:27'),(344,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 26, \"assignmentId\": 22}','::1','2026-10-22 21:04:30'),(345,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 26, \"assignmentId\": 22}','::1','2026-10-22 21:04:36'),(346,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 26, \"assignmentId\": 22}','::1','2026-10-22 21:04:40'),(347,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 26, \"assignmentId\": 22}','::1','2026-10-22 21:04:42'),(348,5,'evaluation_saved_draft','evaluation',9,'{\"scoreCount\": 26, \"assignmentId\": 22}','::1','2026-10-22 21:04:49'),(349,5,'evaluation_submitted','evaluation',9,'{\"average\": 2.154, \"assignmentId\": 22, \"weightedScore\": 6.462}','::1','2026-10-22 21:04:49'),(350,3,'auth.login','user',3,'{}',NULL,'2026-10-22 21:05:05'),(351,6,'auth.login','user',6,'{}',NULL,'2026-10-22 21:05:53'),(352,6,'evaluation_approved','evaluation',6,'{\"stage\": \"committee\", \"comment\": \"good\"}','::1','2026-10-22 21:06:32'),(353,6,'evaluation_approved','evaluation',9,'{\"stage\": \"committee\", \"comment\": \"good\"}','::1','2026-10-22 21:06:43'),(354,10,'auth.login','user',10,'{}',NULL,'2026-10-22 21:07:26'),(355,1,'auth.login','user',1,'{}',NULL,'2026-10-22 21:11:00'),(356,1,'auth.login','user',1,'{}',NULL,'2026-10-22 21:15:29'),(357,1,'task.deleted','evaluation_assignment',21,'{}','::1','2026-10-22 21:16:18'),(358,6,'auth.login','user',6,'{}',NULL,'2026-10-22 21:16:43'),(359,6,'auth.login','user',6,'{}',NULL,'2026-10-22 21:17:06'),(360,1,'auth.login','user',1,'{}',NULL,'2026-10-22 21:17:15'),(361,1,'task.deleted','evaluation_assignment',18,'{}','::1','2026-10-22 21:17:41'),(362,1,'evaluation_approved','evaluation',6,'{\"stage\": \"department_head\", \"comment\": \"good\"}','::1','2026-10-22 21:19:24'),(363,1,'evaluation_approved','evaluation',9,'{\"stage\": \"department_head\", \"comment\": \"goodss\"}','::1','2026-10-22 21:19:36'),(364,1,'evaluation_approved','evaluation',6,'{\"stage\": \"dean\", \"comment\": \"good\"}','::1','2026-10-22 21:19:43'),(365,9,'auth.login','user',9,'{}',NULL,'2026-10-22 21:20:02'),(366,9,'evaluation_approved','evaluation',9,'{\"stage\": \"dean\", \"comment\": \"good\"}','::1','2026-10-22 21:24:03'),(367,10,'auth.login','user',10,'{}',NULL,'2026-10-22 21:24:37'),(368,10,'evaluation_approved','evaluation',6,'{\"stage\": \"management\", \"comment\": \"good\"}','::1','2026-10-22 21:24:51'),(369,10,'evaluation_approved','evaluation',9,'{\"stage\": \"management\", \"comment\": \"good\"}','::1','2026-10-22 21:25:01'),(370,7,'auth.login','user',7,'{}',NULL,'2026-10-22 21:30:36'),(371,7,'auth.login','user',7,'{}',NULL,'2026-10-22 21:55:37'),(372,7,'auth.login','user',7,'{}',NULL,'2026-10-22 22:19:22'),(373,1,'auth.login','user',1,'{}',NULL,'2026-10-23 16:36:52'),(374,1,'auth.login','user',1,'{}',NULL,'2026-10-24 07:30:53'),(375,7,'auth.login','user',7,'{}',NULL,'2026-10-24 07:31:21'),(376,1,'auth.login','user',1,'{}',NULL,'2026-10-24 07:44:00'),(377,1,'cycle.created','evaluation_cycle',12,'{\"title\": \"Academic Staff Evaluation 2025\", \"endDate\": \"2026-10-31\", \"startDate\": \"2026-10-24\", \"academicYear\": \"2026\"}','::1','2026-10-24 07:46:43'),(378,1,'tasks.created','evaluation_cycle',12,'{\"created\": 5, \"skipped\": 0, \"courseCode\": \"100\", \"instructorId\": 7}','::1','2026-10-24 07:47:58'),(379,1,'cycle.status_changed','evaluation_cycle',11,'{\"newStatus\": \"closed\", \"previousStatus\": \"active\"}','::1','2026-10-24 07:48:32'),(380,1,'cycle.status_changed','evaluation_cycle',12,'{\"newStatus\": \"active\", \"previousStatus\": \"upcoming\"}','::1','2026-10-24 07:48:40'),(381,8,'auth.login','user',8,'{}',NULL,'2026-10-24 07:49:12'),(382,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 1, \"assignmentId\": 27}','::1','2026-10-24 07:49:31'),(383,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 3, \"assignmentId\": 27}','::1','2026-10-24 07:49:39'),(384,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 5, \"assignmentId\": 27}','::1','2026-10-24 07:49:41'),(385,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 7, \"assignmentId\": 27}','::1','2026-10-24 07:49:44'),(386,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 10, \"assignmentId\": 27}','::1','2026-10-24 07:49:47'),(387,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 13, \"assignmentId\": 27}','::1','2026-10-24 07:49:51'),(388,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 15, \"assignmentId\": 27}','::1','2026-10-24 07:49:54'),(389,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 17, \"assignmentId\": 27}','::1','2026-10-24 07:49:58'),(390,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 21, \"assignmentId\": 27}','::1','2026-10-24 07:50:03'),(391,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 23, \"assignmentId\": 27}','::1','2026-10-24 07:50:06'),(392,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 25, \"assignmentId\": 27}','::1','2026-10-24 07:50:08'),(393,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 27, \"assignmentId\": 27}','::1','2026-10-24 07:50:11'),(394,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 30, \"assignmentId\": 27}','::1','2026-10-24 07:50:15'),(395,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 30, \"assignmentId\": 27}','::1','2026-10-24 07:50:20'),(396,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 30, \"assignmentId\": 27}','::1','2026-10-24 07:50:29'),(397,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 30, \"assignmentId\": 27}','::1','2026-10-24 07:50:32'),(398,8,'evaluation_saved_draft','evaluation',10,'{\"scoreCount\": 30, \"assignmentId\": 27}','::1','2026-10-24 07:50:37'),(399,8,'evaluation_submitted','evaluation',10,'{\"average\": 2.767, \"assignmentId\": 27, \"weightedScore\": 22.133}','::1','2026-10-24 07:50:37'),(400,5,'auth.login','user',5,'{}',NULL,'2026-10-24 07:50:52'),(401,1,'auth.login','user',1,'{}',NULL,'2026-10-24 07:52:12'),(402,1,'tasks.created','evaluation_cycle',12,'{\"created\": 1, \"skipped\": 1, \"courseCode\": \"100\", \"instructorId\": 7}','::1','2026-10-24 07:52:54'),(403,5,'auth.login','user',5,'{}',NULL,'2026-10-24 07:53:05'),(404,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 1, \"assignmentId\": 31}','::1','2026-10-24 07:53:23'),(405,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 2, \"assignmentId\": 31}','::1','2026-10-24 07:53:26'),(406,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 3, \"assignmentId\": 31}','::1','2026-10-24 07:53:28'),(407,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 4, \"assignmentId\": 31}','::1','2026-10-24 07:53:30'),(408,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 5, \"assignmentId\": 31}','::1','2026-10-24 07:53:34'),(409,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 6, \"assignmentId\": 31}','::1','2026-10-24 07:53:35'),(410,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 7, \"assignmentId\": 31}','::1','2026-10-24 07:53:37'),(411,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 9, \"assignmentId\": 31}','::1','2026-10-24 07:53:41'),(412,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 10, \"assignmentId\": 31}','::1','2026-10-24 07:53:44'),(413,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 11, \"assignmentId\": 31}','::1','2026-10-24 07:53:48'),(414,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 13, \"assignmentId\": 31}','::1','2026-10-24 07:53:52'),(415,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 16, \"assignmentId\": 31}','::1','2026-10-24 07:53:57'),(416,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 19, \"assignmentId\": 31}','::1','2026-10-24 07:54:02'),(417,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 22, \"assignmentId\": 31}','::1','2026-10-24 07:54:07'),(418,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 24, \"assignmentId\": 31}','::1','2026-10-24 07:54:10'),(419,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 26, \"assignmentId\": 31}','::1','2026-10-24 07:54:14'),(420,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 26, \"assignmentId\": 31}','::1','2026-10-24 07:54:18'),(421,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 26, \"assignmentId\": 31}','::1','2026-10-24 07:54:21'),(422,5,'evaluation_saved_draft','evaluation',11,'{\"scoreCount\": 26, \"assignmentId\": 31}','::1','2026-10-24 07:54:25'),(423,5,'evaluation_submitted','evaluation',11,'{\"average\": 3.423, \"assignmentId\": 31, \"weightedScore\": 10.269}','::1','2026-10-24 07:54:26'),(424,7,'auth.login','user',7,'{}',NULL,'2026-10-24 07:54:39'),(425,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 1, \"assignmentId\": 30}','::1','2026-10-24 07:54:52'),(426,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 3, \"assignmentId\": 30}','::1','2026-10-24 07:54:55'),(427,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 7, \"assignmentId\": 30}','::1','2026-10-24 07:55:00'),(428,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 10, \"assignmentId\": 30}','::1','2026-10-24 07:55:04'),(429,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 13, \"assignmentId\": 30}','::1','2026-10-24 07:55:08'),(430,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 17, \"assignmentId\": 30}','::1','2026-10-24 07:55:13'),(431,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 20, \"assignmentId\": 30}','::1','2026-10-24 07:55:17'),(432,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 22, \"assignmentId\": 30}','::1','2026-10-24 07:55:20'),(433,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 26, \"assignmentId\": 30}','::1','2026-10-24 07:55:28'),(434,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 28, \"assignmentId\": 30}','::1','2026-10-24 07:55:32'),(435,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 31, \"assignmentId\": 30}','::1','2026-10-24 07:55:37'),(436,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 32, \"assignmentId\": 30}','::1','2026-10-24 07:55:40'),(437,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 33, \"assignmentId\": 30}','::1','2026-10-24 07:55:42'),(438,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 37, \"assignmentId\": 30}','::1','2026-10-24 07:55:48'),(439,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 39, \"assignmentId\": 30}','::1','2026-10-24 07:55:52'),(440,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 40, \"assignmentId\": 30}','::1','2026-10-24 07:55:53'),(441,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 41, \"assignmentId\": 30}','::1','2026-10-24 07:55:56'),(442,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 45, \"assignmentId\": 30}','::1','2026-10-24 07:56:03'),(443,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 47, \"assignmentId\": 30}','::1','2026-10-24 07:56:06'),(444,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 49, \"assignmentId\": 30}','::1','2026-10-24 07:56:10'),(445,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 51, \"assignmentId\": 30}','::1','2026-10-24 07:56:13'),(446,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 55, \"assignmentId\": 30}','::1','2026-10-24 07:56:19'),(447,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 57, \"assignmentId\": 30}','::1','2026-10-24 07:56:23'),(448,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 58, \"assignmentId\": 30}','::1','2026-10-24 07:56:24'),(449,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 61, \"assignmentId\": 30}','::1','2026-10-24 07:56:28'),(450,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 62, \"assignmentId\": 30}','::1','2026-10-24 07:56:31'),(451,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 62, \"assignmentId\": 30}','::1','2026-10-24 07:56:39'),(452,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 62, \"assignmentId\": 30}','::1','2026-10-24 07:56:53'),(453,7,'evaluation_saved_draft','evaluation',12,'{\"scoreCount\": 62, \"assignmentId\": 30}','::1','2026-10-24 07:56:56'),(454,7,'evaluation_submitted','evaluation',12,'{\"average\": 3.355, \"assignmentId\": 30, \"weightedScore\": 6.71}','::1','2026-10-24 07:56:56'),(455,1,'auth.login','user',1,'{}',NULL,'2026-10-24 07:57:07'),(456,3,'auth.login','user',3,'{}',NULL,'2026-10-24 08:00:52'),(457,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 1, \"assignmentId\": 28}','::1','2026-10-24 08:01:13'),(458,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 3, \"assignmentId\": 28}','::1','2026-10-24 08:01:22'),(459,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 4, \"assignmentId\": 28}','::1','2026-10-24 08:01:24'),(460,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 5, \"assignmentId\": 28}','::1','2026-10-24 08:01:26'),(461,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 6, \"assignmentId\": 28}','::1','2026-10-24 08:01:28'),(462,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 8, \"assignmentId\": 28}','::1','2026-10-24 08:01:33'),(463,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 10, \"assignmentId\": 28}','::1','2026-10-24 08:01:37'),(464,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 11, \"assignmentId\": 28}','::1','2026-10-24 08:01:39'),(465,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 13, \"assignmentId\": 28}','::1','2026-10-24 08:01:44'),(466,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 15, \"assignmentId\": 28}','::1','2026-10-24 08:01:47'),(467,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 16, \"assignmentId\": 28}','::1','2026-10-24 08:01:50'),(468,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 18, \"assignmentId\": 28}','::1','2026-10-24 08:01:52'),(469,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 22, \"assignmentId\": 28}','::1','2026-10-24 08:01:58'),(470,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 24, \"assignmentId\": 28}','::1','2026-10-24 08:02:00'),(471,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 26, \"assignmentId\": 28}','::1','2026-10-24 08:02:11'),(472,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 27, \"assignmentId\": 28}','::1','2026-10-24 08:02:13'),(473,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 27, \"assignmentId\": 28}','::1','2026-10-24 08:02:22'),(474,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 27, \"assignmentId\": 28}','::1','2026-10-24 08:02:28'),(475,3,'evaluation_saved_draft','evaluation',13,'{\"scoreCount\": 27, \"assignmentId\": 28}','::1','2026-10-24 08:02:31'),(476,3,'evaluation_submitted','evaluation',13,'{\"average\": 2.926, \"assignmentId\": 28, \"weightedScore\": 20.481}','::1','2026-10-24 08:02:31'),(477,6,'auth.login','user',6,'{}',NULL,'2026-10-24 08:03:01'),(478,6,'evaluation_approved','evaluation',10,'{\"stage\": \"committee\", \"comment\": \"ok\"}','::1','2026-10-24 08:04:09'),(479,6,'evaluation_approved','evaluation',11,'{\"stage\": \"committee\", \"comment\": \"ok\"}','::1','2026-10-24 08:04:18'),(480,6,'evaluation_approved','evaluation',12,'{\"stage\": \"committee\", \"comment\": \"ok\"}','::1','2026-10-24 08:04:24'),(481,6,'evaluation_approved','evaluation',13,'{\"stage\": \"committee\", \"comment\": \"ok\"}','::1','2026-10-24 08:04:31'),(482,9,'auth.login','user',9,'{}',NULL,'2026-10-24 08:04:48'),(483,10,'auth.login','user',10,'{}',NULL,'2026-10-24 08:06:11'),(484,7,'auth.login','user',7,'{}',NULL,'2026-10-24 08:06:53'),(485,10,'auth.login','user',10,'{}',NULL,'2026-10-24 08:14:32');
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
  `form_version_id` bigint unsigned NOT NULL,
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
  KEY `idx_assignments_version` (`form_version_id`),
  CONSTRAINT `fk_assign_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`),
  CONSTRAINT `fk_assign_evaluator` FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_assign_form` FOREIGN KEY (`form_id`) REFERENCES `evaluation_forms` (`id`),
  CONSTRAINT `fk_assign_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_assign_version` FOREIGN KEY (`form_version_id`) REFERENCES `form_versions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_assignments`
--

LOCK TABLES `evaluation_assignments` WRITE;
/*!40000 ALTER TABLE `evaluation_assignments` DISABLE KEYS */;
INSERT INTO `evaluation_assignments` VALUES (1,1,1,1,5,2,'java','100','II','II','submitted','2026-10-20 07:25:22','2026-10-22 09:30:38'),(2,1,2,2,5,3,'','',NULL,'I','submitted','2026-10-20 16:37:05','2026-10-22 11:47:37'),(3,1,2,2,4,3,'','',NULL,'I','submitted','2026-10-20 16:37:05','2026-10-22 09:30:38'),(5,1,4,4,4,4,'','',NULL,'I','pending','2026-10-20 16:37:05','2026-10-22 09:30:38'),(6,1,4,4,5,5,'','',NULL,'I','pending','2026-10-20 16:37:05','2026-10-22 09:30:38'),(8,7,1,1,7,2,'java','100','II','I','pending','2026-10-22 11:30:49','2026-10-22 11:30:49'),(9,7,1,1,7,8,'java','100','II','I','submitted','2026-10-22 11:30:49','2026-10-22 12:03:34'),(10,7,3,3,7,5,'java','100','II','I','pending','2026-10-22 11:30:49','2026-10-22 11:30:49'),(11,7,4,4,7,7,'java','100','II','I','submitted','2026-10-22 11:30:49','2026-10-22 12:15:00'),(12,6,1,1,4,2,'java','100','I','I','pending','2026-10-22 16:29:11','2026-10-22 16:29:11'),(13,6,1,1,4,8,'java','100','I','I','pending','2026-10-22 16:29:11','2026-10-22 16:29:11'),(14,6,2,2,4,3,'java','100','I','I','pending','2026-10-22 16:29:11','2026-10-22 16:29:11'),(15,6,3,3,4,5,'java','100','I','I','pending','2026-10-22 16:29:11','2026-10-22 16:29:11'),(16,6,3,3,4,7,'java','100','I','I','pending','2026-10-22 16:29:11','2026-10-22 16:29:11'),(17,6,4,4,4,4,'java','100','I','I','pending','2026-10-22 16:29:11','2026-10-22 16:29:11'),(19,11,1,1,7,8,'web','100','I','I','submitted','2026-10-22 17:21:39','2026-10-22 17:29:00'),(20,11,2,2,7,3,'web','100','I','I','submitted','2026-10-22 17:21:39','2026-10-22 19:09:00'),(22,11,3,3,7,5,'web','100','I','I','submitted','2026-10-22 17:21:39','2026-10-22 21:04:49'),(23,11,4,4,7,7,'web','100','I','I','submitted','2026-10-22 17:21:39','2026-10-22 21:02:57'),(24,6,2,2,7,3,'web','100','I','I','pending','2026-10-22 18:59:40','2026-10-22 18:59:40'),(25,6,4,4,7,7,'web','100','I','I','pending','2026-10-22 18:59:40','2026-10-22 18:59:40'),(26,12,1,1,7,2,'OS','100','I','II','pending','2026-10-24 07:47:58','2026-10-24 07:47:58'),(27,12,1,1,7,8,'OS','100','I','II','submitted','2026-10-24 07:47:58','2026-10-24 07:50:37'),(28,12,2,2,7,3,'OS','100','I','II','submitted','2026-10-24 07:47:58','2026-10-24 08:02:31'),(29,12,3,3,7,4,'OS','100','I','II','pending','2026-10-24 07:47:58','2026-10-24 07:47:58'),(30,12,4,4,7,7,'OS','100','I','II','submitted','2026-10-24 07:47:58','2026-10-24 07:56:56'),(31,12,3,3,7,5,'OS','100',NULL,NULL,'submitted','2026-10-24 07:52:54','2026-10-24 07:54:26');
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_cycles`
--

LOCK TABLES `evaluation_cycles` WRITE;
/*!40000 ALTER TABLE `evaluation_cycles` DISABLE KEYS */;
INSERT INTO `evaluation_cycles` VALUES (1,'hia','hia','2026-10-20','2026-10-20','closed','2026-10-20 06:00:04','2026-10-22 11:53:03'),(2,'html','2020','2026-10-20','2026-10-20','closed','2026-10-20 06:00:59','2026-10-22 17:14:23'),(3,'hia','2024','2026-10-21','2026-10-21','upcoming','2026-10-20 06:03:59','2026-10-20 06:03:59'),(4,'hkjjkhjkh','2024','2026-10-21','2026-10-30','upcoming','2026-10-20 19:01:08','2026-10-20 19:01:08'),(5,'ambo','2024','2026-10-22','2026-10-31','closed','2026-10-22 07:59:43','2026-10-22 16:22:36'),(6,'dom','2024','2026-10-23','2026-10-31','upcoming','2026-10-22 11:25:58','2026-10-22 16:19:16'),(7,'java','2024','2026-10-22','2026-11-07','closed','2026-10-22 11:29:38','2026-10-22 16:18:30'),(8,'javas','2024','2026-10-22','2026-10-31','closed','2026-10-22 11:37:31','2026-10-22 11:59:31'),(9,'dom','2025','2026-10-22','2026-10-30','closed','2026-10-22 16:22:25','2026-10-22 16:27:04'),(10,'active','2024','2026-10-22','2026-10-30','upcoming','2026-10-22 17:13:42','2026-10-22 17:13:42'),(11,'Academic Staff Evaluation 2026','2026','2026-10-22','2026-10-30','closed','2026-10-22 17:16:30','2026-10-24 07:48:32'),(12,'Academic Staff Evaluation 2025','2026','2026-10-24','2026-10-31','active','2026-10-24 07:46:43','2026-10-24 07:48:40');
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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_reviews`
--

LOCK TABLES `evaluation_reviews` WRITE;
/*!40000 ALTER TABLE `evaluation_reviews` DISABLE KEYS */;
INSERT INTO `evaluation_reviews` VALUES (1,3,1,'approved','goood','2026-10-22 12:19:48'),(2,2,1,'approved','good','2026-10-22 12:20:00'),(3,1,1,'approved','good','2026-10-22 12:20:06'),(4,2,1,'approved','good','2026-10-22 12:20:19'),(5,2,1,'approved','goood','2026-10-22 12:20:27'),(6,2,1,'approved','good','2026-10-22 12:20:34'),(7,3,1,'approved','goo','2026-10-22 12:20:42'),(8,1,1,'approved','jh','2026-10-22 16:29:33'),(9,1,1,'approved',NULL,'2026-10-22 16:29:50'),(10,4,6,'approved',NULL,'2026-10-22 19:21:29'),(11,5,6,'approved',NULL,'2026-10-22 19:21:42'),(12,7,6,'approved',NULL,'2026-10-22 19:21:46'),(13,8,6,'approved',NULL,'2026-10-22 19:21:49'),(14,4,3,'approved','Reviewed the submitted student evaluation. The evaluation is ready to proceed to the next approval stage.','2026-10-22 19:28:52'),(15,5,3,'approved','Reviewed the submitted student evaluation. The evaluation is ready to proceed to the next approval stage.','2026-10-22 19:29:02'),(16,7,3,'approved','Reviewed the submitted student evaluation. The evaluation is ready to proceed to the next approval stage.','2026-10-22 19:29:08'),(17,8,3,'approved','Reviewed the submitted student evaluation. The evaluation is ready to proceed to the next approval stage.','2026-10-22 19:29:16'),(18,3,9,'approved','that is goog','2026-10-22 20:23:39'),(19,4,9,'approved','good','2026-10-22 20:30:03'),(20,5,9,'approved','good','2026-10-22 20:30:12'),(21,7,9,'approved','good','2026-10-22 20:30:20'),(22,8,9,'approved','good','2026-10-22 20:30:26'),(23,1,10,'approved','good','2026-10-22 20:31:55'),(24,3,10,'approved','good','2026-10-22 20:32:00'),(25,4,10,'approved','good','2026-10-22 20:32:07'),(26,5,10,'approved','good','2026-10-22 20:32:12'),(27,7,10,'approved','good','2026-10-22 20:32:18'),(28,8,10,'approved','good','2026-10-22 20:32:25'),(29,6,6,'approved','good','2026-10-22 21:06:32'),(30,9,6,'approved','good','2026-10-22 21:06:43'),(31,6,1,'approved','good','2026-10-22 21:19:24'),(32,9,1,'approved','goodss','2026-10-22 21:19:36'),(33,6,1,'approved','good','2026-10-22 21:19:43'),(34,9,9,'approved','good','2026-10-22 21:24:03'),(35,6,10,'approved','good','2026-10-22 21:24:51'),(36,9,10,'approved','good','2026-10-22 21:25:01'),(37,10,6,'approved','ok','2026-10-24 08:04:09'),(38,11,6,'approved','ok','2026-10-24 08:04:18'),(39,12,6,'approved','ok','2026-10-24 08:04:24'),(40,13,6,'approved','ok','2026-10-24 08:04:31');
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
) ENGINE=InnoDB AUTO_INCREMENT=6158 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_scores`
--

LOCK TABLES `evaluation_scores` WRITE;
/*!40000 ALTER TABLE `evaluation_scores` DISABLE KEYS */;
INSERT INTO `evaluation_scores` VALUES (1,1,31,5,0),(2,1,32,4,0),(3,1,33,5,0),(4,1,34,5,0),(5,1,35,5,0),(6,1,36,5,0),(7,1,37,5,0),(8,1,38,5,0),(9,1,39,5,0),(10,1,40,5,0),(11,1,41,5,0),(12,1,42,5,0),(13,1,43,5,0),(14,1,44,5,0),(15,1,45,5,0),(16,1,46,5,0),(17,1,47,5,0),(18,1,48,5,0),(19,1,49,5,0),(20,1,50,4,0),(21,1,51,3,0),(22,1,52,2,0),(23,1,53,3,0),(24,1,54,4,0),(25,1,55,5,0),(26,1,56,4,0),(27,1,57,4,0),(28,2,1,5,0),(29,2,2,5,0),(30,2,3,5,0),(31,2,4,5,0),(32,2,5,5,0),(33,2,6,4,0),(34,2,7,3,0),(35,2,8,3,0),(36,2,9,4,0),(37,2,10,5,0),(38,2,11,4,0),(39,2,12,4,0),(40,2,13,5,0),(41,2,14,4,0),(42,2,15,5,0),(43,2,16,5,0),(44,2,17,4,0),(45,2,18,4,0),(46,2,19,4,0),(47,2,20,4,0),(48,2,21,4,0),(49,2,22,4,0),(50,2,23,4,0),(51,2,24,4,0),(52,2,25,4,0),(53,2,26,4,0),(54,2,27,4,0),(55,2,28,4,0),(56,2,29,4,0),(57,2,30,4,0),(310,3,31,1,0),(311,3,32,1,0),(312,3,33,1,0),(313,3,34,0,0),(314,3,35,0,0),(315,3,36,0,0),(316,3,37,0,0),(317,3,38,0,0),(318,3,39,0,0),(319,3,40,0,0),(320,3,41,0,0),(321,3,42,1,0),(322,3,43,1,0),(323,3,44,1,0),(324,3,45,1,0),(325,3,46,1,0),(326,3,47,1,0),(327,3,48,2,0),(328,3,49,0,0),(329,3,50,1,0),(330,3,51,2,0),(331,3,52,3,0),(332,3,53,2,0),(333,3,54,1,0),(334,3,55,1,0),(335,3,56,2,0),(336,3,57,2,0),(691,4,1,0,0),(692,4,2,1,0),(693,4,3,1,0),(694,4,4,2,0),(695,4,5,2,0),(696,4,6,0,0),(697,4,7,2,0),(698,4,8,2,0),(699,4,9,2,0),(700,4,10,2,0),(701,4,11,2,0),(702,4,12,2,0),(703,4,13,2,0),(704,4,14,2,0),(705,4,15,2,0),(706,4,16,1,0),(707,4,17,2,0),(708,4,18,2,0),(709,4,19,2,0),(710,4,20,2,0),(711,4,21,2,0),(712,4,22,2,0),(713,4,23,2,0),(714,4,24,3,0),(715,4,25,3,0),(716,4,26,2,0),(717,4,27,2,0),(718,4,28,3,0),(719,4,29,2,0),(720,4,30,2,0),(1841,5,84,0,0),(1842,5,85,1,0),(1843,5,86,2,0),(1844,5,87,2,0),(1845,5,88,2,0),(1846,5,89,2,0),(1847,5,90,2,0),(1848,5,91,2,0),(1849,5,92,2,0),(1850,5,93,3,0),(1851,5,94,5,0),(1852,5,95,5,0),(1853,5,96,5,0),(1854,5,97,5,0),(1855,5,98,5,0),(1856,5,99,5,0),(1857,5,100,5,0),(1858,5,101,3,0),(1859,5,102,2,0),(1860,5,103,2,0),(1861,5,104,1,0),(1862,5,105,1,0),(1863,5,106,1,0),(1864,5,107,1,0),(1865,5,108,2,0),(1866,5,109,2,0),(1867,5,110,2,0),(1868,5,111,2,0),(1869,5,112,3,0),(1870,5,113,3,0),(1871,5,114,2,0),(1872,5,115,2,0),(1873,5,116,2,0),(1874,5,117,2,0),(1875,5,118,3,0),(1876,5,119,4,0),(1877,5,120,5,0),(1878,5,121,4,0),(1879,5,122,3,0),(1880,5,123,2,0),(1881,5,124,1,0),(1882,5,125,0,0),(1883,5,126,0,0),(1884,5,127,0,0),(1885,5,128,0,0),(1886,5,129,0,0),(1887,5,130,2,0),(1888,5,131,3,0),(1889,5,132,4,0),(1890,5,133,3,0),(1891,5,134,3,0),(1892,5,135,1,0),(1893,5,136,1,0),(1894,5,137,2,0),(1895,5,138,2,0),(1896,5,139,2,0),(1897,5,140,2,0),(1898,5,141,4,0),(1899,5,142,4,0),(1900,5,143,4,0),(1901,5,144,4,0),(1902,5,145,3,0),(2275,7,1,0,0),(2276,7,2,1,0),(2277,7,3,2,0),(2278,7,4,3,0),(2279,7,5,4,0),(2280,7,6,5,0),(2281,7,7,4,0),(2282,7,8,3,0),(2283,7,9,2,0),(2284,7,10,1,0),(2285,7,11,1,0),(2286,7,12,2,0),(2287,7,13,2,0),(2288,7,14,2,0),(2289,7,15,2,0),(2290,7,16,1,0),(2291,7,17,2,0),(2292,7,18,3,0),(2293,7,19,3,0),(2294,7,20,2,0),(2295,7,21,2,0),(2296,7,22,2,0),(2297,7,23,2,0),(2298,7,24,2,0),(2299,7,25,2,0),(2300,7,26,2,0),(2301,7,27,3,0),(2302,7,28,3,0),(2303,7,29,3,0),(2304,7,30,2,0),(2690,8,31,0,0),(2691,8,32,1,0),(2692,8,33,1,0),(2693,8,34,1,0),(2694,8,35,1,0),(2695,8,36,1,0),(2696,8,37,1,0),(2697,8,38,1,0),(2698,8,39,2,0),(2699,8,40,2,0),(2700,8,41,1,0),(2701,8,42,1,0),(2702,8,43,1,0),(2703,8,44,2,0),(2704,8,45,2,0),(2705,8,46,2,0),(2706,8,47,2,0),(2707,8,48,1,0),(2708,8,49,2,0),(2709,8,50,1,0),(2710,8,51,1,0),(2711,8,52,2,0),(2712,8,53,1,0),(2713,8,54,1,0),(2714,8,55,1,0),(2715,8,56,2,0),(2716,8,57,3,0),(3886,6,84,0,0),(3887,6,85,1,0),(3888,6,86,2,0),(3889,6,87,3,0),(3890,6,88,4,0),(3891,6,89,4,0),(3892,6,90,3,0),(3893,6,91,2,0),(3894,6,92,2,0),(3895,6,93,2,0),(3896,6,94,2,0),(3897,6,95,2,0),(3898,6,96,2,0),(3899,6,97,2,0),(3900,6,98,2,0),(3901,6,99,2,0),(3902,6,100,2,0),(3903,6,101,2,0),(3904,6,102,2,0),(3905,6,103,2,0),(3906,6,104,1,0),(3907,6,105,0,0),(3908,6,106,0,0),(3909,6,107,0,0),(3910,6,108,1,0),(3911,6,109,2,0),(3912,6,110,2,0),(3913,6,111,2,0),(3914,6,112,2,0),(3915,6,113,2,0),(3916,6,114,1,0),(3917,6,115,1,0),(3918,6,116,2,0),(3919,6,117,1,0),(3920,6,118,2,0),(3921,6,119,2,0),(3922,6,120,1,0),(3923,6,121,1,0),(3924,6,122,2,0),(3925,6,123,1,0),(3926,6,124,1,0),(3927,6,125,1,0),(3928,6,126,2,0),(3929,6,127,1,0),(3930,6,128,1,0),(3931,6,129,2,0),(3932,6,130,1,0),(3933,6,131,1,0),(3934,6,132,1,0),(3935,6,133,1,0),(3936,6,134,2,0),(3937,6,135,1,0),(3938,6,136,2,0),(3939,6,137,2,0),(3940,6,138,2,0),(3941,6,139,1,0),(3942,6,140,1,0),(3943,6,141,2,0),(3944,6,142,2,0),(3945,6,143,2,0),(3946,6,144,2,0),(3947,6,145,1,0),(4198,9,58,0,0),(4199,9,59,1,0),(4200,9,60,2,0),(4201,9,61,2,0),(4202,9,62,1,0),(4203,9,63,2,0),(4204,9,64,2,0),(4205,9,65,3,0),(4206,9,66,4,0),(4207,9,67,3,0),(4208,9,68,2,0),(4209,9,69,2,0),(4210,9,70,2,0),(4211,9,71,1,0),(4212,9,72,2,0),(4213,9,73,2,0),(4214,9,74,2,0),(4215,9,75,3,0),(4216,9,76,3,0),(4217,9,77,2,0),(4218,9,78,2,0),(4219,9,79,3,0),(4220,9,80,3,0),(4221,9,81,2,0),(4222,9,82,2,0),(4223,9,83,3,0),(4511,10,1,0,0),(4512,10,2,1,0),(4513,10,3,2,0),(4514,10,4,3,0),(4515,10,5,2,0),(4516,10,6,2,0),(4517,10,7,2,0),(4518,10,8,2,0),(4519,10,9,2,0),(4520,10,10,1,0),(4521,10,11,5,0),(4522,10,12,5,0),(4523,10,13,5,0),(4524,10,14,5,0),(4525,10,15,5,0),(4526,10,16,3,0),(4527,10,17,4,0),(4528,10,18,4,0),(4529,10,19,3,0),(4530,10,20,3,0),(4531,10,21,3,0),(4532,10,22,3,0),(4533,10,23,2,0),(4534,10,24,1,0),(4535,10,25,2,0),(4536,10,26,2,0),(4537,10,27,3,0),(4538,10,28,3,0),(4539,10,29,2,0),(4540,10,30,3,0),(4771,11,58,5,0),(4772,11,59,5,0),(4773,11,60,5,0),(4774,11,61,5,0),(4775,11,62,4,0),(4776,11,63,4,0),(4777,11,64,4,0),(4778,11,65,4,0),(4779,11,66,4,0),(4780,11,67,4,0),(4781,11,68,4,0),(4782,11,69,4,0),(4783,11,70,4,0),(4784,11,71,4,0),(4785,11,72,3,0),(4786,11,73,2,0),(4787,11,74,2,0),(4788,11,75,2,0),(4789,11,76,3,0),(4790,11,77,3,0),(4791,11,78,2,0),(4792,11,79,3,0),(4793,11,80,3,0),(4794,11,81,2,0),(4795,11,82,2,0),(4796,11,83,2,0),(5806,12,84,0,0),(5807,12,85,5,0),(5808,12,86,5,0),(5809,12,87,5,0),(5810,12,88,5,0),(5811,12,89,4,0),(5812,12,90,3,0),(5813,12,91,3,0),(5814,12,92,3,0),(5815,12,93,3,0),(5816,12,94,3,0),(5817,12,95,3,0),(5818,12,96,3,0),(5819,12,97,3,0),(5820,12,98,4,0),(5821,12,99,3,0),(5822,12,100,2,0),(5823,12,101,2,0),(5824,12,102,2,0),(5825,12,103,2,0),(5826,12,104,2,0),(5827,12,105,3,0),(5828,12,106,4,0),(5829,12,107,3,0),(5830,12,108,2,0),(5831,12,109,2,0),(5832,12,110,2,0),(5833,12,111,2,0),(5834,12,112,2,0),(5835,12,113,3,0),(5836,12,114,3,0),(5837,12,115,3,0),(5838,12,116,3,0),(5839,12,117,3,0),(5840,12,118,2,0),(5841,12,119,3,0),(5842,12,120,2,0),(5843,12,121,3,0),(5844,12,122,2,0),(5845,12,123,3,0),(5846,12,124,4,0),(5847,12,125,5,0),(5848,12,126,5,0),(5849,12,127,5,0),(5850,12,128,5,0),(5851,12,129,5,0),(5852,12,130,4,0),(5853,12,131,4,0),(5854,12,132,4,0),(5855,12,133,4,0),(5856,12,134,4,0),(5857,12,135,4,0),(5858,12,136,3,0),(5859,12,137,3,0),(5860,12,138,3,0),(5861,12,139,5,0),(5862,12,140,5,0),(5863,12,141,5,0),(5864,12,142,4,0),(5865,12,143,4,0),(5866,12,144,4,0),(5867,12,145,4,0),(6131,13,31,3,0),(6132,13,32,4,0),(6133,13,33,4,0),(6134,13,34,4,0),(6135,13,35,3,0),(6136,13,36,2,0),(6137,13,37,2,0),(6138,13,38,2,0),(6139,13,39,3,0),(6140,13,40,4,0),(6141,13,41,3,0),(6142,13,42,2,0),(6143,13,43,3,0),(6144,13,44,3,0),(6145,13,45,3,0),(6146,13,46,3,0),(6147,13,47,3,0),(6148,13,48,3,0),(6149,13,49,3,0),(6150,13,50,2,0),(6151,13,51,3,0),(6152,13,52,3,0),(6153,13,53,3,0),(6154,13,54,2,0),(6155,13,55,3,0),(6156,13,56,3,0),(6157,13,57,3,0);
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_summaries`
--

LOCK TABLES `evaluation_summaries` WRITE;
/*!40000 ALTER TABLE `evaluation_summaries` DISABLE KEYS */;
INSERT INTO `evaluation_summaries` VALUES (1,1,5,4.175,33.400,0.926,6.482,NULL,0.000,NULL,0.000,0.000,'incomplete',NULL,NULL,NULL,NULL,'2026-10-21 05:25:39','2026-10-22 11:47:37'),(2,1,4,NULL,0.000,4.352,30.464,NULL,0.000,NULL,0.000,30.464,'incomplete',NULL,NULL,NULL,NULL,'2026-10-21 05:25:39','2026-10-21 05:25:39'),(4,7,7,1.867,14.936,NULL,0.000,NULL,0.000,2.452,4.904,0.000,'incomplete',NULL,NULL,NULL,NULL,'2026-10-22 12:03:34','2026-10-22 12:15:00'),(6,11,7,2.267,18.136,1.370,9.590,2.154,6.462,1.629,3.258,37.446,'reviewed',NULL,NULL,10,'2026-10-23 00:25:01','2026-10-22 17:29:00','2026-10-22 21:25:01'),(10,12,7,2.767,22.136,2.926,20.482,3.423,10.269,3.355,6.710,59.597,'complete',NULL,NULL,NULL,NULL,'2026-10-24 07:50:37','2026-10-24 08:02:31');
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluations`
--

LOCK TABLES `evaluations` WRITE;
/*!40000 ALTER TABLE `evaluations` DISABLE KEYS */;
INSERT INTO `evaluations` VALUES (1,3,'approved',NULL,NULL,4.352,30.466,'2026-10-20 19:41:47','2026-10-20 16:41:47','2026-10-22 20:31:55'),(2,1,'approved','nn,m','lnll',4.175,33.400,'2026-10-20 22:06:42','2026-10-20 19:06:42','2026-10-22 12:20:34'),(3,2,'approved','good','good',0.926,6.481,'2026-10-22 14:47:37','2026-10-22 11:45:40','2026-10-22 20:32:00'),(4,9,'approved','good','idea sharing',1.867,14.933,'2026-10-22 15:03:34','2026-10-22 12:01:51','2026-10-22 20:32:07'),(5,11,'approved','goof','hoo',2.452,4.903,'2026-10-22 15:15:00','2026-10-22 12:13:07','2026-10-22 20:32:12'),(6,23,'approved','goood','amazing',1.629,3.258,'2026-10-23 00:02:57','2026-10-22 17:26:18','2026-10-22 21:24:51'),(7,19,'approved','a good teacher keep it up','pls can you improve you behavior as much as possible?',2.267,18.133,'2026-10-22 20:29:00','2026-10-22 17:27:21','2026-10-22 20:32:18'),(8,20,'approved','goood','improve your BA',1.370,9.593,'2026-10-22 22:09:00','2026-10-22 19:07:27','2026-10-22 20:32:25'),(9,22,'approved','good','good',2.154,6.462,'2026-10-23 00:04:49','2026-10-22 21:03:54','2026-10-22 21:25:01'),(10,27,'submitted','good ','improve your BEH',2.767,22.133,'2026-10-24 10:50:37','2026-10-24 07:49:31','2026-10-24 07:50:37'),(11,31,'submitted','good','bad',3.423,10.269,'2026-10-24 10:54:26','2026-10-24 07:53:23','2026-10-24 07:54:26'),(12,30,'submitted','very good ','Performing Non-instructional Duties',3.355,6.710,'2026-10-24 10:56:56','2026-10-24 07:54:52','2026-10-24 07:56:56'),(13,28,'submitted','good','Ethical Competence',2.926,20.481,'2026-10-24 11:02:31','2026-10-24 08:01:13','2026-10-24 08:02:31');
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
  `form_version_id` bigint unsigned NOT NULL,
  `section_key` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sections_version_key` (`form_version_id`,`section_key`),
  KEY `idx_sections_form` (`form_id`),
  CONSTRAINT `fk_sections_form` FOREIGN KEY (`form_id`) REFERENCES `evaluation_forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sections_version` FOREIGN KEY (`form_version_id`) REFERENCES `form_versions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_sections`
--

LOCK TABLES `form_sections` WRITE;
/*!40000 ALTER TABLE `form_sections` DISABLE KEYS */;
INSERT INTO `form_sections` VALUES (1,1,1,'instructional','Instructional Skills',1),(2,1,1,'ethics','Professional Ethics and Attitude Towards Students',2),(3,1,1,'assessment','Assessment Methods & Feedback',3),(4,2,2,'core','Core Competency',1),(5,2,2,'professional','Professional Competency',2),(6,2,2,'time','Time Management',3),(7,2,2,'ethical','Ethical Competence',4),(8,3,3,'subject','Subject Matter Competency',1),(9,3,3,'research','Research and Community Services',2),(10,3,3,'professional','Professional Competency',3),(11,3,3,'ethical','Ethical Competence',4),(12,3,3,'time','Time Management',5),(13,4,4,'instructional','Instructional Skills',1),(14,4,4,'ethics','Professional Ethics and Attitude Towards Students',2),(15,4,4,'assessment','Assessment Methods & Feedback',3),(16,4,4,'behavior','Overall Personal Behavior',4),(17,4,4,'attitude','Professional Attitude',5),(18,4,4,'noninstructional','Performing Non-instructional Duties',6),(19,4,4,'interpersonal','Interpersonal Relationship Capability',7);
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
-- Table structure for table `form_versions`
--

DROP TABLE IF EXISTS `form_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_versions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `form_id` bigint unsigned NOT NULL,
  `version_no` int unsigned NOT NULL,
  `status` enum('draft','published','retired') NOT NULL DEFAULT 'draft',
  `instructions` text,
  `scale_min` tinyint unsigned NOT NULL DEFAULT '0',
  `scale_max` tinyint unsigned NOT NULL DEFAULT '5',
  `allow_na` tinyint(1) NOT NULL DEFAULT '1',
  `scale_labels` json DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `published_by` bigint unsigned DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_form_versions_no` (`form_id`,`version_no`),
  KEY `idx_form_versions_status` (`form_id`,`status`),
  KEY `fk_form_versions_creator` (`created_by`),
  KEY `fk_form_versions_publisher` (`published_by`),
  CONSTRAINT `fk_form_versions_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_form_versions_form` FOREIGN KEY (`form_id`) REFERENCES `evaluation_forms` (`id`),
  CONSTRAINT `fk_form_versions_publisher` FOREIGN KEY (`published_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_form_versions_scale` CHECK ((`scale_min` < `scale_max`))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_versions`
--

LOCK TABLES `form_versions` WRITE;
/*!40000 ALTER TABLE `form_versions` DISABLE KEYS */;
INSERT INTO `form_versions` VALUES (1,1,1,'published',NULL,0,5,1,NULL,NULL,NULL,'2026-10-22 12:30:34','2026-10-22 09:30:34','2026-10-22 09:30:34'),(2,2,1,'published',NULL,0,5,1,NULL,NULL,NULL,'2026-10-22 12:30:34','2026-10-22 09:30:34','2026-10-22 09:30:34'),(3,3,1,'published',NULL,0,5,1,NULL,NULL,NULL,'2026-10-22 12:30:34','2026-10-22 09:30:34','2026-10-22 09:30:34'),(4,4,1,'published',NULL,0,5,1,NULL,NULL,NULL,'2026-10-22 12:30:34','2026-10-22 09:30:34','2026-10-22 09:30:34');
/*!40000 ALTER TABLE `form_versions` ENABLE KEYS */;
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
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `filename` varchar(190) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_migrations`
--

LOCK TABLES `schema_migrations` WRITE;
/*!40000 ALTER TABLE `schema_migrations` DISABLE KEYS */;
INSERT INTO `schema_migrations` VALUES ('001_form_versions.sql','2026-10-22 10:01:39');
/*!40000 ALTER TABLE `schema_migrations` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'dame','damedereje123@gmail.com','$2b$12$S3Su2Ew7rqSNTGEbV3i7gOCSq2U7ArnaBg7ZP2YHnHv0ksJAlYg7q','admin','active','2026-10-19 20:34:00','2026-10-19 23:31:07',NULL,NULL,NULL,NULL,NULL,NULL),(2,'Dame Dereje','damedereje@gmail.com','$2b$12$LJwXVLlzSNqUgczXDAjkp.APUNomxAmfjhyZ6Oe.qTIx.Wym8txjG','student','active','2026-10-19 21:59:02','2026-10-19 21:59:02',NULL,NULL,NULL,NULL,NULL,NULL),(3,'amo','amo@gmail.com','$2b$12$eb.SNyBr1VoMX4ochFjZ8.lCin6KawVy8VDhAGVD.zrlNRUAXVi1W','department_head','active','2026-10-20 00:07:00','2026-10-20 00:07:00',NULL,NULL,NULL,NULL,NULL,NULL),(4,'caalaa','caalaa@gmail.com','$2b$12$xKQgDQdhnj1eQz4VYERqcOqthQB5ERQH96sL2hcxuOs5LOA5LCNw6','teacher','active','2026-10-20 00:07:41','2026-10-20 00:07:41',NULL,NULL,NULL,NULL,NULL,NULL),(5,'solan','sol@gmail.com','$2b$12$l2RgBy3INCuMvQvPD9OH3OrPRVvxycU8BWr1.KFgWmyQQg1rGw7SS','teacher','active','2026-10-20 06:48:43','2026-10-20 06:48:43',NULL,NULL,NULL,NULL,NULL,NULL),(6,'gammee','dame@gmail.com','$2b$12$.qoPKQd9fyNB/2Ss1d5wTehTqR0tYw/XNTbGuzDZDXcYS3.W407UG','committee','active','2026-10-21 05:00:25','2026-10-21 05:00:25',NULL,NULL,NULL,NULL,NULL,NULL),(7,'saamii','sami@gmail.com','$2b$12$MTxqPIfZ8zZQuivPAnOx.efJJGWFtnRj/d/WWjMVb4bjs4fVginuy','teacher','active','2026-10-21 22:04:29','2026-10-21 22:04:29','0929423026','male','2026-10-30','Ethio','6745',NULL),(8,'tola','ti@gmail.com','$2b$12$Ks4q72PDHn4w5BEqcYhjQu4NdPPYWXCoetj7uGUfiUvGJJa6HiewK','student','active','2026-10-22 09:48:44','2026-10-22 09:48:44','0929423026','male','2026-10-30','Addis Ababa, Addis Ababa','6745',NULL),(9,'dea','dea@gmail.com','$2b$12$0R/adeU1kmHsfGAczLaU9./9JlBpWIGSF3fy6lbC.0ivH.KE6xgVW','dean','active','2026-10-22 19:33:05','2026-10-22 19:33:05','0929423026','male','2026-10-23','Addis Ababa, Addis Ababa','6745',NULL),(10,'man','man@gmail.com','$2b$12$ftXMyTsFnDqB1ZMKB5kt2.XqkhC85df1VMmMuie6RyXKlIgQVHLIK','management','active','2026-10-22 19:36:34','2026-10-22 19:36:34','0929423026','male','2026-10-23','Addis Ababa, Addis Ababa','6745',NULL);
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

-- Dump completed on 2026-10-24 12:07:11
