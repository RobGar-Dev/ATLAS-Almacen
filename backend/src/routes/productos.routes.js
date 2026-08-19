const { Router } = require('express');
const { body, param } = require('express-validator');
const verificarToken = require('../middlewares/auth.middleware');
const validar = require('../middlewares/validar.middleware');
const controller = require('../controllers/productos.controller');

const router = Router();

// Cualquier usuario autenticado (administrador o vendedor) puede
// gestionar productos, tal como en usuario.html.
router.use(verificarToken);

const validadoresProducto = [
    body('codigo').trim().notEmpty().withMessage('El código es obligatorio')
        .isLength({ max: 50 }).withMessage('El código no puede pasar de 50 caracteres').escape(),
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ max: 200 }).withMessage('El nombre no puede pasar de 200 caracteres').escape(),
    body('categoria').trim().notEmpty().withMessage('La categoría es obligatoria')
        .isLength({ max: 100 }).withMessage('La categoría no puede pasar de 100 caracteres').escape(),
    body('stock').isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0'),
];

const validadorId = param('id').isInt({ min: 1 }).withMessage('Id de producto inválido');

router.get('/', controller.listar);
router.post('/', validadoresProducto, validar, controller.crear);
router.put('/:id', validadorId, validadoresProducto, validar, controller.actualizar);
router.delete('/:id', validadorId, validar, controller.eliminar);

module.exports = router;