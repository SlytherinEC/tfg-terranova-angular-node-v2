// backend/routes/game.js - Actualizado
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth');
const gameController = require('../controllers/gameController');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Rutas de gestión de partidas
router.post('/nueva', gameController.nuevaPartida);
router.get('/partidas', gameController.obtenerPartidas);
router.get('/partidas/:id_partida', gameController.obtenerPartida);

// Nuevas rutas para el mapa
router.get('/mapas/:id_partida', gameController.obtenerMapa);
router.put('/mapas/:id_partida', gameController.actualizarMapa);

// Rutas de acciones de juego
router.post('/partidas/:id_partida/explorar', gameController.explorarHabitacion);
router.post('/partidas/:id_partida/combate', gameController.resolverCombate);
router.post('/partidas/:id_partida/sacrificar', gameController.sacrificarPasajero);
router.post('/partidas/:id_partida/usar-item', gameController.usarItem);
router.post('/partidas/:id_partida/resolver-evento', gameController.resolverEvento);

module.exports = router;