// backend/models/Partida.js - versión actualizada
const db = require('../config/db');

const Partida = {
  // Crear una nueva partida
  create: async (id_usuario) => {
    try {
      // Estado inicial del juego
      const { mapa, adyacencias } = generarMapaHexagonal();

      const estadoInicial = {
        capitan: {
          traje: 6,
          estres: 0,
          oxigeno: 10
        },
        pasajeros: 6,
        armas: [
          { nombre: 'Palanca', danio: 1, precision: 1, municion: null, municion_max: null }, // Munición ilimitada
          { nombre: 'Pistola de Plasma', danio: 2, precision: 3, municion: 4, municion_max: 4 },
          { nombre: 'Aguijón', danio: 3, precision: 2, municion: 3, municion_max: 3 },
          { nombre: 'Pistola Laser', danio: 3, precision: 3, municion: 2, municion_max: 2 },
          { nombre: 'Blaster', danio: 4, precision: 2, municion: 2, municion_max: 2 }
        ],
        mochila: [],
        //mapa: generarMapaHexagonal(),
        mapa: mapa,
        adyacencias: adyacencias,
        posicion_actual: { x: 0, y: 0 }, // Posición inicial (el único hex de la fila 1)
        codigos_activacion: 0,
        habitaciones_exploradas: [],
        eventos_completados: [],
        logros: {},
        estado: 'EN_CURSO' // EN_CURSO, VICTORIA, DERROTA
      };

      const [result] = await db.query(
        'INSERT INTO partidas (id_usuario, estado_juego) VALUES (?, ?)',
        [id_usuario, JSON.stringify(estadoInicial)]
      );

      return {
        id_partida: result.insertId,
        ...estadoInicial
      };
    } catch (err) {
      console.error('[ERROR] Fallo al crear partida:', err.message);
      throw err;
    }
  },

  // Obtener partida por ID
  getById: async (id_partida) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM partidas WHERE id_partida = ?',
        [id_partida]
      );

      if (rows.length === 0) return null;

      const partida = rows[0];
      return {
        id_partida: partida.id_partida,
        id_usuario: partida.id_usuario,
        ...JSON.parse(partida.estado_juego),
        fecha_creacion: partida.fecha_creacion,
        fecha_actualizacion: partida.fecha_actualizacion
      };
    } catch (err) {
      console.error('[ERROR] Fallo al obtener partida:', err.message);
      throw err;
    }
  },

  // Obtener partidas de un usuario
  getByUsuario: async (id_usuario) => {
    try {
      const [rows] = await db.query(
        'SELECT id_partida, estado_juego, fecha_creacion, fecha_actualizacion FROM partidas WHERE id_usuario = ? ORDER BY fecha_actualizacion DESC',
        [id_usuario]
      );

      return rows.map(partida => ({
        id_partida: partida.id_partida,
        // Extraer solo la información resumida para listar
        capitan: JSON.parse(partida.estado_juego).capitan,
        codigos_activacion: JSON.parse(partida.estado_juego).codigos_activacion,
        estado: JSON.parse(partida.estado_juego).estado,
        fecha_creacion: partida.fecha_creacion,
        fecha_actualizacion: partida.fecha_actualizacion
      }));
    } catch (err) {
      console.error('[ERROR] Fallo al obtener partidas del usuario:', err.message);
      throw err;
    }
  },

  // Actualizar estado de la partida
  updateEstado: async (id_partida, nuevoEstado) => {
    try {
      const [result] = await db.query(
        'UPDATE partidas SET estado_juego = ? WHERE id_partida = ?',
        [JSON.stringify(nuevoEstado), id_partida]
      );

      return result.affectedRows > 0;
    } catch (err) {
      console.error('[ERROR] Fallo al actualizar estado de partida:', err.message);
      throw err;
    }
  },

  // Obtener solo el mapa de una partida
  getMapById: async (id_partida) => {
    try {
      const [rows] = await db.query(
        'SELECT estado_juego FROM partidas WHERE id_partida = ?',
        [id_partida]
      );

      if (rows.length === 0) return null;

      const estadoJuego = JSON.parse(rows[0].estado_juego);
      return estadoJuego.mapa;
    } catch (err) {
      console.error('[ERROR] Fallo al obtener mapa de partida:', err.message);
      throw err;
    }
  },

  // Actualizar solo el mapa de una partida
  updateMap: async (id_partida, nuevoMapa) => {
    try {
      // Primero obtenemos el estado actual
      const [rows] = await db.query(
        'SELECT estado_juego FROM partidas WHERE id_partida = ?',
        [id_partida]
      );

      if (rows.length === 0) return false;

      const estadoJuego = JSON.parse(rows[0].estado_juego);
      estadoJuego.mapa = nuevoMapa;

      // Actualizamos el estado con el nuevo mapa
      const [result] = await db.query(
        'UPDATE partidas SET estado_juego = ? WHERE id_partida = ?',
        [JSON.stringify(estadoJuego), id_partida]
      );

      return result.affectedRows > 0;
    } catch (err) {
      console.error('[ERROR] Fallo al actualizar mapa de partida:', err.message);
      throw err;
    }
  }
};


