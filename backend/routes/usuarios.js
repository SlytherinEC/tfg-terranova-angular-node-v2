const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth');
const { registrarUsuario, loginUsuario, obtenerPerfil } = require('../controllers/usuarioController');

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.get('/perfil', verificarToken, obtenerPerfil)

module.exports = router;
