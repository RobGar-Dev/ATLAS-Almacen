const { Router } = require('express');
const verificarToken = require('../middlewares/auth.middleware');
const controller = require('../controllers/correo.controller');

const router = Router();

router.use(verificarToken);

// POST /api/correo/compras  { productos: [...] }
router.post('/compras', controller.enviarCompras);

module.exports = router;
