const asyncHandler = require('../utils/asyncHandler');
const correoService = require('../services/correo.service');

const enviarCompras = asyncHandler(async (req, res) => {
    const { productos, motivo, urgencia } = req.body;

    await correoService.enviarRequisicionCompras({
        productos,
        motivo,
        urgencia,
        remitente: req.usuario.usuario,
    });

    res.json({ success: true, message: 'Correo enviado correctamente' });
});

module.exports = { enviarCompras };