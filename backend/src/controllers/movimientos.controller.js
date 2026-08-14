const asyncHandler = require('../utils/asyncHandler');
const movimientosService = require('../services/movimientos.service');

const registrar = asyncHandler(async (req, res) => {
    const { productoId, tipo, cantidad, motivo } = req.body;

    const movimiento = await movimientosService.registrar({
        productoId,
        tipo,
        cantidad,
        motivo,
        usuarioId: req.usuario.id, // viene del token, no del body
    });

    res.status(201).json({ success: true, movimiento });
});

const listarUltimosDias = asyncHandler(async (req, res) => {
    const dias = Number(req.query.dias) || 7;
    const movimientos = await movimientosService.listarUltimosDias(dias);
    res.json({ success: true, movimientos });
});

const listarHistorial = asyncHandler(async (req, res) => {
    const { productoId, limite } = req.query;
    const movimientos = await movimientosService.listarHistorial({ productoId, limite });
    res.json({ success: true, movimientos });
});

module.exports = { registrar, listarUltimosDias, listarHistorial };