const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

// Usa una transacción con bloqueo de fila (FOR UPDATE) para que, si dos
// personas registran un movimiento del mismo producto casi al mismo
// tiempo, el stock se calcule sobre el valor correcto y no se pisen entre sí.
async function registrar({ productoId, tipo, cantidad, motivo, usuarioId }) {
    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const [rows] = await conexion.query('SELECT * FROM productos WHERE id = ? FOR UPDATE', [productoId]);
        const producto = rows[0];
        if (!producto) throw new ApiError(404, 'Producto no encontrado');

        const nuevoStock = tipo === 'entrada'
            ? producto.stock + cantidad
            : producto.stock - cantidad;

        if (nuevoStock < 0) throw new ApiError(400, 'No hay stock suficiente para esta salida');

        await conexion.query('UPDATE productos SET stock = ? WHERE id = ?', [nuevoStock, productoId]);

        const [resultado] = await conexion.query(
            'INSERT INTO movimientos (producto_id, tipo, cantidad, motivo, usuario_id) VALUES (?, ?, ?, ?, ?)',
            [productoId, tipo, cantidad, motivo || null, usuarioId]
        );

        await conexion.commit();

        return { id: resultado.insertId, productoId, tipo, cantidad, motivo, nuevoStock };
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
}

// Para la gráfica de "movimientos de los últimos N días" del dashboard.
async function listarUltimosDias(dias = 7) {
    const [rows] = await pool.query(
        `SELECT DATE(fecha) AS dia, tipo, SUM(cantidad) AS total
         FROM movimientos
         WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY DATE(fecha), tipo
         ORDER BY dia ASC`,
        [dias]
    );
    return rows;
}

// Historial detallado (fecha y hora, producto, tipo, cantidad, motivo,
// quién lo registró) — para el modal de usuario.html y la sección de
// movimientos de admin.html. Se puede filtrar por producto opcionalmente.
async function listarHistorial({ productoId, limite = 200 } = {}) {
    const condiciones = [];
    const valores = [];

    if (productoId) {
        condiciones.push('m.producto_id = ?');
        valores.push(productoId);
    }

    const whereClause = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    valores.push(Number(limite) || 200);

    const [rows] = await pool.query(
        `SELECT
            m.id,
            m.tipo,
            m.cantidad,
            m.motivo,
            m.fecha,
            p.codigo AS producto_codigo,
            p.nombre AS producto_nombre,
            u.nombre AS usuario_nombre
         FROM movimientos m
         JOIN productos p ON p.id = m.producto_id
         JOIN usuarios u ON u.id = m.usuario_id
         ${whereClause}
         ORDER BY m.fecha DESC
         LIMIT ?`,
        valores
    );

    return rows;
}

module.exports = { registrar, listarUltimosDias, listarHistorial };