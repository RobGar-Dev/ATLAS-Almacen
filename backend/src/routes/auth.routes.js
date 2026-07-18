const { Router } = require('express');
const { login } = require('../controllers/auth.controller');

const router = Router();

// POST /api/auth/login  { usuario, password } -> { token, usuario }
router.post('/login', login);

module.exports = router;
