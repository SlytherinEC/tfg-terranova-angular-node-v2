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
          { nombre: 'Blaster', danio: 1, precision: 2, municion: 6, municion_max: 6 },
          { nombre: 'Rifle', danio: 2, precision: 1, municion: 4, municion_max: 4 },
          { nombre: 'Lanzallamas', danio: 3, precision: 1, municion: 2, municion_max: 2 }
        ],
        mochila: [],
        mapa: generarMapaInicial(),
        posicion_actual: { x: 3, y: 3 }, // Posición inicial (cámaras congeladas)
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
  }
};

// Función auxiliar para generar el mapa inicial
function generarMapaInicial() {
  // Crear un mapa basado en el diseño del juego original
  // con hexágonos para explorar, puertas bloqueadas, etc.
  // Este es un ejemplo simplificado
  
  const mapa = [];
  
  // Generar 7x7 hexágonos (simplificado para ejemplo)
  for (let y = 0; y < 7; y++) {
    mapa[y] = [];
    for (let x = 0; x < 7; x++) {
      // Determinar tipo de celda basado en coordenadas
      let tipo = 'vacio';
      
      // Celda central: cámaras congeladas (inicio)
      if (x === 3 && y === 3) {
        tipo = 'inicio';
      } 
      // Bordes: espacio exterior (inaccesible)
      else if (x === 0 || x === 6 || y === 0 || y === 6) {
        tipo = 'inaccesible';
      }
      // Celdas especiales
      else if ((x === 1 && y === 1) || (x === 5 && y === 5)) {
        tipo = 'estacion_oxigeno';
      }
      else if (x === 1 && y === 5) {
        tipo = 'armeria';
      }
      else if (x === 5 && y === 1) {
        tipo = 'seguridad';
      }
      else if (x === 2 && y === 4) {
        tipo = 'control';
      }
      else if (x === 4 && y === 2) {
        tipo = 'bahia_carga';
      }
      else if (x === 3 && y === 1) {
        tipo = 'bahia_escape';
      }
      else if ((x === 2 && y === 2) || (x === 4 && y === 4)) {
        tipo = 'evento_aleatorio';
      }
      else {
        tipo = 'explorable';
      }
      
      mapa[y][x] = {
        x,
        y,
        tipo,
        explorado: tipo === 'inicio',
        puerta_bloqueada: false,
        codigos_requeridos: 0
      };
    }
  }
  
  // Añadir puertas bloqueadas
  mapa[1][3].puerta_bloqueada = true;
  mapa[1][3].codigos_requeridos = 6; // Bahía de escape requiere 6 códigos
  
  return mapa;
}

module.exports = Partida;