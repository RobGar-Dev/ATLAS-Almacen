const pool = require('../config/db');

// Una solicitud puede traer varios productos — se inserta todo dentro de
// una transacción para que quede completa o no quede nada (si algo falla
// a la mitad, no quieres una solicitud con solo 2 de 5 productos).
async function crear({ usuarioId, items }) {
    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const [resultadoSolicitud] = await conexion.query(
            'INSERT INTO solicitudes_pedido (usuario_id) VALUES (?)',
            [usuarioId]
        );
        const solicitudId = resultadoSolicitud.insertId;

        for (const item of items) {
            await conexion.query(
                'INSERT INTO solicitud_items (solicitud_id, producto_id, cantidad, urgencia) VALUES (?, ?, ?, ?)',
                [solicitudId, item.productoId, item.cantidad, item.urgencia]
            );
        }

        await conexion.commit();
        return { id: solicitudId, estado: 'pendiente' };

    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
}

// Para la futura vista de admin: cada solicitud con sus productos anidados.
async function listar() {
    const [solicitudes] = await pool.query(
        `SELECT s.id, s.estado, s.fecha, u.nombre AS usuario_nombre
         FROM solicitudes_pedido s
         JOIN usuarios u ON u.id = s.usuario_id
         ORDER BY s.fecha DESC`
    );

    if (solicitudes.length === 0) return [];

    const [items] = await pool.query(
        `SELECT si.solicitud_id, si.cantidad, si.urgencia,
                p.codigo AS producto_codigo, p.nombre AS producto_nombre
         FROM solicitud_items si
         JOIN productos p ON p.id = si.producto_id`
    );

    return solicitudes.map((solicitud) => ({
        ...solicitud,
        items: items.filter((item) => item.solicitud_id === solicitud.id),
    }));
}

module.exports = { crear, listar };