const { Router } = require('express');
const { body } = require('express-validator');
const verificarToken = require('../middlewares/auth.middleware');
const requiereRol = require('../middlewares/role.middleware');
const validar = require('../middlewares/validar.middleware');
const controller = require('../controllers/solicitudes.controller');

const router = Router();

router.use(verificarToken);

const validadoresCrear = [
    body('items').isArray({ min: 1 }).withMessage('Selecciona al menos un producto'),
    body('items.*.productoId').isInt({ min: 1 }).withMessage('Producto inválido'),
    body('items.*.cantidad').isInt({ min: 1 }).withMessage('La cantidad debe ser un entero mayor a 0'),
    body('items.*.urgencia').isIn(['Muy urgente', 'Urgente', 'Programable']).withMessage('Nivel de urgencia inválido'),
];

// Cualquier usuario autenticado (vendedor o admin) puede crear una solicitud.
router.post('/', validadoresCrear, validar, controller.crear);

// Listar queda restringido a administrador — se usará cuando construyamos esa vista.
router.get('/', requiereRol('administrador'), controller.listar);

module.exports = router;