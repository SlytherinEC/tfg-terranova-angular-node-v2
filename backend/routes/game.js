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

// Rutas para encuentros interactivos
router.post('/partidas/:id_partida/encuentro-tirar-dado', gameController.encuentroTirarDado);
router.post('/partidas/:id_partida/encuentro-resolver', gameController.encuentroResolver);

// NUEVAS RUTAS PARA COMBATE AVANZADO
router.post('/partidas/:id_partida/combate-avanzado/iniciar', gameController.iniciarCombateAvanzado);
router.post('/partidas/:id_partida/combate-avanzado/seleccionar-arma', gameController.seleccionarArmaEnCombate);
router.post('/partidas/:id_partida/combate-avanzado/lanzar-dados', gameController.lanzarDadosEnCombate);
router.post('/partidas/:id_partida/combate-avanzado/avanzar-uso-estres', gameController.avanzarAUsoEstres);
router.post('/partidas/:id_partida/combate-avanzado/usar-estres', gameController.usarEstresEnCombateAvanzado);
router.post('/partidas/:id_partida/combate-avanzado/continuar', gameController.continuarCombateAvanzado);
router.post('/partidas/:id_partida/combate-avanzado/usar-item', gameController.usarItemEnCombateAvanzado);
router.post('/partidas/:id_partida/combate-avanzado/sacrificar-pasajero', gameController.sacrificarPasajeroEnCombateAvanzado);
router.get('/partidas/:id_partida/combate-avanzado/estado', gameController.obtenerEstadoCombate);
router.post('/partidas/:id_partida/combate-avanzado/finalizar', gameController.finalizarCombate);

// Rutas de información de combate
router.get('/armas', gameController.obtenerArmasDisponibles);
router.get('/aliens/:tipo_alien', gameController.obtenerInfoAlien);
router.get('/partidas/:id_partida/logros-combate', gameController.obtenerLogrosCombate);

module.exports = router;