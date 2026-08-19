const bcrypt = require('bcrypt');
const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 12; // 10 es el mínimo razonable en 2026; 12 da más margen sin ser perceptible al usuario

async function listar() {
    const [rows] = await pool.query(
        'SELECT id, nombre, usuario, rol, activo, created_at FROM usuarios ORDER BY nombre ASC'
    );
    return rows;
}

async function crear({ nombre, usuario, password, rol }) {
    const [existente] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
    if (existente[0]) throw new ApiError(409, 'Ese nombre de usuario ya existe');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [resultado] = await pool.query(
        'INSERT INTO usuarios (nombre, usuario, password_hash, rol, activo) VALUES (?, ?, ?, ?, TRUE)',
        [nombre, usuario, passwordHash, rol]
    );

    return { id: resultado.insertId, nombre, usuario, rol, activo: true };
}

async function actualizar(id, { nombre, usuario, rol, password }) {
    const [duplicado] = await pool.query('SELECT id FROM usuarios WHERE usuario = ? AND id != ?', [usuario, id]);
    if (duplicado[0]) throw new ApiError(409, 'Ese nombre de usuario ya existe');

    // La contraseña es opcional al editar: si no se manda (o viene vacía),
    // se deja la que ya tenía. Si se manda, se vuelve a hashear.
    if (password) {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const [resultado] = await pool.query(
            'UPDATE usuarios SET nombre = ?, usuario = ?, rol = ?, password_hash = ? WHERE id = ?',
            [nombre, usuario, rol, passwordHash, id]
        );
        if (resultado.affectedRows === 0) throw new ApiError(404, 'Usuario no encontrado');
    } else {
        const [resultado] = await pool.query(
            'UPDATE usuarios SET nombre = ?, usuario = ?, rol = ? WHERE id = ?',
            [nombre, usuario, rol, id]
        );
        if (resultado.affectedRows === 0) throw new ApiError(404, 'Usuario no encontrado');
    }

    return { id: Number(id), nombre, usuario, rol };
}

async function cambiarEstado(id, activo) {
    const [resultado] = await pool.query('UPDATE usuarios SET activo = ? WHERE id = ?', [activo, id]);
    if (resultado.affectedRows === 0) throw new ApiError(404, 'Usuario no encontrado');
}

async function eliminar(id) {
    const [resultado] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) throw new ApiError(404, 'Usuario no encontrado');
}

module.exports = { listar, crear, actualizar, cambiarEstado, eliminar };