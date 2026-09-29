const { Router } = require('express');

const authRoutes = require('./auth.routes');
const productosRoutes = require('./productos.routes');
const usuariosRoutes = require('./usuarios.routes');
const movimientosRoutes = require('./movimientos.routes');
const correoRoutes = require('./correo.routes');
const solicitudesRoutes = require('./solicitudes.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/productos', productosRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/movimientos', movimientosRoutes);
router.use('/correo', correoRoutes);
router.use('/solicitudes', solicitudesRoutes);

module.exports = router;