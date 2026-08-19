const { Router } = require('express');
const { body, query } = require('express-validator');
const verificarToken = require('../middlewares/auth.middleware');
const validar = require('../middlewares/validar.middleware');
const controller = require('../controllers/movimientos.controller');

const router = Router();

router.use(verificarToken);

const validadoresMovimiento = [
    body('productoId').isInt({ min: 1 }).withMessage('productoId inválido'),
    body('tipo').isIn(['entrada', 'salida']).withMessage('El tipo debe ser "entrada" o "salida"'),
    body('cantidad').isInt({ min: 1 }).withMessage('La cantidad debe ser un entero mayor a 0'),
    body('motivo').optional({ values: 'falsy' }).trim().isLength({ max: 255 })
        .withMessage('El motivo no puede pasar de 255 caracteres').escape(),
];

// POST /api/movimientos  { productoId, tipo, cantidad, motivo }
router.post('/', validadoresMovimiento, validar, controller.registrar);

// GET /api/movimientos?dias=7  (usado por el dashboard del admin)
router.get('/', query('dias').optional().isInt({ min: 1, max: 90 }), validar, controller.listarUltimosDias);

// GET /api/movimientos/historial?productoId=&limite=  (modal de historial
// en usuario.html y la sección "Movimientos" de admin.html)
router.get(
    '/historial',
    query('productoId').optional().isInt({ min: 1 }),
    query('limite').optional().isInt({ min: 1, max: 500 }),
    validar,
    controller.listarHistorial
);

module.exports = router;