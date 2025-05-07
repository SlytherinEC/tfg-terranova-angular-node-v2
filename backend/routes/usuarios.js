// File: backend/routes/usuarios.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth');
const { registrarUsuario, loginUsuario, obtenerPerfil, actualizarPerfil, refrescarToken, cambiarContrasena } = require('../controllers/usuarioController');

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);
router.patch('/cambiar-contrasena', verificarToken, cambiarContrasena);
router.post('/refresh', refrescarToken); // Ruta para refrescar el token

module.exports = router;
