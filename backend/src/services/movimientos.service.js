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

module.exports = { registrar, listarUltimosDias };
