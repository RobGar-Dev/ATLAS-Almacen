const { Router } = require('express');
const verificarToken = require('../middlewares/auth.middleware');
const controller = require('../controllers/productos.controller');

const router = Router();

// Cualquier usuario autenticado (administrador o vendedor) puede
// gestionar productos, tal como en usuario.html.
router.use(verificarToken);

router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;
