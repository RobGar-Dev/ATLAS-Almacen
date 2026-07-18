// Envuelve un controller async: si la promesa rechaza, el error se
// pasa a next(error) automáticamente en vez de necesitar try/catch
// en cada controller.
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
