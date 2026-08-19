const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Se coloca después de un arreglo de validadores de express-validator en
// cada ruta. Si alguno falló, corta la petición con un 400 y un mensaje
// legible en vez de dejar que llegue mal formada hasta el service/SQL.
function validar(req, res, next) {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
        const primerError = errores.array()[0];
        return next(new ApiError(400, primerError.msg));
    }

    next();
}

module.exports = validar;