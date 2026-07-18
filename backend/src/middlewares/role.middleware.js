const ApiError = require('../utils/ApiError');

// Uso: router.use(verificarToken, requiereRol('administrador'))
// Debe ir siempre después de verificarToken, ya que depende de req.usuario.
function requiereRol(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return next(new ApiError(403, 'No tienes permisos para realizar esta acción'));
        }
        next();
    };
}

module.exports = requiereRol;
