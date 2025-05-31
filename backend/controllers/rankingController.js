const Usuario = require('../models/Usuario');
const Partida = require('../models/Partida');

// Función auxiliar para contar logros de una partida
const contarLogros = (logros) => {
  if (!logros || typeof logros !== 'object') return 0;
  return Object.values(logros).filter(Boolean).length;
};

// Función auxiliar para calcular el rango basado en logros
const calcularRango = (totalLogros) => {
  if (totalLogros >= 9) return 'GENERAL';
  if (totalLogros >= 8) return 'ALMIRANTE';
  if (totalLogros >= 6) return 'MAYOR';
  if (totalLogros >= 4) return 'CAPITAN';
  if (totalLogros >= 2) return 'OFICIAL';
  return 'CADETE';
};

// Función para calcular los logros de todas las partidas de un usuario
const calcularLogrosUsuario = async (id_usuario) => {
  try {
    // Obtener todas las partidas del usuario
    const partidas = await Partida.getByUsuarioCompleto(id_usuario);
    
    let totalLogros = 0;
    let partidasGanadas = 0;
    let partidasJugadas = partidas.length;
    let mejorRango = 'CADETE';
    let mejorRangoNum = 0;
    
    // Recalcular logros dinámicamente para cada partida
    partidas.forEach(partida => {
      const logros = {};
      
      // PACIFICADOR: No sacrificar pasajeros
      logros.PACIFICADOR = !partida.pasajeros_sacrificados || partida.pasajeros_sacrificados === 0;
      
      // DESCIFRADOR: Abrir todas las puertas (4 puertas totales en el mapa)
      logros.DESCIFRADOR = partida.puertas_abiertas === 4;
      
      // ARACNOFÓBICO: Vencer 10 Arañas
      logros.ARACNOFOBICO = partida.aliens_derrotados?.arana >= 10;
      
      // CAZADOR: Vencer 8 Sabuesos
      logros.CAZADOR = partida.aliens_derrotados?.sabueso >= 8;
      
      // RASTREADOR: Vencer 6 Rastreadores
      logros.RASTREADOR = partida.aliens_derrotados?.rastreador >= 6;
      
      // GUERRERO: Vencer 4 Reinas
      logros.GUERRERO = partida.aliens_derrotados?.reina >= 4;
      
      // ACUMULADOR: No usar ítems
      logros.ACUMULADOR = !partida.items_usados || partida.items_usados === 0;
      
      // EXTERMINADOR: Vencer una Araña Monstruosa
      logros.EXTERMINADOR = partida.aliens_derrotados?.arana_monstruosa >= 1;
      
      // DOMADOR: Vencer un Sabueso Rabioso
      logros.DOMADOR = partida.aliens_derrotados?.sabueso_rabioso >= 1;
      
      // OSCURIDAD: Vencer una Reina Negra
      logros.OSCURIDAD = partida.aliens_derrotados?.reina_negra >= 1;
      
      // MEMORIAS: Completar 10 Eventos aleatorios
      logros.MEMORIAS = partida.eventos_completados?.length >= 10;
      
      // NERVIOSO: No disminuir el estrés
      logros.NERVIOSO = (partida.estres_reducido === undefined || partida.estres_reducido === false);
      
      // Por dificultad (solo si ganó)
      if (partida.estado === 'VICTORIA') {
        partidasGanadas++;
        switch (partida.dificultad) {
          case 'NORMAL':
            logros.NORMAL = true;
            break;
          case 'DIFICIL':
            logros.NORMAL = true;
            logros.DURO = true;
            break;
          case 'LOCURA':
            logros.NORMAL = true;
            logros.DURO = true;
            logros.LOCO = true;
            break;
        }
      }
      
      // Contar logros de esta partida
      const logrosPartida = contarLogros(logros);
      totalLogros += logrosPartida;
      
      // Determinar mejor rango
      const rangoPartida = calcularRango(logrosPartida);
      const rangoNum = ['CADETE', 'OFICIAL', 'CAPITAN', 'MAYOR', 'ALMIRANTE', 'GENERAL'].indexOf(rangoPartida);
      if (rangoNum > mejorRangoNum) {
        mejorRangoNum = rangoNum;
        mejorRango = rangoPartida;
      }
    });
    
    return {
      total_logros: totalLogros,
      partidas_jugadas: partidasJugadas,
      partidas_ganadas: partidasGanadas,
      mejor_rango: mejorRango,
      porcentaje_victoria: partidasJugadas > 0 ? Math.round((partidasGanadas / partidasJugadas) * 100) : 0
    };
  } catch (error) {
    console.error('Error al calcular logros del usuario:', error);
    return {
      total_logros: 0,
      partidas_jugadas: 0,
      partidas_ganadas: 0,
      mejor_rango: 'CADETE',
      porcentaje_victoria: 0
    };
  }
};

const rankingController = {
  // Obtener ranking global de usuarios
  obtenerRanking: async (req, res) => {
    try {
      // Obtener todos los usuarios
      const usuarios = await Usuario.getAll();
      
      if (!usuarios || usuarios.length === 0) {
        return res.status(200).json({ ranking: [] });
      }
      
      // Calcular logros para cada usuario
      const rankingData = await Promise.all(
        usuarios.map(async (usuario) => {
          const estadisticas = await calcularLogrosUsuario(usuario.id_usuario);
          
          return {
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            email: usuario.email,
            imagen_perfil: usuario.image || 'default_user.png',
            fecha_registro: usuario.fecha_registro,
            ...estadisticas
          };
        })
      );
      
      // Ordenar por total de logros (descendente), luego por porcentaje de victoria
      rankingData.sort((a, b) => {
        if (b.total_logros !== a.total_logros) {
          return b.total_logros - a.total_logros;
        }
        return b.porcentaje_victoria - a.porcentaje_victoria;
      });
      
      // Añadir posición en el ranking
      rankingData.forEach((usuario, index) => {
        usuario.posicion = index + 1;
      });
      
      res.status(200).json({ 
        ranking: rankingData,
        total_usuarios: rankingData.length,
        fecha_actualizacion: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error al obtener ranking:', error);
      res.status(500).json({ 
        mensaje: 'Error al obtener ranking', 
        error: error.message 
      });
    }
  }
};

module.exports = rankingController; 