const asyncHandler = require('../utils/asyncHandler');
const productosService = require('../services/productos.service');

const listar = asyncHandler(async (req, res) => {
    const productos = await productosService.listar();
    res.json({ success: true, productos });
});

const crear = asyncHandler(async (req, res) => {
    const producto = await productosService.crear(req.body);
    res.status(201).json({ success: true, producto });
});

const actualizar = asyncHandler(async (req, res) => {
    const producto = await productosService.actualizar(req.params.id, req.body);
    res.json({ success: true, producto });
});

const eliminar = asyncHandler(async (req, res) => {
    await productosService.eliminar(req.params.id);
    res.json({ success: true, message: 'Producto eliminado' });
});

module.exports = { listar, crear, actualizar, eliminar };
