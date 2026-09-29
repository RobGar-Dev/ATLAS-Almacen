-- ============================================================
-- Migración: agrega las tablas de Solicitudes de Pedido (SOLPED)
-- Correr UNA VEZ contra tu base de datos ya existente:
--   mysql -u root -p atlas_almacen < sql/migration_solicitudes.sql
-- (o impórtalo por phpMyAdmin si usas XAMPP/WAMP: pestaña Importar,
-- elige este archivo, con "atlas_almacen" ya seleccionada a la izquierda)
-- ============================================================

USE atlas_almacen;

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