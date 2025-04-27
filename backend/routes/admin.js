const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

router.use(verificarToken, soloAdmin); // Se aplica a todas las rutas de este archivo

// Rutas de gestión de usuarios
router.get('/usuarios', adminController.getUsuarios);
router.get('/usuarios/:id', adminController.getUsuarioById);
router.post('/usuarios', adminController.crearUsuario);
router.put('/usuarios/:id', adminController.actualizarUsuario);
router.patch('/usuarios/:id/contrasena', adminController.cambiarContrasena);
router.delete('/usuarios/:id', adminController.eliminarUsuario);

// Ruta para estadísticas
router.get('/estadisticas/usuarios', adminController.getEstadisticasUsuarios);

module.exports = router;