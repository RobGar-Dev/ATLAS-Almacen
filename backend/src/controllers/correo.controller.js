const asyncHandler = require('../utils/asyncHandler');
const correoService = require('../services/correo.service');
const ApiError = require('../utils/ApiError');

const NIVELES_URGENCIA_VALIDOS = ['Muy urgente', 'Urgente', 'Programable'];

const enviarCompras = asyncHandler(async (req, res) => {
    const { productos, motivo, urgencia } = req.body;

    if (!Array.isArray(productos) || productos.length === 0) {
        throw new ApiError(400, 'Debes incluir al menos un producto en la requisición');
    }

    if (!NIVELES_URGENCIA_VALIDOS.includes(urgencia)) {
        throw new ApiError(400, 'El nivel de urgencia no es válido');
    }

    await correoService.enviarRequisicionCompras({
        productos,
        motivo,
        urgencia,
        remitente: req.usuario.usuario,
    });

    res.json({ success: true, message: 'Correo enviado correctamente' });
});

module.exports = { enviarCompras };