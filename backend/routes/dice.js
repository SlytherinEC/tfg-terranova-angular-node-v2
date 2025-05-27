// backend/routes/dice.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth');
const diceController = require('../controllers/diceController');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Rutas de dados
router.post('/roll', diceController.rollDice);
router.post('/roll-for-action', diceController.rollForAction);

module.exports = router;