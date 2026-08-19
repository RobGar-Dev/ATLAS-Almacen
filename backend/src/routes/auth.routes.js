const { Router } = require('express');
const { body } = require('express-validator');
const { login } = require('../controllers/auth.controller');
const { limiteLogin } = require('../middlewares/rateLimit.middleware');
const validar = require('../middlewares/validar.middleware');

const router = Router();

const validadoresLogin = [
    body('usuario').trim().notEmpty().withMessage('El usuario es obligatorio').escape(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

// POST /api/auth/login  { usuario, password } -> { token, usuario }
// limiteLogin va primero: si ya se agotaron los intentos, ni siquiera
// vale la pena validar ni tocar la base de datos.
router.post('/login', limiteLogin, validadoresLogin, validar, login);

module.exports = router;