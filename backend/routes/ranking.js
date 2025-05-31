const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');
const { verificarToken } = require('../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Obtener ranking global
router.get('/', rankingController.obtenerRanking);

module.exports = router; 