// Función para generar el mapa hexagonal con adyacencias explícitas
function generarMapaHexagonal() {
  // Definición del mapa completo con adyacencias explícitas
  const mapDefinition = [
    // Fila 0
    [
      { 
        tipo: 'inicio', 
        coordenadas: {x: 0, y: 0}, 
        adyacentes: [{x: 0, y: 1}, {x: 1, y: 1}]
      }
    ],
    // Fila 1
    [
      { 
        tipo: 'explorable', 
        coordenadas: {x: 0, y: 1}, 
        adyacentes: [{x: 0, y: 0}, {x: 1, y: 1}, {x: 0, y: 2}, {x: 1, y: 2}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 1, y: 1}, 
        adyacentes: [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 2}]
      }
    ],
    // Fila 2
    [
      { 
        tipo: 'explorable', 
        coordenadas: {x: 0, y: 2}, 
        adyacentes: [{x: 0, y: 1}, {x: 1, y: 3}, {x: 1, y: 2}, {x: 0, y: 3}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 1, y: 2}, 
        adyacentes: [{x: 0, y: 1}, {x: 1, y: 1}, {x: 0, y: 2}, {x: 2, y: 2}, {x: 1, y: 3}, {x: 2, y: 3}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 2, y: 2}, 
        adyacentes: [{x: 1, y: 1}, {x: 1, y: 2}, {x: 2, y: 3}, {x: 3, y: 3}]
      }
    ],
    // Fila 3
    [
      { 
        tipo: 'explorable', 
        coordenadas: {x: 0, y: 3}, 
        adyacentes: [{x: 0, y: 2}, {x: 1, y: 3}, {x: 1, y: 4}, {x: 0, y: 4}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 1, y: 3}, 
        adyacentes: [{x: 1, y: 2}, {x: 0, y: 2}, {x: 0, y: 3}, {x: 2, y: 3}, {x: 2, y: 4}, {x: 1, y: 4}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 2, y: 3}, 
        adyacentes: [{x: 1, y: 2}, {x: 2, y: 2}, {x: 1, y: 3}, {x: 3, y: 3}, {x: 3, y: 4}, {x: 2, y: 4}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 3, y: 3}, 
        adyacentes: [{x: 2, y: 2}, {x: 2, y: 3}, {x: 4, y: 4}, {x: 3, y: 4}]
      }
    ],
    // Fila 4
    [
      { 
        tipo: 'explorable', 
        coordenadas: {x: 0, y: 4}, 
        adyacentes: [{x: 0, y: 3}, {x: 1, y: 4}, {x: 0, y: 5}, {x: 1, y: 5}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 1, y: 4}, 
        adyacentes: [{x: 0, y: 3}, {x: 1, y: 3}, {x: 0, y: 4}, {x: 2, y: 4}, {x: 1, y: 5}, {x: 2, y: 5}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 2, y: 4}, 
        adyacentes: [{x: 1, y: 3}, {x: 2, y: 3}, {x: 1, y: 4}, {x: 3, y: 4}, {x: 2, y: 5}, {x: 3, y: 5}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 3, y: 4}, 
        adyacentes: [{x: 2, y: 3}, {x: 3, y: 3}, {x: 2, y: 4}, {x: 4, y: 4}, {x: 3, y: 5}, {x: 4, y: 5}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 4, y: 4}, 
        adyacentes: [{x: 3, y: 3}, {x:3, y: 4}, {x: 4, y: 5}, {x: 5, y: 5}]
      }
    ],
    // Fila 5
    [
      { 
        tipo: 'evento_aleatorio', 
        coordenadas: {x: 0, y: 5}, 
        adyacentes: [{x: 0, y: 4}, {x: 1, y: 6}, {x: 1, y: 5}, {x: 0, y: 6}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 1, y: 5}, 
        adyacentes: [{x: 0, y: 4}, {x: 1, y: 4}, {x: 0, y: 5}, {x: 2, y: 5}, {x: 2, y: 6}, {x: 1, y: 6}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 2, y: 5}, 
        adyacentes: [{x: 1, y: 4}, {x: 2, y: 4}, {x: 1, y: 5}, {x: 3, y: 5}, {x: 3, y: 6}, {x: 2, y: 6}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 3, y: 5}, 
        adyacentes: [{x: 2, y: 4}, {x: 3, y: 4}, {x: 2, y: 5}, {x: 4, y: 5}, {x: 4, y: 6}, {x: 3, y: 6}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 4, y: 5}, 
        adyacentes: [{x: 3, y: 4}, {x: 4, y: 4}, {x: 3, y: 5}, {x: 5, y: 5}, {x: 4, y: 6}, {x: 5, y: 6}]
      },
      { 
        tipo: 'evento_aleatorio', 
        coordenadas: {x: 5, y: 5}, 
        adyacentes: [{x:4, y:4}, {x: 4, y: 5}, {x: 5, y: 6}, {x: 6, y: 6}]
      }
    ],
    // Fila 6
    [
      { 
        tipo: 'explorable', 
        coordenadas: {x: 0, y: 6}, 
        adyacentes: [{x: 0, y: 5}, {x: 1, y: 7}, {x: 1, y: 6}, {x: 0, y: 7}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 1, y: 6}, 
        adyacentes: [{x: 0, y: 5}, {x: 1, y: 5}, {x: 2, y: 7}, {x: 0, y: 6}, {x: 2, y: 6}, {x: 1, y: 7}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 2, y: 6}, 
        adyacentes: [{x: 1, y: 5}, {x: 2, y: 5}, {x: 3, y: 7}, {x: 1, y: 6}, {x: 3, y: 6}, {x: 2, y: 7}]
      },
      { 
        tipo: 'puerta_bloqueada', 
        coordenadas: {x: 3, y: 6}, 
        adyacentes: [{x: 2, y: 5}, {x: 3, y: 5}, {x: 2, y: 6}, {x: 4, y: 6}, {x: 3, y: 7}, {x: 4, y: 7}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 4, y: 6}, 
        adyacentes: [{x: 3, y: 5}, {x: 4, y: 5}, {x: 3, y: 6}, {x: 5, y: 6}, {x: 4, y: 7}, {x: 5, y: 7}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 5, y: 6}, 
        adyacentes: [{x: 4, y: 5}, {x: 5, y: 5}, {x: 4, y: 6}, {x: 6, y: 6}, {x: 5, y: 7}, {x: 6, y: 7}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 6, y: 6}, 
        adyacentes: [{x: 5, y: 5}, {x: 5, y: 6}, {x: 6, y: 7}, {x: 7, y: 7}]
      }
    ],
    // Fila 7
    [
      { 
        tipo: 'explorable', 
        coordenadas: {x: 0, y: 7}, 
        adyacentes: [{x: 0, y: 6}, {x: 1, y: 7}, {x: 1, y: 8}, {x: 2, y: 8}]
      },
      { 
        tipo: 'estacion_oxigeno', 
        coordenadas: {x: 1, y: 7}, 
        adyacentes: [{x: 0, y: 6}, {x: 1, y: 6}, {x: 0, y: 7}, {x: 2, y: 7}, {x: 2, y: 8}, {x: 3, y: 8}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 2, y: 7}, 
        adyacentes: [{x: 1, y: 6}, {x: 2, y: 6}, {x: 1, y: 7}, {x: 3, y: 7}, {x: 3, y: 8}, {x: 4, y: 8}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 3, y: 7}, 
        adyacentes: [{x: 2, y: 6}, {x: 3, y: 6}, {x: 2, y: 7}, {x: 4, y: 7}, {x: 4, y: 8}, {x: 5, y: 8}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 4, y: 7}, 
        adyacentes: [{x: 3, y: 6}, {x: 4, y: 6}, {x: 3, y: 7}, {x: 5, y: 7}, {x: 5, y: 8}, {x: 6, y: 8}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 5, y: 7}, 
        adyacentes: [{x: 4, y: 6}, {x: 5, y: 6}, {x: 4, y: 7}, {x: 6, y: 7}, {x: 6, y: 8}, {x: 7, y: 8}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 6, y: 7}, 
        adyacentes: [{x: 5, y: 6}, {x: 6, y: 6}, {x: 5, y: 7}, {x: 7, y: 7}, {x: 7, y: 8}, {x: 8, y: 8}]
      },
      { 
        tipo: 'puerta_bloqueada', 
        coordenadas: {x: 7, y: 7}, 
        adyacentes: [{x: 6, y: 6}, {x: 6, y: 7}, {x: 8, y: 8}, {x: 9, y: 8}]
      }
    ],
    // Fila 8
    [
      { 
        tipo: 'explorable', 
        coordenadas: {x: 0, y: 8}, 
        adyacentes: [{x: 1, y: 8}, {x: 0, y: 9}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 1, y: 8}, 
        adyacentes: [{x: 0, y: 7}, {x: 0, y: 8}, {x: 2, y: 8}, {x: 0, y: 9}, {x: 1, y: 9}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 2, y: 8}, 
        adyacentes: [{x: 0, y: 7}, {x: 1, y: 7}, {x: 1, y: 8}, {x: 3, y: 8}, {x: 1, y: 9}, {x: 2, y: 9}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 3, y: 8}, 
        adyacentes: [{x: 1, y: 7}, {x: 2, y: 7}, {x: 2, y: 8}, {x: 4, y: 8}, {x: 2, y: 9}, {x: 3, y: 9}]
      },
      { 
        tipo: 'armeria', 
        coordenadas: {x: 4, y: 8}, 
        adyacentes: [{x: 2, y: 7}, {x: 3, y: 7}, {x: 3, y: 8}, {x: 5, y: 8}, {x: 3, y: 9}, {x: 4, y: 9}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 5, y: 8}, 
        adyacentes: [{x: 3, y: 7}, {x: 4, y: 7}, {x: 4, y: 8}, {x: 6, y: 8}, {x: 4, y: 9}, {x: 5, y: 9}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 6, y: 8}, 
        adyacentes: [{x: 4, y: 7}, {x: 5, y: 7}, {x: 5, y: 8}, {x: 7, y: 8}, {x: 5, y: 9}, {x: 6, y: 9}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 7, y: 8}, 
        adyacentes: [{x: 5, y: 7}, {x: 6, y: 7}, {x: 6, y: 8}, {x: 8, y: 8}, {x: 6, y: 9}, {x: 7, y: 9}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 8, y: 8}, 
        adyacentes: [{x: 6, y: 7}, {x: 7, y: 7}, {x: 7, y: 8}, {x: 9, y: 8}, {x: 7, y: 9}, {x: 8, y: 9}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 9, y: 8}, 
        adyacentes: [{x: 7, y: 7}, {x: 8, y: 8}, {x: 10, y: 8}, {x: 8, y: 9}, {x: 9, y: 9}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 10, y: 8}, 
        adyacentes: [{x: 9, y: 8}, {x: 9, y: 9}]
      }
    ],
    // Fila 9
    [
      { 
        tipo: 'puerta_bloqueada', 
        coordenadas: {x: 0, y: 9}, 
        adyacentes: [{x: 0, y: 8}, {x: 1, y: 8}, {x: 1, y: 9}, {x: 0, y: 10}, {x: 1, y: 10}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 1, y: 9}, 
        adyacentes: [{x: 1, y: 8}, {x: 2, y: 8}, {x: 0, y: 9}, {x: 2, y: 9}, {x: 1, y: 10}, {x: 2, y: 10}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 2, y: 9}, 
        adyacentes: [{x: 2, y: 8}, {x: 3, y: 8}, {x: 1, y: 9}, {x: 3, y: 9}, {x: 2, y: 10}, {x: 3, y: 10}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 3, y: 9}, 
        adyacentes: [{x: 3, y: 8}, {x: 4, y: 8}, {x: 2, y: 9}, {x: 4, y: 9}, {x: 3, y: 10}, {x: 4, y: 10}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 4, y: 9}, 
        adyacentes: [{x: 4, y: 8}, {x: 5, y: 8}, {x: 3, y: 9}, {x: 5, y: 9}, {x: 4, y: 10}, {x: 5, y: 10}]
      },
      { 
        tipo: 'evento_aleatorio', 
        coordenadas: {x: 5, y: 9}, 
        adyacentes: [{x: 5, y: 8}, {x: 6, y: 8}, {x: 4, y: 9}, {x: 6, y: 9}, {x: 5, y: 10}, {x: 6, y: 10}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 6, y: 9}, 
        adyacentes: [{x: 6, y: 8}, {x: 7, y: 8}, {x: 5, y: 9}, {x: 7, y: 9}, {x: 6, y: 10}, {x: 7, y: 10}]
      },
      { 
        tipo: 'estacion_oxigeno', 
        coordenadas: {x: 7, y: 9}, 
        adyacentes: [{x: 7, y: 8}, {x: 8, y: 8}, {x: 6, y: 9}, {x: 8, y: 9}, {x: 7, y: 10}, {x: 8, y: 10}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 8, y: 9}, 
        adyacentes: [{x: 8, y: 8}, {x: 9, y: 8}, {x: 7, y: 9}, {x: 9, y: 9}, {x: 8, y: 10}, {x: 9, y: 10}]
      },
      { 
        tipo: 'evento_aleatorio', 
        coordenadas: {x: 9, y: 9}, 
        adyacentes: [{x: 9, y: 8}, {x: 10, y: 8}, {x: 8, y: 9}, {x: 9, y: 10}, {x: 10, y: 10}]
      }
    ],
    // Fila 10
    [
      { 
        tipo: 'explorable', 
        coordenadas: {x: 0, y: 10}, 
        adyacentes: [{x: 0, y: 9}, {x: 1, y: 10}, {x: 0, y: 11}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 1, y: 10}, 
        adyacentes: [{x: 0, y: 9}, {x: 1, y: 9}, {x: 0, y: 10}, {x: 2, y: 10}, {x: 0, y: 11}, {x: 1, y: 11}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 2, y: 10}, 
        adyacentes: [{x: 1, y: 9}, {x: 2, y: 9}, {x: 1, y: 10}, {x: 3, y: 10}, {x: 1, y: 11}, {x: 2, y: 11}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 3, y: 10}, 
        adyacentes: [{x: 2, y: 9}, {x: 3, y: 9}, {x: 2, y: 10}, {x: 4, y: 10}, {x: 2, y: 11}, {x: 3, y: 11}]
      },
      { 
        tipo: 'bahia_carga', 
        coordenadas: {x: 4, y: 10}, 
        adyacentes: [{x: 3, y: 9}, {x: 4, y: 9}, {x: 3, y: 10}, {x: 5, y: 10}, {x: 3, y: 11}, {x: 4, y: 11}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 5, y: 10}, 
        adyacentes: [{x: 4, y: 9}, {x: 5, y: 9}, {x: 4, y: 10}, {x: 6, y: 10}, {x: 4, y: 11}, {x: 5, y: 11}]
      },
      { 
        tipo: 'control', 
        coordenadas: {x: 6, y: 10}, 
        adyacentes: [{x: 5, y: 9}, {x: 6, y: 9}, {x: 5, y: 10}, {x: 7, y: 10}, {x: 5, y: 11}, {x: 6, y: 11}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 7, y: 10}, 
        adyacentes: [{x: 6, y: 9}, {x: 7, y: 9}, {x: 6, y: 10}, {x: 8, y: 10}, {x: 6, y: 11}, {x: 7, y: 11}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 8, y: 10}, 
        adyacentes: [{x: 7, y: 9}, {x: 8, y: 9}, {x: 7, y: 10}, {x: 9, y: 10}, {x: 7, y: 11}, {x: 8, y: 11}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 9, y: 10}, 
        adyacentes: [{x: 8, y: 9}, {x: 9, y: 9}, {x: 8, y: 10}, {x: 10, y: 10}, {x: 8, y: 11}, {x: 9, y: 11}]
      },
      { 
        tipo: 'seguridad', 
        coordenadas: {x: 10, y: 10}, 
        adyacentes: [{x:9, y: 9}, {x: 9, y: 10}, {x: 9, y: 11}]
      }
    ],
    // Fila 11
    [
      { 
        tipo: 'explorable', 
        coordenadas: {x: 0, y: 11}, 
        adyacentes: [{x: 0, y: 10}, {x: 1, y: 10}, {x: 1, y: 11}]
      },
      { 
        tipo: 'evento_aleatorio', 
        coordenadas: {x: 1, y: 11}, 
        adyacentes: [{x: 1, y: 10}, {x: 2, y: 10}, {x: 0, y: 11}, {x: 2, y: 11}, {x: 0, y: 12}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 2, y: 11}, 
        adyacentes: [{x: 2, y: 10}, {x: 3, y: 10}, {x: 1, y: 11}, {x: 3, y: 11}, {x: 0, y: 12}, {x: 1, y: 12}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 3, y: 11}, 
        adyacentes: [{x: 3, y: 10}, {x: 4, y: 10}, {x: 2, y: 11}, {x: 4, y: 11}, {x: 1, y: 12}, {x: 2, y: 12}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 4, y: 11}, 
        adyacentes: [{x: 4, y: 10}, {x: 5, y: 10}, {x: 3, y: 11}, {x: 5, y: 11}, {x: 2, y: 12}, {x: 3, y: 12}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 5, y: 11}, 
        adyacentes: [{x: 5, y: 10}, {x: 6, y: 10}, {x: 4, y: 11}, {x: 6, y: 11}, {x: 3, y: 12}, {x: 4, y: 12}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 6, y: 11}, 
        adyacentes: [{x: 6, y: 10}, {x: 7, y: 10}, {x: 5, y: 11}, {x: 7, y: 11}, {x: 4, y: 12}, {x: 5, y: 12}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 7, y: 11}, 
        adyacentes: [{x: 7, y: 10}, {x: 8, y: 10}, {x: 6, y: 11}, {x: 8, y: 11}, {x: 5, y: 12}, {x: 6, y: 12}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 8, y: 11}, 
        adyacentes: [{x: 8, y: 10}, {x: 9, y: 10}, {x: 7, y: 11}, {x: 9, y: 11}, {x: 6, y: 12}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 9, y: 11}, 
        adyacentes: [{x: 9, y: 10}, {x: 10, y: 10}, {x: 8, y: 11}]
      }
    ],
    // Fila 12
    [
      { 
        tipo: 'explorable', 
        coordenadas: {x: 0, y: 12}, 
        adyacentes: [{x: 1, y: 11}, {x: 2, y: 11}, {x: 1, y: 12}, {x: 0, y: 13}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 1, y: 12}, 
        adyacentes: [{x: 2, y: 11}, {x: 3, y: 11}, {x: 0, y: 12}, {x: 2, y: 12}, {x: 0, y: 13}, {x: 1, y: 13}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 2, y: 12}, 
        adyacentes: [{x: 3, y: 11}, {x: 4, y: 11}, {x: 1, y: 12}, {x: 3, y: 12}, {x: 1, y: 13}, {x: 2, y: 13}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 3, y: 12}, 
        adyacentes: [{x: 4, y: 11}, {x: 5, y: 11}, {x: 2, y: 12}, {x: 4, y: 12}, {x: 2, y: 13}, {x: 3, y: 13}]
      },
      { 
        tipo: 'estacion_oxigeno', 
        coordenadas: {x: 4, y: 12}, 
        adyacentes: [{x: 5, y: 11}, {x: 6, y: 11}, {x: 3, y: 12}, {x: 5, y: 12}, {x: 3, y: 13}, {x: 4, y: 13}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 5, y: 12}, 
        adyacentes: [{x: 6, y: 11}, {x: 7, y: 11}, {x: 4, y: 12}, {x: 6, y: 12}, {x: 4, y: 13}, {x: 5, y: 13}]
      },
      { 
        tipo: 'armeria', 
        coordenadas: {x: 6, y: 12}, 
        adyacentes: [{x: 7, y: 11}, {x: 8, y: 11}, {x: 5, y: 12}, {x: 5, y: 13}] 
      }
    ],
    // Fila 13
    [
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 0, y: 13}, 
        adyacentes: [{x: 0, y: 12}, {x: 1, y: 12}, {x: 1, y: 13}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 1, y: 13}, 
        adyacentes: [{x: 1, y: 12}, {x: 2, y: 12}, {x: 0, y: 13}, {x: 2, y: 13}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 2, y: 13}, 
        adyacentes: [{x: 2, y: 12}, {x: 3, y: 12}, {x: 1, y: 13}, {x: 3, y: 13}, {x: 0, y: 14}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 3, y: 13}, 
        adyacentes: [{x: 3, y: 12}, {x: 4, y: 12}, {x: 2, y: 13}, {x: 4, y: 13}, {x: 0, y: 14}]
      },
      { 
        tipo: 'explorable', 
        coordenadas: {x: 4, y: 13}, 
        adyacentes: [{x: 4, y: 12}, {x: 5, y: 12}, {x: 3, y: 13}, {x: 5, y: 13}]
      },
      { 
        tipo: 'inaccesible', 
        coordenadas: {x: 5, y: 13}, 
        adyacentes: [{x: 5, y: 12}, {x: 6, y: 12}, {x: 4, y: 13}]
      }
    ],
    // Fila 14
    [
      { 
        tipo: 'bahia_escape', 
        coordenadas: {x: 0, y: 14}, 
        adyacentes: [{x: 2, y: 13}, {x: 3, y: 13}]
      }
    ]
  ];

  // Configuración de las puertas bloqueadas
  const puertasBloqueadas = [
    { y: 6, x: 3, codigos: 4 },
    { y: 7, x: 7, codigos: 1 },
    { y: 9, x: 0, codigos: 3 },
    { y: 14, x: 0, codigos: 6 }
  ];

  // Convertir la definición a la estructura de mapa requerida
  const mapa = [];
  const adyacencias = {};

  for (let y = 0; y < mapDefinition.length; y++) {
    const fila = [];
    const definicionesFila = mapDefinition[y];

    for (let i = 0; i < definicionesFila.length; i++) {
      const def = definicionesFila[i];
      const {tipo, coordenadas, adyacentes} = def;
      const x = coordenadas.x;

      // Verificar si esta celda es una puerta bloqueada
      const esPuerta = tipo === 'puerta_bloqueada' ||
                       (tipo === 'bahia_escape' && y === 14 && x === 0);

      let codigosRequeridos = 0;
      if (esPuerta) {
        // Encontrar cuántos códigos requiere esta puerta
        const puerta = puertasBloqueadas.find(p => p.y === y && p.x === x);
        codigosRequeridos = puerta ? puerta.codigos : 0;
      }

      // Crear celda
      const celda = {
        x,
        y,
        tipo,
        explorado: tipo === 'inicio',  // Solo el inicio está explorado inicialmente
        puerta_bloqueada: esPuerta,
        codigos_requeridos: codigosRequeridos
      };

      fila.push(celda);

      // Guardar adyacencias
      const key = `${x},${y}`;
      adyacencias[key] = adyacentes;
    }

    mapa.push(fila);
  }

  return { mapa, adyacencias };
}

