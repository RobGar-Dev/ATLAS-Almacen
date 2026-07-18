const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

async function listar() {
    const [rows] = await pool.query('SELECT * FROM productos ORDER BY nombre ASC');
    return rows;
}

async function obtenerPorId(id) {
    const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    if (!rows[0]) throw new ApiError(404, 'Producto no encontrado');
    return rows[0];
}

async function crear({ codigo, nombre, categoria, stock }) {
    const [existente] = await pool.query('SELECT id FROM productos WHERE codigo = ?', [codigo]);
    if (existente[0]) throw new ApiError(409, 'Ya existe un producto con ese código');

    const [resultado] = await pool.query(
        'INSERT INTO productos (codigo, nombre, categoria, stock) VALUES (?, ?, ?, ?)',
        [codigo, nombre, categoria, stock]
    );

    return obtenerPorId(resultado.insertId);
}

async function actualizar(id, { codigo, nombre, categoria, stock }) {
    await obtenerPorId(id); // lanza 404 si no existe

    const [duplicado] = await pool.query('SELECT id FROM productos WHERE codigo = ? AND id != ?', [codigo, id]);
    if (duplicado[0]) throw new ApiError(409, 'Ya existe otro producto con ese código');

    await pool.query(
        'UPDATE productos SET codigo = ?, nombre = ?, categoria = ?, stock = ? WHERE id = ?',
        [codigo, nombre, categoria, stock, id]
    );

    return obtenerPorId(id);
}

async function eliminar(id) {
    await obtenerPorId(id); // lanza 404 si no existe
    await pool.query('DELETE FROM productos WHERE id = ?', [id]);
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
