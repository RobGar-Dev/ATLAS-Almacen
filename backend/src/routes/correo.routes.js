const { Router } = require('express');
const { body } = require('express-validator');
const verificarToken = require('../middlewares/auth.middleware');
const validar = require('../middlewares/validar.middleware');
const controller = require('../controllers/correo.controller');

const router = Router();

router.use(verificarToken);

const validadoresCorreo = [
    body('productos').isArray({ min: 1 }).withMessage('Debes incluir al menos un producto en la requisición'),
    body('productos.*.nombre').trim().notEmpty().withMessage('Cada producto necesita un nombre').escape(),
    body('productos.*.cantidadSolicitada').isInt({ min: 1 }).withMessage('La cantidad solicitada debe ser un entero mayor a 0'),
    body('motivo').optional({ values: 'falsy' }).trim().isLength({ max: 500 })
        .withMessage('El motivo no puede pasar de 500 caracteres').escape(),
    body('urgencia').isIn(['Muy urgente', 'Urgente', 'Programable']).withMessage('El nivel de urgencia no es válido'),
];

// POST /api/correo/compras  { productos: [...], motivo, urgencia }
router.post('/compras', validadoresCorreo, validar, controller.enviarCompras);

module.exports = router;