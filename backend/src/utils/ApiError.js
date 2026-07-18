// Error controlado con código HTTP. Los services lanzan esto cuando algo
// sale mal por una razón esperada (no encontrado, duplicado, sin permiso...)
// y el error.middleware lo convierte en una respuesta JSON consistente.
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

module.exports = ApiError;
