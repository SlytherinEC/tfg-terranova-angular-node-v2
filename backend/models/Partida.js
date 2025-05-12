// backend/models/Partida.js - versión actualizada
const db = require('../config/db');

const Partida = {
  // Crear una nueva partida
  create: async (id_usuario) => {
    try {
      // Estado inicial del juego
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
        mapa: generarMapaHexagonal(),
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

// Función auxiliar para generar el mapa inicial hexagonal
function generarMapaHexagonal() {
  // Estructura de filas hexagonales definidas según los requisitos
  const hexesPerRow = [1, 2, 3, 4, 5, 6, 7, 8, 11, 10, 11, 10, 7, 6, 1];
  
  // Mapeo de los tipos de celdas por fila
  const mapDefinition = [
    ['inicio'],
    ['explorable', 'explorable'],
    ['explorable', 'explorable', 'explorable'],
    ['explorable', 'explorable', 'explorable', 'explorable'],
    ['explorable', 'explorable', 'explorable', 'explorable', 'explorable'],
    ['evento_aleatorio', 'inaccesible', 'explorable', 'explorable', 'explorable', 'evento_aleatorio'],
    ['explorable', 'explorable', 'inaccesible', 'puerta_bloqueada', 'inaccesible', 'explorable', 'explorable'],
    ['explorable', 'estacion_oxigeno', 'inaccesible', 'explorable', 'explorable', 'inaccesible', 'inaccesible', 'puerta_bloqueada'],
    ['explorable', 'explorable', 'explorable', 'inaccesible', 'armeria', 'explorable', 'explorable', 'inaccesible', 'explorable', 'explorable', 'inaccesible'],
    ['puerta_bloqueada', 'explorable', 'inaccesible', 'inaccesible', 'inaccesible', 'evento_aleatorio', 'inaccesible', 'estacion_oxigeno', 'explorable', 'evento_aleatorio'],
    ['explorable', 'inaccesible', 'inaccesible', 'explorable', 'bahia_carga', 'inaccesible', 'control', 'inaccesible', 'explorable', 'explorable', 'seguridad'],
    ['explorable', 'evento_aleatorio', 'explorable', 'explorable', 'explorable', 'inaccesible', 'inaccesible', 'explorable', 'explorable', 'explorable'],
    ['explorable', 'explorable', 'explorable', 'explorable', 'estacion_oxigeno', 'inaccesible', 'armeria'],
    ['inaccesible', 'explorable', 'explorable', 'explorable', 'explorable', 'inaccesible'],
    ['bahia_escape']
  ];
  
  // Configuración de las puertas bloqueadas
  const puertasBloqueadas = [
    { y: 6, x: 3, codigos: 4 },
    { y: 7, x: 7, codigos: 1 },
    { y: 9, x: 0, codigos: 3 },
    { y: 14, x: 0, codigos: 6 }
  ];
  
  // Mapa final
  const mapa = [];
  
  for (let y = 0; y < mapDefinition.length; y++) {
    const row = [];
    const rowDef = mapDefinition[y];
    
    for (let x = 0; x < rowDef.length; x++) {
      const tipo = rowDef[x];
      
      // Verificar si esta celda es una puerta bloqueada
      const esPuerta = tipo === 'puerta_bloqueada' || 
                       (tipo === 'bahia_escape' && y === 14 && x === 0);
      
      let codigosRequeridos = 0;
      
      if (esPuerta) {
        // Encontrar cuántos códigos requiere esta puerta
        const puerta = puertasBloqueadas.find(p => p.y === y && p.x === x);
        codigosRequeridos = puerta ? puerta.codigos : 0;
      }
      
      const cell = {
        x,
        y,
        tipo,
        explorado: tipo === 'inicio',  // Solo el inicio está explorado inicialmente
        puerta_bloqueada: esPuerta,
        codigos_requeridos: codigosRequeridos
      };
      
      row.push(cell);
    }
    
    mapa.push(row);
  }
  
  return mapa;
}

module.exports = Partida;