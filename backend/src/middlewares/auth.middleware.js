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
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = payload; // { id, usuario, rol }
        next();
    } catch (error) {
        next(new ApiError(401, 'Token inválido o expirado'));
    }
}

module.exports = verificarToken;
