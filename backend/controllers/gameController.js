// controllers/gameController.js - Actualizado con métodos para el mapa
const Partida = require('../models/Partida');
const GameService = require('../services/GameService');

const calcularDuracion = (fechaCreacion, fechaActualizacion) => {
  const inicio = new Date(fechaCreacion);
  const fin = new Date(fechaActualizacion);
  const diffMs = fin - inicio;
  
  // Convertir a minutos
  const minutos = Math.floor(diffMs / 60000);
  const segundos = Math.floor((diffMs % 60000) / 1000);
  
  return `${minutos}m ${segundos}s`;
};

const calcularTotalAliensDerrotados = (aliens) => {
  return Object.values(aliens).reduce((total, cantidad) => total + cantidad, 0);
};

const contarLogros = (logros) => {
  return Object.values(logros).filter(Boolean).length;
};

const calcularRangoFinal = (partida) => {
  // Si la partida aún está en curso, no hay rango
  if (partida.estado === 'EN_CURSO') {
    return 'En progreso';
  }
  
  // Contar logros
  const totalLogros = contarLogros(partida.logros || {});
  
  // Determinar rango según cantidad de logros
  if (totalLogros >= 9) return 'GENERAL';
  if (totalLogros >= 8) return 'ALMIRANTE';
  if (totalLogros >= 6) return 'MAYOR';
  if (totalLogros >= 4) return 'CAPITAN';
  if (totalLogros >= 2) return 'OFICIAL';
  return 'CADETE';
};

