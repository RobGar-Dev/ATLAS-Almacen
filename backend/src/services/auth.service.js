const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

async function login(usuario, password) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ? LIMIT 1', [usuario]);
    const usuarioDb = rows[0];

    // Mensaje genérico a propósito: no revelar si fue el usuario o la
    // contraseña lo que falló (evita que alguien enumere usuarios válidos).
    if (!usuarioDb) throw new ApiError(401, 'Usuario o contraseña incorrectos');

    const passwordValida = await bcrypt.compare(password, usuarioDb.password_hash);
    if (!passwordValida) throw new ApiError(401, 'Usuario o contraseña incorrectos');

    if (!usuarioDb.activo) throw new ApiError(403, 'Este usuario está desactivado. Contacta a un administrador');

    const token = jwt.sign(
        { id: usuarioDb.id, usuario: usuarioDb.usuario, rol: usuarioDb.rol, nombre: usuarioDb.nombre },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h', algorithm: 'HS256' }
    );

    return {
        token,
        usuario: {
            id: usuarioDb.id,
            nombre: usuarioDb.nombre,
            usuario: usuarioDb.usuario,
            rol: usuarioDb.rol,
        },
    };
}

module.exports = { login };