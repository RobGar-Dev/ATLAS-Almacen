const { Router } = require('express');
const verificarToken = require('../middlewares/auth.middleware');
const controller = require('../controllers/movimientos.controller');

const router = Router();

router.use(verificarToken);

// POST /api/movimientos  { productoId, tipo, cantidad, motivo }
router.post('/', controller.registrar);

// GET /api/movimientos?dias=7  (usado por el dashboard del admin)
router.get('/', controller.listarUltimosDias);

// GET /api/movimientos/historial?productoId=&limite=  (modal de historial
// en usuario.html y la sección "Movimientos" de admin.html)
router.get('/historial', controller.listarHistorial);

module.exports = router;