const gameController = {
  // Iniciar nueva partida
  nuevaPartida: async (req, res) => {
    try {
      const id_usuario = req.usuario.id_usuario;
      const { dificultad = 'MUY_FACIL' } = req.body;

      // Crear nueva partida
      const partida = await Partida.create(id_usuario);

      // Establecer dificultad
      partida.dificultad = dificultad;

      // Ajustar según dificultad
      switch (dificultad) {
        case 'MUY_FACIL':
          // Valores por defecto (no hay cambios)
          break;
        case 'NORMAL':
          // Traje: 4 puntos, Estrés: 1 punto, Armas: excepto Blaster
          partida.capitan.traje = 4;
          partida.capitan.estres = 1;
          partida.armas = partida.armas.filter(a => a.nombre !== 'Blaster');
          break;
        case 'DIFICIL':
          // Traje: 3 puntos, Estrés: 2 puntos, Armas: excepto Laser y Blaster, Pasajeros: 4
          partida.capitan.traje = 3;
          partida.capitan.estres = 2;
          partida.armas = partida.armas.filter(a => a.nombre !== 'Pistola Laser' && a.nombre !== 'Blaster');
          partida.pasajeros = 4;
          break;
        case 'LOCURA':
          // Traje: 2 puntos, Estrés: 3 puntos, Armas: solo Palanca y Plasma, Pasajeros: 2
          partida.capitan.traje = 2;
          partida.capitan.estres = 3;
          partida.armas = partida.armas.filter(a => a.nombre === 'Palanca' || a.nombre === 'Pistola de Plasma');
          partida.pasajeros = 2;
          break;
      }

      // Guardar estado inicial ajustado
      await Partida.updateEstado(partida.id_partida, partida);

      res.status(200).json({
        mensaje: 'Partida creada con éxito',
        partida
      });
    } catch (error) {
      console.error('Error al crear partida:', error);
      res.status(500).json({ mensaje: 'Error al crear partida', error: error.message });
    }
  },

  // Obtener partidas del usuario
  obtenerPartidas: async (req, res) => {
    try {
      const id_usuario = req.usuario.id_usuario;
      const partidas = await Partida.getByUsuario(id_usuario);

      res.status(200).json(partidas);
    } catch (error) {
      console.error('Error al obtener partidas:', error);
      res.status(500).json({ mensaje: 'Error al obtener partidas', error: error.message });
    }
  },

  // Obtener partida específica
  obtenerPartida: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const partida = await Partida.getById(id_partida);

      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      // Verificar que pertenece al usuario
      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      res.status(200).json(partida);
    } catch (error) {
      console.error('Error al obtener partida:', error);
      res.status(500).json({ mensaje: 'Error al obtener partida', error: error.message });
    }
  },

  // Nuevo: Obtener solo el mapa de una partida
  obtenerMapa: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const partida = await Partida.getById(id_partida);

      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      // Verificar que pertenece al usuario
      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      // Devolver solo el mapa
      res.status(200).json({
        mapa: partida.mapa
      });
    } catch (error) {
      console.error('Error al obtener mapa:', error);
      res.status(500).json({ mensaje: 'Error al obtener mapa', error: error.message });
    }
  },

  // Nuevo: Actualizar solo el mapa de una partida
  actualizarMapa: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { mapa } = req.body;

      if (!mapa || !Array.isArray(mapa)) {
        return res.status(400).json({ mensaje: 'Formato de mapa inválido' });
      }

      const partida = await Partida.getById(id_partida);

      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      // Verificar que pertenece al usuario
      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      // Actualizar solo el mapa
      const actualizado = await Partida.updateMap(id_partida, mapa);

      if (!actualizado) {
        return res.status(500).json({ mensaje: 'Error al actualizar el mapa' });
      }

      res.status(200).json({
        mensaje: 'Mapa actualizado con éxito'
      });
    } catch (error) {
      console.error('Error al actualizar mapa:', error);
      res.status(500).json({ mensaje: 'Error al actualizar mapa', error: error.message });
    }
  },

  // Explorar habitación
  explorarHabitacion: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { coordenadas } = req.body;

      // Validar coordenadas
      if (!coordenadas || typeof coordenadas.x !== 'number' || typeof coordenadas.y !== 'number') {
        return res.status(400).json({ mensaje: 'Coordenadas inválidas' });
      }

      // Obtener partida
      const partida = await Partida.getById(id_partida);

      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      // Verificar que pertenece al usuario
      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      // Verificar si la partida ha terminado
      if (partida.estado !== 'EN_CURSO') {
        return res.status(400).json({ mensaje: 'La partida ya ha finalizado' });
      }

      // Realizar acción de exploración
      const resultado = GameService.explorarHabitacion(partida, coordenadas);

      if (!resultado.exito) {
        return res.status(400).json({ mensaje: resultado.mensaje });
      }

      // Guardar estado actualizado
      await Partida.updateEstado(id_partida, partida);

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al explorar habitación:', error);
      res.status(500).json({ mensaje: 'Error al explorar habitación', error: error.message });
    }
  },

  // Resto de métodos del controlador (permanecen iguales)...
  // resolverCombate, sacrificarPasajero, usarItem, resolverEvento
  // Resolver combate
  resolverCombate: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { armaSeleccionada, usarItem } = req.body;

      // Validar datos
      if (!armaSeleccionada) {
        return res.status(400).json({ mensaje: 'Debes seleccionar un arma' });
      }

      // Obtener partida
      const partida = await Partida.getById(id_partida);

      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      // Verificar que pertenece al usuario
      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      // Verificar si hay un combate activo
      if (!partida.encuentro_actual) {
        return res.status(400).json({ mensaje: 'No hay un combate activo' });
      }

      // Resolver combate
      const resultado = GameService.resolverCombate(partida, { armaSeleccionada, usarItem });

      if (!resultado.exito) {
        return res.status(400).json({ mensaje: resultado.mensaje });
      }

      // Guardar estado actualizado
      await Partida.updateEstado(id_partida, partida);

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al resolver combate:', error);
      res.status(500).json({ mensaje: 'Error al resolver combate', error: error.message });
    }
  },

  // Sacrificar pasajero
  sacrificarPasajero: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { accion } = req.body;

      // Validar acción
      if (!accion || !['escapar_encuentro', 'evadir_ataque', 'recuperar_oxigeno'].includes(accion)) {
        return res.status(400).json({ mensaje: 'Acción no válida' });
      }

      // Obtener partida
      const partida = await Partida.getById(id_partida);

      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      // Verificar que pertenece al usuario
      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      // Verificar si tienen pasajeros
      if (partida.pasajeros <= 0) {
        return res.status(400).json({ mensaje: 'No tienes pasajeros para sacrificar' });
      }

      // Contabilizar sacrificio para logros
      if (!partida.pasajeros_sacrificados) {
        partida.pasajeros_sacrificados = 0;
      }
      partida.pasajeros_sacrificados += 1;

      // Sacrificar pasajero
      const resultado = GameService.sacrificarPasajero(partida, accion);

      // Guardar estado actualizado
      await Partida.updateEstado(id_partida, partida);

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al sacrificar pasajero:', error);
      res.status(500).json({ mensaje: 'Error al sacrificar pasajero', error: error.message });
    }
  },

  // Usar ítem
  usarItem: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { indiceItem } = req.body;

      // Validar índice
      if (typeof indiceItem !== 'number' || indiceItem < 0) {
        return res.status(400).json({ mensaje: 'Índice de ítem no válido' });
      }

      // Obtener partida
      const partida = await Partida.getById(id_partida);

      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      // Verificar que pertenece al usuario
      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      // Contabilizar uso para logros
      if (!partida.items_usados) {
        partida.items_usados = 0;
      }
      partida.items_usados += 1;

      // Usar ítem
      const resultado = GameService.usarItem(partida, indiceItem);

      if (!resultado.exito) {
        return res.status(400).json({ mensaje: resultado.mensaje });
      }

      // Guardar estado actualizado
      await Partida.updateEstado(id_partida, partida);

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al usar ítem:', error);
      res.status(500).json({ mensaje: 'Error al usar ítem', error: error.message });
    }
  },

  // Resolver evento
  resolverEvento: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { numeroEvento, opcionSeleccionada } = req.body;

      // Validar datos
      if (typeof numeroEvento !== 'number' || !opcionSeleccionada) {
        return res.status(400).json({ mensaje: 'Datos de evento no válidos' });
      }

      // Obtener partida
      const partida = await Partida.getById(id_partida);

      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      // Verificar que pertenece al usuario
      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      // Resolver evento
      const resultado = GameService.resolverEventoEspecifico(partida, numeroEvento, opcionSeleccionada);

      // Guardar estado actualizado
      await Partida.updateEstado(id_partida, partida);

      res.status(200).json({
        exito: true,
        resultado,
        partida
      });
    } catch (error) {
      console.error('Error al resolver evento:', error);
      res.status(500).json({ mensaje: 'Error al resolver evento', error: error.message });
    }
  },

  // Usar estrés
  usarEstres: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { accion, indice_dado } = req.body;

      // Validar acción
      if (!accion || !['modificar', 'retirar', 'reparar'].includes(accion)) {
        return res.status(400).json({ mensaje: 'Acción de estrés no válida' });
      }

      // Obtener partida
      const partida = await Partida.getById(id_partida);

      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      // Verificar que pertenece al usuario
      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      // Verificar si la partida ha terminado
      if (partida.estado !== 'EN_CURSO') {
        return res.status(400).json({ mensaje: 'La partida ya ha finalizado' });
      }

      // Verificar nivel de estrés
      if (partida.capitan.estres >= 3) {
        return res.status(400).json({ mensaje: 'Has alcanzado el nivel máximo de estrés' });
      }

      // Aplicar efecto según la acción
      let resultado = GameService.usarEstres(partida, accion, indice_dado);

      if (!resultado.exito) {
        return res.status(400).json({ mensaje: resultado.mensaje });
      }

      // Guardar estado actualizado
      await Partida.updateEstado(id_partida, partida);

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al usar estrés:', error);
      res.status(500).json({ mensaje: 'Error al usar estrés', error: error.message });
    }
  },

