const { Router } = require('express');
const verificarToken = require('../middlewares/auth.middleware');
const requiereRol = require('../middlewares/role.middleware');
const controller = require('../controllers/usuarios.controller');

const router = Router();

// Solo administradores gestionan usuarios (panel admin.html).
router.use(verificarToken, requiereRol('administrador'));

router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.patch('/:id/estado', controller.cambiarEstado);
router.delete('/:id', controller.eliminar);

module.exports = router;