function calcularAdyacencias(mapa) {
  const adyacencias = {};

  // Para cada celda en el mapa
  for (let y = 0; y < mapa.length; y++) {
    for (let i = 0; i < mapa[y].length; i++) {
      const celda = mapa[y][i];
      const key = `${celda.x},${celda.y}`;
      adyacencias[key] = [];

      // Determinar vecinos basados en si la fila es par o impar
      const esFilaPar = celda.y % 2 === 0;

      // Coordenadas relativas de los vecinos según la paridad de la fila
      // En un sistema hexagonal offset, cada celda tiene exactamente 6 vecinos
      const vecinosRelativos = esFilaPar ? [
        { dx: -1, dy: 0 },  // Izquierda
        { dx: 1, dy: 0 },   // Derecha
        { dx: -1, dy: -1 }, // Arriba-izquierda
        { dx: 0, dy: -1 },  // Arriba-derecha
        { dx: -1, dy: 1 },  // Abajo-izquierda
        { dx: 0, dy: 1 }    // Abajo-derecha
      ] : [
        { dx: -1, dy: 0 },  // Izquierda
        { dx: 1, dy: 0 },   // Derecha
        { dx: 0, dy: -1 },  // Arriba-izquierda
        { dx: 1, dy: -1 },  // Arriba-derecha
        { dx: 0, dy: 1 },   // Abajo-izquierda
        { dx: 1, dy: 1 }    // Abajo-derecha
      ];

      // Comprobar cada vecino potencial
      for (const dir of vecinosRelativos) {
        const nx = celda.x + dir.dx;
        const ny = celda.y + dir.dy;

        // Verificar que las coordenadas estén dentro del mapa
        if (ny >= 0 && ny < mapa.length) {
          // Buscar si existe una celda con estas coordenadas
          const celdaExiste = mapa[ny].some(c => c.x === nx && c.y === ny);
          if (celdaExiste) {
            adyacencias[key].push({ x: nx, y: ny });
          }
        }
      }
    }
  }

  return adyacencias;
}
module.exports = Partida;