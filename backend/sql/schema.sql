-- ============================================================
-- Almacén ATLAS — esquema de base de datos (MySQL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS atlas_almacen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE atlas_almacen;

-- ---------- Usuarios (login, roles) ----------
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('administrador', 'vendedor') NOT NULL DEFAULT 'vendedor',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Productos ----------
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------- Movimientos de entrada / salida ----------
CREATE TABLE IF NOT EXISTS movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    tipo ENUM('entrada', 'salida') NOT NULL,
    cantidad INT NOT NULL,
    motivo VARCHAR(255),
    usuario_id INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices útiles para los filtros y el dashboard
CREATE INDEX idx_productos_categoria ON productos (categoria);
CREATE INDEX idx_movimientos_fecha ON movimientos (fecha);

-- ---------- Solicitudes de pedido (SOLPED) ----------
-- Un vendedor arma una solicitud con uno o más productos; el admin la
-- revisa después (esa vista de admin se agrega en un paso posterior).
CREATE TABLE IF NOT EXISTS solicitudes_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS solicitud_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    urgencia ENUM('Muy urgente', 'Urgente', 'Programable') NOT NULL,
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes_pedido(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE INDEX idx_solicitudes_estado ON solicitudes_pedido (estado);
CREATE INDEX idx_solicitud_items_solicitud ON solicitud_items (solicitud_id);