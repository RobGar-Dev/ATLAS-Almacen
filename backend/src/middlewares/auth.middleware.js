const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

// Verifica el header "Authorization: Bearer <token>" y adjunta el usuario
// decodificado a req.usuario para que los controllers/services lo usen.
function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new ApiError(401, 'No se proporcionó un token de autenticación'));
    }

    const token = authHeader.split(' ')[1];

    try {
        // Sin "algorithms" explícito, jwt.verify acepta cualquier
        // algoritmo que el propio token declare en su header — eso abre
        // la puerta a ataques de "algorithm confusion". Se fija HS256,
        // que es el único que usa este backend para firmar.
        const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        req.usuario = payload; // { id, usuario, rol }
        next();
    } catch (error) {
        next(new ApiError(401, 'Token inválido o expirado'));
    }
}

module.exports = verificarToken;