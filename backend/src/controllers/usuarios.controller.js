const asyncHandler = require('../utils/asyncHandler');
const usuariosService = require('../services/usuarios.service');

const listar = asyncHandler(async (req, res) => {
    const usuarios = await usuariosService.listar();
    res.json({ success: true, usuarios });
});

const crear = asyncHandler(async (req, res) => {
    const usuario = await usuariosService.crear(req.body);
    res.status(201).json({ success: true, usuario });
});

const actualizar = asyncHandler(async (req, res) => {
    const usuario = await usuariosService.actualizar(req.params.id, req.body);
    res.json({ success: true, usuario });
});

const cambiarEstado = asyncHandler(async (req, res) => {
    await usuariosService.cambiarEstado(req.params.id, Boolean(req.body.activo));
    res.json({ success: true, message: 'Estado actualizado' });
});

const eliminar = asyncHandler(async (req, res) => {
    await usuariosService.eliminar(req.params.id);
    res.json({ success: true, message: 'Usuario eliminado' });
});

module.exports = { listar, crear, actualizar, cambiarEstado, eliminar };