// Obtener logros de una partida
  obtenerLogros: async (req, res) => {
    try {
      const { id_partida } = req.params;
      
      // Obtener partida
      const partida = await Partida.getById(id_partida);
      
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }
      
      // Verificar que pertenece al usuario
      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }
      
      // Extraer y verificar logros
      const logros = partida.logros || {};
      
      // Verificar logros adicionales antes de responder
      // Esto asegura que obtenemos el estado actual de los logros
      
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
      logros.MEMORIAS = partida.eventos_completados.length >= 10;
      
      // NERVIOSO: No disminuir el estrés
      logros.NERVIOSO = (partida.estres_reducido === undefined || partida.estres_reducido === false);
      
      // Por dificultad
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
      
      // Guardar los logros actualizados si la partida ha terminado
      if (partida.estado !== 'EN_CURSO') {
        partida.logros = logros;
        await Partida.updateEstado(id_partida, partida);
      }
      
      res.status(200).json({ logros });
    } catch (error) {
      console.error('Error al obtener logros:', error);
      res.status(500).json({ mensaje: 'Error al obtener logros', error: error.message });
    }
  },

  // Obtener estadísticas de una partida
  obtenerEstadisticas: async (req, res) => {
    try {
      const { id_partida } = req.params;
      
      // Obtener partida
      const partida = await Partida.getById(id_partida);
      
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }
      
      // Verificar que pertenece al usuario
      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }
      
      // Calcular estadísticas
      const estadisticas = {
        // Información básica
        id_partida: partida.id_partida,
        dificultad: partida.dificultad,
        estado: partida.estado,
        fecha_creacion: partida.fecha_creacion,
        fecha_actualizacion: partida.fecha_actualizacion,
        duracion: calcularDuracion(partida.fecha_creacion, partida.fecha_actualizacion),
        
        // Estadísticas del capitán
        capitan: {
          traje: partida.capitan.traje,
          estres: partida.capitan.estres,
          oxigeno: partida.capitan.oxigeno
        },
        
        // Estadísticas de exploración
        exploracion: {
          habitaciones_exploradas: partida.habitaciones_exploradas.length,
          codigos_activacion: partida.codigos_activacion,
          eventos_completados: partida.eventos_completados.length
        },
        
        // Estadísticas de combate
        combate: {
          total_aliens_derrotados: calcularTotalAliensDerrotados(partida.aliens_derrotados || {}),
          detalle_aliens: partida.aliens_derrotados || {}
        },
        
        // Estadísticas de pasajeros
        pasajeros: {
          actuales: partida.pasajeros,
          sacrificados: partida.pasajeros_sacrificados || 0
        },
        
        // Estadísticas de items
        items: {
          actuales: partida.mochila.length,
          usados: partida.items_usados || 0
        },
        
        // Logros
        total_logros: contarLogros(partida.logros || {}),
        rango_final: calcularRangoFinal(partida)
      };
      
      res.status(200).json({ estadisticas });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ mensaje: 'Error al obtener estadísticas', error: error.message });
    }
  }
};

module.exports = gameController;