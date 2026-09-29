const asyncHandler = require('../utils/asyncHandler');
const solicitudesService = require('../services/solicitudes.service');

const crear = asyncHandler(async (req, res) => {
    const { items } = req.body;

    const solicitud = await solicitudesService.crear({
        usuarioId: req.usuario.id,
        items,
    });

    res.status(201).json({ success: true, solicitud });
});

const listar = asyncHandler(async (req, res) => {
    const solicitudes = await solicitudesService.listar();
    res.json({ success: true, solicitudes });
});

module.exports = { crear, listar };