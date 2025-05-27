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
// router.get('/mapas/:id_partida', gameController.obtenerMapa);
// router.put('/mapas/:id_partida', gameController.actualizarMapa);

// Rutas de acciones de juego
router.post('/partidas/:id_partida/explorar', gameController.explorarHabitacion);
router.post('/partidas/:id_partida/combate', gameController.resolverCombate);
router.post('/partidas/:id_partida/sacrificar', gameController.sacrificarPasajero);
router.post('/partidas/:id_partida/usar-item', gameController.usarItem);
router.post('/partidas/:id_partida/resolver-evento', gameController.resolverEvento);

// Nuevas rutas
router.post('/partidas/:id_partida/usar-estres', gameController.usarEstres);
router.get('/partidas/:id_partida/logros', gameController.obtenerLogros);
router.get('/partidas/:id_partida/estadisticas', gameController.obtenerEstadisticas);

// Rutas de gestión de la armería
router.post('/partidas/:id_partida/resolver-armeria', gameController.resolverArmeria);

// Rutas para la exploración interactiva
router.post('/partidas/:id_partida/explorar-tirar-dado', gameController.explorarTirarDado);
router.post('/partidas/:id_partida/explorar-resolver', gameController.explorarResolver);

// Rutas para la revisita interactiva
router.post('/partidas/:id_partida/revisitar-tirar-dado', gameController.revisitarTirarDado);
router.post('/partidas/:id_partida/revisitar-resolver', gameController.revisitarResolver);

module.exports = router;