-- 
DROP DATABASE IF EXISTS terranova;

-- Crear base de datos y seleccionarla
CREATE DATABASE terranova;
USE terranova;

-- Crear tabla roles
CREATE TABLE roles (
  id_rol INT(11) NOT NULL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL
);

--
-- Volcado de datos para la tabla roles
--
INSERT INTO roles (id_rol, nombre) VALUES
(1, 'admin'),
(2, 'usuario');

-- Crear tabla usuarios
CREATE TABLE usuarios (
  id_usuario INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  id_rol INT(11) NOT NULL,
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  image VARCHAR(255) NOT NULL DEFAULT 'default_user.png',
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE
);

--
-- Volcado de datos para la tabla usuarios
--
INSERT INTO usuarios ( nombre, email, contrasena, id_rol, fecha_registro, image) VALUES
('SlytherinEC', 'yborges2005@gmail.com', '$2b$10$QUFNqx9wFsOkI8Z0HEx9.uzb29lol8XO61HAy9VF8J/sH3l9r1Swi', 1, '2025-04-13 20:02:15', 'default_user.png');

--

CREATE TABLE `partidas` (
  `id_partida` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id_usuario` int(11) NOT NULL,
  `estado_juego` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`estado_juego`)),
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);


