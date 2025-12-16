CREATE DATABASE  IF NOT EXISTS `gestion_educativa` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `gestion_educativa`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: gestion_educativa
-- ------------------------------------------------------
-- Server version	8.0.44

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
-- Table structure for table `acciones_reportes`
--

DROP TABLE IF EXISTS `acciones_reportes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acciones_reportes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reporte_id` int NOT NULL,
  `accion` text NOT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reporte_id` (`reporte_id`),
  CONSTRAINT `acciones_reportes_ibfk_1` FOREIGN KEY (`reporte_id`) REFERENCES `reportes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acciones_reportes`
--

LOCK TABLES `acciones_reportes` WRITE;
/*!40000 ALTER TABLE `acciones_reportes` DISABLE KEYS */;
/*!40000 ALTER TABLE `acciones_reportes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `administradores`
--

DROP TABLE IF EXISTS `administradores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administradores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_nombre` varchar(255) NOT NULL,
  `admin_email` varchar(255) NOT NULL,
  `admin_password` varchar(255) NOT NULL,
  `rol` varchar(50) NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_email` (`admin_email`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administradores`
--

LOCK TABLES `administradores` WRITE;
/*!40000 ALTER TABLE `administradores` DISABLE KEYS */;
INSERT INTO `administradores` VALUES (1,'Administrador Principal','admin@gestion.com','AdminPassword123','SuperAdmin','2025-11-21 23:23:59'),(16,'Juan Pérez','juan.perez@escuela.edu','ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f','maestro','2025-12-11 02:52:13');
/*!40000 ALTER TABLE `administradores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asistencia`
--

DROP TABLE IF EXISTS `asistencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asistencia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `estudiante_id` int NOT NULL,
  `maestro_id` int NOT NULL,
  `fecha` date NOT NULL,
  `hora_clase` time NOT NULL,
  `estado` enum('PRESENTE','AUSENTE','JUSTIFICADO') NOT NULL,
  `comentario_maestro` text,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fecha_maestro` (`fecha`,`maestro_id`),
  KEY `idx_estudiante_fecha` (`estudiante_id`,`fecha`),
  CONSTRAINT `asistencia_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asistencia`
--

LOCK TABLES `asistencia` WRITE;
/*!40000 ALTER TABLE `asistencia` DISABLE KEYS */;
INSERT INTO `asistencia` VALUES (5,2,1,'2025-11-23','08:00:00','PRESENTE',NULL,'2025-11-23 15:11:49'),(6,3,1,'2025-11-23','08:00:00','PRESENTE',NULL,'2025-11-23 15:11:49'),(7,2,1,'2025-11-28','08:00:00','JUSTIFICADO','Participó activamente','2025-11-29 12:35:05'),(8,3,1,'2025-11-27','08:00:00','AUSENTE','Necesita mejorar atención','2025-11-29 12:35:05'),(9,8,1,'2025-11-23','08:00:00','AUSENTE','Buen comportamiento','2025-11-29 12:35:05'),(10,9,1,'2025-11-27','08:00:00','AUSENTE','Participó activamente','2025-11-29 12:35:05'),(11,10,1,'2025-11-23','08:00:00','PRESENTE','Participó activamente','2025-11-29 12:35:05'),(12,11,1,'2025-11-26','08:00:00','PRESENTE','Participó activamente','2025-11-29 12:35:05'),(13,16,1,'2025-11-29','08:00:00','PRESENTE','Participó activamente','2025-11-29 12:35:05'),(14,22,1,'2025-11-28','08:00:00','PRESENTE','Necesita mejorar atención','2025-11-29 12:35:05'),(15,23,1,'2025-11-24','08:00:00','AUSENTE','Necesita mejorar atención','2025-11-29 12:35:05'),(16,24,1,'2025-11-29','08:00:00','PRESENTE','Necesita mejorar atención','2025-11-29 12:35:05'),(17,2,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49'),(18,3,1,'2025-12-12','08:00:00','PRESENTE','holaaa','2025-12-12 20:34:49'),(19,8,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49'),(20,9,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49'),(21,10,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49'),(22,11,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49'),(23,16,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49'),(24,22,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49'),(25,23,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49'),(26,24,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49'),(27,25,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49'),(28,26,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49'),(29,33,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49'),(30,34,1,'2025-12-12','08:00:00','PRESENTE',NULL,'2025-12-12 20:34:49');
/*!40000 ALTER TABLE `asistencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `avisos`
--

DROP TABLE IF EXISTS `avisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `avisos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `contenido` text NOT NULL,
  `prioridad` enum('alta','media','baja') DEFAULT 'media',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avisos`
--

LOCK TABLES `avisos` WRITE;
/*!40000 ALTER TABLE `avisos` DISABLE KEYS */;
INSERT INTO `avisos` VALUES (1,'Bienvenida','Bienvenidos al sistema educativo.','alta',0,'2025-11-23 14:06:01','2025-11-30 14:11:08'),(2,'Reunión','Reunión este viernes a las 18:00','media',0,'2025-11-23 14:06:01','2025-12-13 11:19:32'),(4,'CLASES','86788','alta',0,'2025-11-23 14:16:59','2025-11-30 14:11:07'),(5,'Inicio de Clases','Las clases del nuevo ciclo escolar inician el 15 de enero.','alta',1,'2025-11-29 12:35:05','2025-12-13 14:52:52'),(6,'Entrega de Calificaciones','La entrega de boletas será el próximo viernes.','media',0,'2025-11-29 12:35:05','2025-11-30 14:11:02'),(7,'Evento Deportivo','Competencia interescolar de atletismo este sábado.','baja',0,'2025-11-29 12:35:05','2025-11-30 14:11:03'),(8,'Reunión de Padres','Reunión informativa el próximo miércoles a las 17:00 hrs.','alta',0,'2025-11-29 12:35:05','2025-11-30 14:11:04'),(9,'Taller de Lectura','Inscripciones abiertas para el taller de lectura comprensiva.','media',0,'2025-11-29 12:35:05','2025-11-30 14:11:06'),(10,'Prueba','Contenido de prueba','media',0,'2025-11-30 13:58:29','2025-12-13 14:52:53');
/*!40000 ALTER TABLE `avisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calificaciones_trimestre`
--

DROP TABLE IF EXISTS `calificaciones_trimestre`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calificaciones_trimestre` (
  `id` int NOT NULL AUTO_INCREMENT,
  `estudiante_id` int NOT NULL,
  `tarea_id` int NOT NULL,
  `trimestre_id` int NOT NULL,
  `porcentaje` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `estudiante_id` (`estudiante_id`),
  KEY `tarea_id` (`tarea_id`),
  KEY `trimestre_id` (`trimestre_id`),
  CONSTRAINT `calificaciones_trimestre_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `calificaciones_trimestre_ibfk_2` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id_tarea`),
  CONSTRAINT `calificaciones_trimestre_ibfk_3` FOREIGN KEY (`trimestre_id`) REFERENCES `trimestres` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calificaciones_trimestre`
--

LOCK TABLES `calificaciones_trimestre` WRITE;
/*!40000 ALTER TABLE `calificaciones_trimestre` DISABLE KEYS */;
INSERT INTO `calificaciones_trimestre` VALUES (1,2,1,1,0.00),(3,2,1,1,0.00),(5,2,1,1,0.00),(6,2,1,1,0.00);
/*!40000 ALTER TABLE `calificaciones_trimestre` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `certificados`
--

DROP TABLE IF EXISTS `certificados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `alumno_id` int NOT NULL,
  `maestro_id` int NOT NULL,
  `promedio` decimal(4,2) NOT NULL,
  `ciclo` varchar(50) NOT NULL,
  `maestro_firma` varchar(255) NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(20) DEFAULT 'pendiente',
  PRIMARY KEY (`id`),
  KEY `idx_certificados_maestro` (`maestro_id`),
  KEY `idx_certificados_alumno` (`alumno_id`),
  KEY `idx_certificados_ciclo` (`ciclo`),
  CONSTRAINT `fk_cert_alumno` FOREIGN KEY (`alumno_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_cert_maestro` FOREIGN KEY (`maestro_id`) REFERENCES `administradores` (`id`),
  CONSTRAINT `certificados_chk_1` CHECK (((`promedio` >= 0) and (`promedio` <= 10)))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificados`
--

LOCK TABLES `certificados` WRITE;
/*!40000 ALTER TABLE `certificados` DISABLE KEYS */;
INSERT INTO `certificados` VALUES (5,2,1,9.50,'2025-2026','Juan Pérez','2025-12-11 03:05:22','pendiente'),(6,2,1,9.80,'2025-2026','Juan P�rez','2025-12-11 03:51:28','pendiente'),(7,34,16,10.00,'2025-2026','Juan Pérez','2025-12-11 06:25:28','enviado'),(8,9,16,10.00,'2025-2026','Juan Pérez','2025-12-11 06:44:29','enviado'),(9,26,16,10.00,'2025-2026','Juan Pérez','2025-12-11 06:47:35','enviado'),(10,3,16,10.00,'2025-2026','Alex David','2025-12-16 20:02:35','enviado');
/*!40000 ALTER TABLE `certificados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion`
--

DROP TABLE IF EXISTS `configuracion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `maestro_id` int NOT NULL,
  `ciclo_actual` varchar(50) DEFAULT '2025-2026',
  `nombre_maestro_firma` varchar(255) DEFAULT NULL,
  `ultimo_alumno_id` int DEFAULT NULL,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `maestro_id` (`maestro_id`),
  KEY `fk_config_alumno` (`ultimo_alumno_id`),
  CONSTRAINT `fk_config_alumno` FOREIGN KEY (`ultimo_alumno_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_config_maestro` FOREIGN KEY (`maestro_id`) REFERENCES `administradores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion`
--

LOCK TABLES `configuracion` WRITE;
/*!40000 ALTER TABLE `configuracion` DISABLE KEYS */;
INSERT INTO `configuracion` VALUES (1,1,'2025-2026','Juan P�rez',2,'2025-12-11 03:51:28'),(2,16,'2025-2026','Alex David',3,'2025-12-16 20:02:35');
/*!40000 ALTER TABLE `configuracion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entregas_tareas`
--

DROP TABLE IF EXISTS `entregas_tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entregas_tareas` (
  `id_entrega` int NOT NULL AUTO_INCREMENT,
  `id_tarea` int NOT NULL,
  `estudiante_id` int NOT NULL,
  `archivo_entregado` varchar(500) DEFAULT NULL,
  `comentario_alumno` text,
  `calificacion` decimal(5,2) DEFAULT NULL,
  `comentario_docente` text,
  `estado` enum('ENTREGADO','REVISADO','PENDIENTE') DEFAULT 'PENDIENTE',
  `fecha_entrega` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_entrega`),
  KEY `id_tarea` (`id_tarea`),
  KEY `estudiante_id` (`estudiante_id`),
  CONSTRAINT `entregas_tareas_ibfk_1` FOREIGN KEY (`id_tarea`) REFERENCES `tareas` (`id_tarea`) ON DELETE CASCADE,
  CONSTRAINT `entregas_tareas_ibfk_2` FOREIGN KEY (`estudiante_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entregas_tareas`
--

LOCK TABLES `entregas_tareas` WRITE;
/*!40000 ALTER TABLE `entregas_tareas` DISABLE KEYS */;
INSERT INTO `entregas_tareas` VALUES (2,1,2,NULL,'Todavía estoy trabajando en ello',10.00,NULL,'REVISADO','2025-11-22 09:10:12','2025-12-06 14:15:26'),(7,7,2,NULL,'Completé la tarea',6.30,'Buen trabajo','ENTREGADO','2025-11-29 12:35:05','2025-11-29 12:35:05'),(8,6,2,'tarea_2_6.pdf','Completé la tarea',10.00,NULL,'REVISADO','2025-11-29 12:35:05','2025-12-06 14:30:29'),(13,7,3,'tarea_3_7.pdf','Completé la tarea',10.00,NULL,'REVISADO','2025-11-29 12:35:05','2025-12-06 14:30:04'),(14,6,3,NULL,'En proceso de entrega',10.00,NULL,'REVISADO','2025-11-29 12:35:05','2025-12-06 14:30:22'),(15,1,3,'tarea_3_1.pdf','En proceso de entrega',10.00,NULL,'REVISADO','2025-11-29 12:35:05','2025-12-15 06:07:06');
/*!40000 ALTER TABLE `entregas_tareas` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_calificar_tarea` AFTER UPDATE ON `entregas_tareas` FOR EACH ROW BEGIN
    -- Solo actualizar si se modificó la calificación
    IF NEW.calificacion != OLD.calificacion THEN
        CALL ActualizarPromedios(NEW.estudiante_id);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `materias`
--

DROP TABLE IF EXISTS `materias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materias` (
  `id_materia` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  `created_by` int DEFAULT NULL,
  `color` varchar(20) DEFAULT '#667eea',
  `icono` varchar(50) DEFAULT 0xF09F9398,
  PRIMARY KEY (`id_materia`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `materias_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `administradores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materias`
--

LOCK TABLES `materias` WRITE;
/*!40000 ALTER TABLE `materias` DISABLE KEYS */;
INSERT INTO `materias` VALUES (1,'Matemáticas','Operaciones básicas, problemas, álgebra inicial',1,'#667eea','?'),(9,'ciencias ',NULL,1,'#667eea','?'),(12,'Español',NULL,NULL,'#667eea','?'),(18,'KKNKNNK','MMKKMKNN',1,'#805ad5','?'),(19,'TEST_TRIGGER_1765809956847','Materia de prueba para trigger',1,'#FF5733','?');
/*!40000 ALTER TABLE `materias` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_materia_insert` AFTER INSERT ON `materias` FOR EACH ROW BEGIN
  -- Insertar esta nueva materia para TODOS los niños
  INSERT INTO nino_materias (nino_id, id_materia, trimestre)
  SELECT id, NEW.id_materia, '1'
  FROM usuarios 
  WHERE nino_nombre IS NOT NULL 
    AND nino_nombre != '';
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `mensajes`
--

DROP TABLE IF EXISTS `mensajes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mensajes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `maestro_id` int DEFAULT NULL,
  `tutor_id` int DEFAULT NULL,
  `mensaje` text,
  `fecha_envio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `leido` tinyint(1) DEFAULT '0',
  `tipo_remitente` enum('maestro','tutor') NOT NULL DEFAULT 'maestro',
  PRIMARY KEY (`id`),
  KEY `maestro_id` (`maestro_id`),
  KEY `tutor_id` (`tutor_id`),
  CONSTRAINT `mensajes_ibfk_1` FOREIGN KEY (`maestro_id`) REFERENCES `administradores` (`id`),
  CONSTRAINT `mensajes_ibfk_2` FOREIGN KEY (`tutor_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensajes`
--

LOCK TABLES `mensajes` WRITE;
/*!40000 ALTER TABLE `mensajes` DISABLE KEYS */;
INSERT INTO `mensajes` VALUES (1,1,2,'Hola Ana, necesito hablar sobre el progreso de Carlos','2025-11-30 18:46:02',1,'maestro'),(2,1,34,'Buenos días David, Eliezer tuvo un excelente día hoy','2025-11-30 18:46:02',1,'maestro'),(3,1,34,'HOLA','2025-11-30 19:43:50',1,'maestro'),(4,1,8,'HOLA','2025-11-30 19:44:55',1,'maestro'),(5,1,8,'que tall?','2025-12-01 14:00:38',1,'maestro'),(6,1,3,'hey','2025-12-01 14:01:06',1,'maestro'),(7,1,3,'HOLA','2025-12-05 14:30:44',1,'maestro'),(8,1,2,'Hola Ana, ¿cómo está Carlos en clase hoy?','2025-12-01 15:00:00',1,'maestro'),(9,1,2,'Todo bien profesor, gracias por preguntar','2025-12-01 15:15:00',1,'maestro'),(10,1,2,'¿Hay tarea para mañana?','2025-12-01 20:30:00',0,'maestro'),(11,1,34,'Buen día David, Eliezer necesita repasar matemáticas','2025-12-01 16:00:00',1,'maestro'),(12,1,34,'Entendido, lo revisaremos esta tarde','2025-12-01 16:30:00',1,'maestro'),(13,1,34,'¿Puede enviar los ejercicios adicionales?','2025-12-02 14:45:00',1,'maestro'),(14,1,22,'Ana no se siente bien hoy','2025-11-30 13:30:00',1,'maestro'),(15,1,22,'Que descanse y se mejore pronto','2025-11-30 14:00:00',1,'maestro'),(16,1,22,'¿Puede asistir mañana?','2025-12-01 22:00:00',1,'maestro'),(17,1,23,'Luis ha mejorado mucho en lectura','2025-11-29 17:00:00',1,'maestro'),(18,1,23,'¡Qué buena noticia! Gracias','2025-11-29 20:00:00',1,'maestro'),(19,1,24,'Sofía ganó el concurso de ortografía','2025-11-28 18:00:00',1,'maestro'),(20,1,24,'¡Felicidades a Sofía!','2025-11-28 18:30:00',1,'maestro'),(21,1,25,'Diego necesita traer materiales para ciencia','2025-12-01 21:00:00',1,'maestro'),(22,1,26,'Valeria tiene cita médica el viernes','2025-11-27 15:00:00',1,'maestro'),(23,1,26,'Gracias por avisar, que todo salga bien','2025-11-27 15:15:00',1,'maestro'),(24,1,3,'¿Puede enviar el certificado médico?','2025-11-26 16:00:00',1,'maestro'),(25,1,2,'Holaaaa','2025-12-16 10:48:24',0,'maestro'),(26,1,2,'3','2025-12-16 10:49:23',0,'maestro'),(33,1,3,'Bienvenido Alexis al sistema de chat','2025-12-16 11:59:01',1,'maestro'),(34,1,3,'Hola Alexis, soy el maestro principal','2025-12-15 16:00:00',1,'maestro'),(35,1,3,'¿Cómo está Darli en clase?','2025-12-14 20:30:00',1,'maestro'),(36,1,3,'jijijijiji','2025-12-16 13:35:42',1,'maestro'),(37,1,3,'HOLAAAA','2025-12-16 13:36:03',1,'tutor');
/*!40000 ALTER TABLE `mensajes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nino_materias`
--

DROP TABLE IF EXISTS `nino_materias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nino_materias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nino_id` int NOT NULL,
  `id_materia` int NOT NULL,
  `trimestre` enum('1','2','3') DEFAULT '1',
  `fecha_inscripcion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `nino_id` (`nino_id`),
  KEY `id_materia` (`id_materia`),
  CONSTRAINT `nino_materias_ibfk_1` FOREIGN KEY (`nino_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `nino_materias_ibfk_2` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id_materia`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nino_materias`
--

LOCK TABLES `nino_materias` WRITE;
/*!40000 ALTER TABLE `nino_materias` DISABLE KEYS */;
INSERT INTO `nino_materias` VALUES (1,2,1,'1','2025-12-15 14:30:28'),(2,2,9,'1','2025-12-15 14:30:28'),(3,2,12,'1','2025-12-15 14:30:28'),(4,2,18,'1','2025-12-15 14:30:28'),(5,3,1,'1','2025-12-15 14:30:28'),(6,3,9,'1','2025-12-15 14:30:28'),(7,3,12,'1','2025-12-15 14:30:28'),(8,3,18,'1','2025-12-15 14:30:28'),(9,8,1,'1','2025-12-15 14:30:28'),(10,8,9,'1','2025-12-15 14:30:28'),(11,8,12,'1','2025-12-15 14:30:28'),(12,8,18,'1','2025-12-15 14:30:28'),(13,9,1,'1','2025-12-15 14:30:28'),(14,9,9,'1','2025-12-15 14:30:28'),(15,9,12,'1','2025-12-15 14:30:28'),(16,9,18,'1','2025-12-15 14:30:28'),(17,10,1,'1','2025-12-15 14:30:28'),(18,10,9,'1','2025-12-15 14:30:28'),(19,10,12,'1','2025-12-15 14:30:28'),(20,10,18,'1','2025-12-15 14:30:28'),(21,11,1,'1','2025-12-15 14:30:28'),(22,11,9,'1','2025-12-15 14:30:28'),(23,11,12,'1','2025-12-15 14:30:28'),(24,11,18,'1','2025-12-15 14:30:28'),(25,16,1,'1','2025-12-15 14:30:28'),(26,16,9,'1','2025-12-15 14:30:28'),(27,16,12,'1','2025-12-15 14:30:28'),(28,16,18,'1','2025-12-15 14:30:28'),(29,22,1,'1','2025-12-15 14:30:28'),(30,22,9,'1','2025-12-15 14:30:28'),(31,22,12,'1','2025-12-15 14:30:28'),(32,22,18,'1','2025-12-15 14:30:28'),(33,23,1,'1','2025-12-15 14:30:28'),(34,23,9,'1','2025-12-15 14:30:28'),(35,23,12,'1','2025-12-15 14:30:28'),(36,23,18,'1','2025-12-15 14:30:28'),(37,24,1,'1','2025-12-15 14:30:28'),(38,24,9,'1','2025-12-15 14:30:28'),(39,24,12,'1','2025-12-15 14:30:28'),(40,24,18,'1','2025-12-15 14:30:28'),(41,25,1,'1','2025-12-15 14:30:28'),(42,25,9,'1','2025-12-15 14:30:28'),(43,25,12,'1','2025-12-15 14:30:28'),(44,25,18,'1','2025-12-15 14:30:28'),(45,26,1,'1','2025-12-15 14:30:28'),(46,26,9,'1','2025-12-15 14:30:28'),(47,26,12,'1','2025-12-15 14:30:28'),(48,26,18,'1','2025-12-15 14:30:28'),(49,33,1,'1','2025-12-15 14:30:28'),(50,33,9,'1','2025-12-15 14:30:28'),(51,33,12,'1','2025-12-15 14:30:28'),(52,33,18,'1','2025-12-15 14:30:28'),(53,34,1,'1','2025-12-15 14:30:28'),(54,34,9,'1','2025-12-15 14:30:28'),(55,34,12,'1','2025-12-15 14:30:28'),(56,34,18,'1','2025-12-15 14:30:28'),(57,2,19,'1','2025-12-15 14:45:56'),(58,3,19,'1','2025-12-15 14:45:56'),(59,8,19,'1','2025-12-15 14:45:56'),(60,9,19,'1','2025-12-15 14:45:56'),(61,10,19,'1','2025-12-15 14:45:56'),(62,11,19,'1','2025-12-15 14:45:56'),(63,16,19,'1','2025-12-15 14:45:56'),(64,22,19,'1','2025-12-15 14:45:56'),(65,23,19,'1','2025-12-15 14:45:56'),(66,24,19,'1','2025-12-15 14:45:56'),(67,25,19,'1','2025-12-15 14:45:56'),(68,26,19,'1','2025-12-15 14:45:56'),(69,33,19,'1','2025-12-15 14:45:56'),(70,34,19,'1','2025-12-15 14:45:56');
/*!40000 ALTER TABLE `nino_materias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promedios_calificaciones`
--

DROP TABLE IF EXISTS `promedios_calificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promedios_calificaciones` (
  `id_promedio` int NOT NULL AUTO_INCREMENT,
  `estudiante_id` int NOT NULL,
  `id_materia` int DEFAULT NULL,
  `trimestre` int NOT NULL,
  `promedio_materia` decimal(5,2) DEFAULT '0.00',
  `promedio_trimestre` decimal(5,2) DEFAULT '0.00',
  `promedio_general` decimal(5,2) DEFAULT '0.00',
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_promedio`),
  KEY `estudiante_id` (`estudiante_id`),
  KEY `id_materia` (`id_materia`),
  CONSTRAINT `promedios_calificaciones_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `promedios_calificaciones_ibfk_2` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id_materia`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promedios_calificaciones`
--

LOCK TABLES `promedios_calificaciones` WRITE;
/*!40000 ALTER TABLE `promedios_calificaciones` DISABLE KEYS */;
INSERT INTO `promedios_calificaciones` VALUES (3,3,9,2,10.00,9.95,9.97,'2025-12-07 14:40:18'),(4,3,9,1,10.00,9.95,9.97,'2025-12-07 14:40:18'),(5,3,1,1,9.80,9.95,9.97,'2025-12-07 14:40:18'),(6,3,9,2,10.00,9.95,9.97,'2025-12-15 06:07:06'),(7,3,9,1,10.00,9.95,9.97,'2025-12-15 06:07:06'),(8,3,1,1,10.00,9.95,9.97,'2025-12-15 06:07:06');
/*!40000 ALTER TABLE `promedios_calificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recuperar_contrasena`
--

DROP TABLE IF EXISTS `recuperar_contrasena`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recuperar_contrasena` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `pregunta1` varchar(255) DEFAULT NULL,
  `respuesta1` varchar(255) DEFAULT NULL,
  `pregunta2` varchar(255) DEFAULT NULL,
  `respuesta2` varchar(255) DEFAULT NULL,
  `pregunta3` varchar(255) DEFAULT NULL,
  `respuesta3` varchar(255) DEFAULT NULL,
  `pregunta4` varchar(255) DEFAULT NULL,
  `respuesta4` varchar(255) DEFAULT NULL,
  `pregunta5` varchar(255) DEFAULT NULL,
  `respuesta5` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `recuperar_contrasena_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recuperar_contrasena`
--

LOCK TABLES `recuperar_contrasena` WRITE;
/*!40000 ALTER TABLE `recuperar_contrasena` DISABLE KEYS */;
INSERT INTO `recuperar_contrasena` VALUES (2,2,'¿Nombre de tu primera mascota?','Max','¿Color favorito?','Rojo','¿Ciudad favorita?','Guadalajara','¿Deporte favorito?','Nataci�n','¿Comida favorita?','Tacos'),(3,3,'¿Nombre de tu primera mascota?','pato','¿Color favorito?','azul','¿Ciudad favorita?','pizza','¿Deporte favorito?','no','¿Comida favorita?','pizza'),(9,8,'¿Nombre de tu primera mascota?','Firulais','¿Comida favorita?','Pizza','¿Película favorita?','Toy Story',NULL,NULL,NULL,NULL),(10,9,'¿Color favorito?','Azul','¿Comida favorita?','Comida Mexicana','¿Película favorita?','Matrix',NULL,NULL,NULL,NULL),(11,10,'¿Ciudad de nacimiento?','Guadalajara','¿Comida favorita?','Pozole','¿Película favorita?','Avengers',NULL,NULL,NULL,NULL),(12,11,'¿Color favorito?','Azul','¿Comida favorita?','Comida Mexicana','¿Película favorita?','Matrix',NULL,NULL,NULL,NULL),(13,16,'¿Nombre de tu primera mascota?','Firulais','¿Comida favorita?','Pizza','¿Película favorita?','Toy Story',NULL,NULL,NULL,NULL),(14,22,'¿Nombre de tu primera escuela?','Escuela Primaria','¿Comida favorita?','Tacos','¿Película favorita?','Coco',NULL,NULL,NULL,NULL),(15,23,'¿Ciudad de nacimiento?','Guadalajara','¿Comida favorita?','Pozole','¿Película favorita?','Avengers',NULL,NULL,NULL,NULL),(16,24,'¿Nombre de tu mejor amigo de la infancia?','Miguel','¿Comida favorita?','Enchiladas','¿Película favorita?','Frozen',NULL,NULL,NULL,NULL),(17,25,'¿Apellido de soltera de tu madre?','Pérez','¿Comida favorita?','Mole','¿Película favorita?','Rápido y Furioso',NULL,NULL,NULL,NULL),(18,26,'¿Modelo de tu primer auto?','Tsuru','¿Comida favorita?','Chilaquiles','¿Película favorita?','La La Land',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `recuperar_contrasena` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reportes`
--

DROP TABLE IF EXISTS `reportes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reportes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `nino_id` int NOT NULL,
  `tipo` enum('academico','conducta','asistencia','personal','salud','familiar') NOT NULL,
  `estado` enum('pendiente','revisado','resuelto') NOT NULL,
  `prioridad` enum('baja','media','alta') NOT NULL,
  `motivo` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `accionesTomadas` text,
  `leido_por_alumno` tinyint DEFAULT '0',
  `fecha_leido` datetime DEFAULT NULL,
  `observaciones_alumno` text,
  `fecha_observacion` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `nino_id` (`nino_id`),
  CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `reportes_ibfk_2` FOREIGN KEY (`nino_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reportes`
--

LOCK TABLES `reportes` WRITE;
/*!40000 ALTER TABLE `reportes` DISABLE KEYS */;
INSERT INTO `reportes` VALUES (8,16,16,'academico','pendiente','media','Bajo rendimiento','El estudiante no ha entregado varias tareas y tiene calificaciones bajas en las materias principales.','2025-11-26 14:23:12',NULL,0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(10,16,16,'academico','pendiente','media','Bajo rendimiento en matemáticas','El estudiante no ha entregado varias tareas y tiene calificaciones bajas en matemáticas. Se observa falta de interés en la materia.','2025-11-25 16:00:00','Se programó reunión con padres para el próximo lunes',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(11,16,16,'conducta','revisado','alta','Comportamiento disruptivo en clase','El estudiante interrumpe constantemente la clase, no sigue instrucciones y distrae a sus compañeros durante las explicaciones.','2025-11-20 20:30:00','Llamada a tutores y se implementó plan de conducta con refuerzos positivos',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(12,16,16,'asistencia','resuelto','baja','Faltas recurrentes los viernes','El estudiante ha faltado 3 viernes consecutivos sin justificación médica. Los padres mencionaron compromisos familiares.','2025-11-15 15:15:00','Se contactó a padres y se acordó que justificarán las faltas con anticipación',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(13,16,16,'salud','pendiente','alta','Quejas frecuentes de dolor de cabeza','El estudiante se queja de dolores de cabeza durante las clases de la tarde, especialmente en días calurosos.','2025-11-26 14:23:12','Enviado a enfermería para evaluación. Pendiente examen médico',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(14,16,16,'personal','revisado','media','Problemas de integración grupal','El estudiante se muestra apático en actividades grupales y prefiere trabajar solo. Tiene dificultades para socializar.','2025-11-10 17:45:00','Derivado a psicólogo escolar. En proceso de integración con actividades guiadas',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(15,16,16,'familiar','pendiente','alta','Situación familiar complicada','Se detectaron cambios abruptos en el comportamiento relacionados con problemas familiares que los padres confirmaron.','2025-11-18 22:20:00','Programada sesión con trabajadora social y apoyo psicológico continuo',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(16,16,9,'academico','resuelto','media','Excelente rendimiento en lectura','La estudiante muestra aptitudes sobresalientes en comprensión lectora y participa activamente en clase.','2025-11-22 16:30:00','Se recomienda programa de enriquecimiento académico',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(17,16,10,'conducta','pendiente','alta','Problemas de agresividad en el recreo','El estudiante ha tenido incidentes de empujones y gritos durante los periodos de recreo con sus compañeros.','2025-11-24 21:45:00','En observación. Reunión con padres programada',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(18,16,11,'asistencia','revisado','baja','Llegadas tardías frecuentes','La estudiante llega tarde regularmente, lo que afecta su rendimiento en la primera clase del día.','2025-11-19 14:10:00','Se implementó registro de entrada. Mejoría notable en la última semana',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(19,16,2,'familiar','resuelto','media','Reporte Carlos Garc�a - 2025-11-29','Descripción del reporte para el estudiante Carlos Garc�a. Situación que requiere atención.','2025-11-29 12:38:17','Se contactó a padres',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(20,16,3,'salud','resuelto','alta','Reporte Darli obil sima - 2025-11-29','Descripción del reporte para el estudiante Darli obil sima. Situación que requiere atención.','2025-11-29 12:38:17','En proceso de revisión',1,'2025-12-16 10:11:19',NULL,NULL,'2025-12-16 13:59:36','2025-12-16 16:11:19'),(21,16,8,'salud','revisado','alta','Reporte Luis Pérez - 2025-11-29','Descripción del reporte para el estudiante Luis Pérez. Situación que requiere atención.','2025-11-29 12:38:17','En proceso de revisión',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(22,16,9,'salud','pendiente','media','Reporte Carla Pérez - 2025-11-29','Descripción del reporte para el estudiante Carla Pérez. Situación que requiere atención.','2025-11-29 12:38:17','En proceso de revisión',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(23,16,10,'conducta','pendiente','media','Reporte Pedro Gómez - 2025-11-29','Descripción del reporte para el estudiante Pedro Gómez. Situación que requiere atención.','2025-11-29 12:38:17','Programada reunión de seguimiento',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(24,16,11,'salud','pendiente','baja','Reporte Lucía Fernández - 2025-11-29','Descripción del reporte para el estudiante Lucía Fernández. Situación que requiere atención.','2025-11-29 12:38:17','Programada reunión de seguimiento',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(25,16,16,'conducta','revisado','baja','Reporte Luis Pérez - 2025-11-29','Descripción del reporte para el estudiante Luis Pérez. Situación que requiere atención.','2025-11-29 12:38:17','En proceso de revisión',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(26,16,22,'asistencia','resuelto','baja','Reporte Ana García - 2025-11-29','Descripción del reporte para el estudiante Ana García. Situación que requiere atención.','2025-11-29 12:38:17','En proceso de revisión',0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(27,16,26,'conducta','pendiente','alta','HBHBGHBHHBHBJ','JHVVGVGVGHBJ','2025-12-09 22:52:02',NULL,0,NULL,NULL,NULL,'2025-12-16 13:59:36','2025-12-16 13:59:36'),(28,16,3,'asistencia','pendiente','alta','jjnjkkmkm','mikkmkmkkmk','2025-12-16 16:12:45',NULL,0,NULL,NULL,NULL,'2025-12-16 16:12:45','2025-12-16 16:12:45'),(29,16,3,'conducta','pendiente','alta','j jmj m m','m  mk,l,l,l','2025-12-16 16:14:00',NULL,0,NULL,NULL,NULL,'2025-12-16 16:14:00','2025-12-16 16:14:00');
/*!40000 ALTER TABLE `reportes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tareas`
--

DROP TABLE IF EXISTS `tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tareas` (
  `id_tarea` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `instrucciones` text,
  `fecha_cierre` datetime NOT NULL,
  `permitir_entrega_tarde` tinyint(1) DEFAULT '1',
  `activa` tinyint(1) DEFAULT '1',
  `rubrica` text,
  `archivo_adjunto` varchar(500) DEFAULT NULL,
  `created_by` int NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id_materia` int DEFAULT NULL,
  `trimestre` enum('1','2','3') NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_tarea`),
  KEY `created_by` (`created_by`),
  KEY `id_materia` (`id_materia`),
  CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `administradores` (`id`),
  CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id_materia`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas`
--

LOCK TABLES `tareas` WRITE;
/*!40000 ALTER TABLE `tareas` DISABLE KEYS */;
INSERT INTO `tareas` VALUES (1,'Tarea de Matemáticas','Resolver los ejercicios de la página 45','2025-11-29 03:10:12',1,1,'Puntaje máximo: 10 puntos',NULL,1,'2025-11-22 09:10:12','2025-11-25 17:28:51',1,'1'),(6,'Multiplicaci+on','ddrdrrddr','2025-11-30 15:59:00',1,1,'e4ee4e4e4e4','/uploads/tareas/1764091255197-boleta_alumno_2_(1).pdf',1,'2025-11-25 17:18:00','2025-11-25 17:35:54',9,'1'),(7,'BIG DATA','CREA UNA IA','2025-12-09 18:00:00',0,1,'',NULL,1,'2025-11-25 18:02:46','2025-11-25 18:02:46',9,'2'),(16,'fELICES','MKKKMKMKN','2026-01-04 14:04:00',1,1,'','uploads/tareas/tarea-1764944929931-574168054.pdf',1,'2025-12-05 14:28:49','2025-12-05 14:28:49',18,'2'),(17,'ELI','VHGVGHGHHH','2025-12-17 05:59:00',1,1,'','uploads/tareas/tarea-1765779025614-299171895.pdf',1,'2025-12-15 06:10:25','2025-12-15 06:10:25',12,'3');
/*!40000 ALTER TABLE `tareas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_reporte`
--

DROP TABLE IF EXISTS `tipos_reporte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_reporte` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_reporte`
--

LOCK TABLES `tipos_reporte` WRITE;
/*!40000 ALTER TABLE `tipos_reporte` DISABLE KEYS */;
INSERT INTO `tipos_reporte` VALUES (1,'Académico','Reporte relacionado con el rendimiento académico del estudiante'),(2,'Conducta','Reporte sobre el comportamiento y actitud del estudiante en clase'),(3,'Asistencia','Reporte sobre la asistencia del estudiante a clases'),(4,'Personal','Reporte sobre asuntos personales del estudiante'),(5,'Salud','Reporte sobre la salud del estudiante'),(6,'Familiar','Reporte relacionado con la situación familiar del estudiante');
/*!40000 ALTER TABLE `tipos_reporte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trimestres`
--

DROP TABLE IF EXISTS `trimestres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trimestres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `activo` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trimestres`
--

LOCK TABLES `trimestres` WRITE;
/*!40000 ALTER TABLE `trimestres` DISABLE KEYS */;
INSERT INTO `trimestres` VALUES (1,'Trimestre 1',1),(2,'Trimestre 2',0),(3,'Trimestre 3',0),(4,'Trimestre 1',1),(5,'Trimestre 2',0),(6,'Trimestre 3',0);
/*!40000 ALTER TABLE `trimestres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tutor_nombre` varchar(255) NOT NULL,
  `tutor_email` varchar(255) NOT NULL,
  `tutor_telefono` varchar(20) DEFAULT NULL,
  `tutor_password` varchar(255) NOT NULL,
  `nino_nombre` varchar(255) NOT NULL,
  `nino_condiciones` text,
  `fecha_nacimiento` date DEFAULT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `rol` varchar(50) DEFAULT 'tutor',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tutor_email` (`tutor_email`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (2,'Ana Garcia','ana@ejemplo.com','+52 555 999 8888','miPassword123','Carlos Garcia','Ninguna','2019-03-20','2025-11-30 18:07:03','tutor'),(3,'Alexis David Obil Colli','biospacensap2025@gmail.com','8484@itescam.edu.mx','2025Eliana-','Darli obil sima',NULL,'2022-11-10','2025-11-22 05:34:26','tutor'),(8,'Juan Pérez','juan.perez1@example.com','(555) 1234-5678','password123','Luis Pérez','Sin condiciones médicas','2010-05-15','2025-11-26 13:54:33','tutor'),(9,'Ana García','ana.garcia@example.com','(555) 9876-5432','password456','Carla Pérez','Sin condiciones médicas','2012-07-20','2025-11-26 13:54:33','tutor'),(10,'Carlos López','carlos.lopez@example.com','(555) 1122-3344','password789','Pedro Gómez','Alergia a la penicilina','2011-11-10','2025-11-26 13:54:33','tutor'),(11,'María Martínez','maria.martinez@example.com','(555) 2233-4455','password101','Lucía Fernández','Problemas respiratorios','2010-08-05','2025-11-26 13:54:33','tutor'),(16,'Juan Pérez','juan.perez@example.com','(555) 1234-5678','password123','Luis Pérez','Sin condiciones médicas','2010-05-15','2025-11-26 14:17:38','tutor'),(22,'María García','maria.garcia@example.com','+52 555 9876 5432','Password123','Ana García','Alergia a nueces','2012-08-20','2025-11-29 12:20:43','tutor'),(23,'Carlos López','Lucia.lopez@example.com','+52 555 4567 8901','SecurePass456','Luis López','Ninguna','2011-03-10','2025-11-29 12:20:43','tutor'),(24,'Elena Martínez','elena.martinez@example.com','+52 555 2345 6789','MyPass789','Sofía Martínez','Asma leve','2013-11-05','2025-11-29 12:20:43','tutor'),(25,'Roberto Sánchez','roberto.sanchez@example.com','+52 555 3456 7890','RobertoPass','Diego Sánchez','Ninguna','2012-12-15','2025-11-29 12:20:43','tutor'),(26,'Laura Rodríguez','laura.rodriguez@example.com','+52 555 5678 9012','Laura1234','Valeria Rodríguez','Dificultad auditiva leve','2011-07-30','2025-11-29 12:20:43','tutor'),(33,'Carlos P�rez','carlos@example.com','5551234567','temp123','Juan P�rez','Ninguna','2018-05-10','2025-11-30 14:27:59','alumno'),(34,'David Ortega ','davidortega@gmail.com','9381806668','david1979-','Eliezer ','Ninguna ','2021-05-09','2025-11-30 18:08:49','tutor');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_usuario_insert` AFTER INSERT ON `usuarios` FOR EACH ROW BEGIN
  -- Si es un niño (tiene nino_nombre), asignarle TODAS las materias
  IF NEW.nino_nombre IS NOT NULL AND NEW.nino_nombre != '' THEN
    INSERT INTO nino_materias (nino_id, id_materia, trimestre)
    SELECT NEW.id, id_materia, '1'
    FROM materias;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary view structure for view `vista_certificados_maestro`
--

DROP TABLE IF EXISTS `vista_certificados_maestro`;
/*!50001 DROP VIEW IF EXISTS `vista_certificados_maestro`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_certificados_maestro` AS SELECT 
 1 AS `id`,
 1 AS `alumno_id`,
 1 AS `promedio`,
 1 AS `ciclo`,
 1 AS `maestro_firma`,
 1 AS `creado_en`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'gestion_educativa'
--

--
-- Dumping routines for database 'gestion_educativa'
--
/*!50003 DROP PROCEDURE IF EXISTS `ActualizarPromedios` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `ActualizarPromedios`(IN estudiante_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE mat_id INT;
    DECLARE trim INT;
    DECLARE prom_materia, prom_trimestre, prom_general DECIMAL(5,2);
    
    -- Cursor para materias y trimestres del estudiante
    DECLARE cur CURSOR FOR 
        SELECT DISTINCT t.id_materia, t.trimestre
        FROM entregas_tareas e
        INNER JOIN tareas t ON e.id_tarea = t.id_tarea
        WHERE e.estudiante_id = estudiante_id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO mat_id, trim;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Calcular promedio por materia y trimestre
        SELECT AVG(e.calificacion) INTO prom_materia
        FROM entregas_tareas e
        INNER JOIN tareas t ON e.id_tarea = t.id_tarea
        WHERE e.estudiante_id = estudiante_id 
        AND t.id_materia = mat_id 
        AND t.trimestre = trim;
        
        -- Insertar o actualizar en promedios
        INSERT INTO promedios_calificaciones 
            (estudiante_id, id_materia, trimestre, promedio_materia)
        VALUES (estudiante_id, mat_id, trim, COALESCE(prom_materia, 0))
        ON DUPLICATE KEY UPDATE 
            promedio_materia = COALESCE(prom_materia, 0),
            fecha_actualizacion = CURRENT_TIMESTAMP;
    END LOOP;
    
    CLOSE cur;
    
    -- Calcular promedios por trimestre (todas las materias)
    SELECT AVG(promedio_materia) INTO prom_trimestre
    FROM promedios_calificaciones
    WHERE estudiante_id = estudiante_id AND trimestre = trim;
    
    -- Calcular promedio general (todos los trimestres)
    SELECT AVG(promedio_materia) INTO prom_general
    FROM promedios_calificaciones
    WHERE estudiante_id = estudiante_id;
    
    -- Actualizar promedios generales
    UPDATE promedios_calificaciones
    SET promedio_trimestre = COALESCE(prom_trimestre, 0),
        promedio_general = COALESCE(prom_general, 0)
    WHERE estudiante_id = estudiante_id;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `vista_certificados_maestro`
--

/*!50001 DROP VIEW IF EXISTS `vista_certificados_maestro`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_certificados_maestro` AS select `certificados`.`id` AS `id`,`certificados`.`alumno_id` AS `alumno_id`,`certificados`.`promedio` AS `promedio`,`certificados`.`ciclo` AS `ciclo`,`certificados`.`maestro_firma` AS `maestro_firma`,`certificados`.`creado_en` AS `creado_en` from `certificados` where (`certificados`.`maestro_id` = 16) order by `certificados`.`creado_en` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-16 15:18:31
