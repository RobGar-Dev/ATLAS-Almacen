const { Router } = require('express');
const { body, param } = require('express-validator');
const verificarToken = require('../middlewares/auth.middleware');
const requiereRol = require('../middlewares/role.middleware');
const validar = require('../middlewares/validar.middleware');
const controller = require('../controllers/usuarios.controller');

const router = Router();

// Solo administradores gestionan usuarios (panel admin.html).
router.use(verificarToken, requiereRol('administrador'));

const validadorId = param('id').isInt({ min: 1 }).withMessage('Id de usuario inválido');

const camposComunes = [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ max: 150 }).withMessage('El nombre no puede pasar de 150 caracteres').escape(),
    body('usuario').trim().notEmpty().withMessage('El usuario es obligatorio')
        .isLength({ min: 3, max: 100 }).withMessage('El usuario debe tener entre 3 y 100 caracteres')
        .matches(/^[a-zA-Z0-9._-]+$/).withMessage('El usuario solo puede tener letras, números, puntos, guiones y guion bajo'),
    body('rol').isIn(['administrador', 'vendedor']).withMessage('El rol debe ser "administrador" o "vendedor"'),
];

const validadoresCrear = [
    ...camposComunes,
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
];

const validadoresEditar = [
    ...camposComunes,
    // Al editar, la contraseña es opcional — pero si viene, debe cumplir la misma política.
    body('password').optional({ values: 'falsy' })
        .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
];

const validadorEstado = body('activo').isBoolean().withMessage('El campo "activo" debe ser verdadero o falso');

router.get('/', controller.listar);
router.post('/', validadoresCrear, validar, controller.crear);
router.put('/:id', validadorId, validadoresEditar, validar, controller.actualizar);
router.patch('/:id/estado', validadorId, validadorEstado, validar, controller.cambiarEstado);
router.delete('/:id', validadorId, validar, controller.eliminar);

module.exports = router;