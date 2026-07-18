// Middleware de errores: debe registrarse al final de app.js, después
// de todas las rutas. Cualquier error pasado con next(error) llega aquí.
function errorMiddleware(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500
        ? 'Error interno del servidor'
        : err.message;

    if (statusCode === 500) {
        console.error(err); // los errores no esperados sí se registran completos
    }

    res.status(statusCode).json({ success: false, message });
}

module.exports = errorMiddleware;
