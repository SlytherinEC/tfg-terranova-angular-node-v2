// controllers/gameController.js - Actualizado con métodos para el mapa
const Partida = require('../models/Partida');
const GameService = require('../services/GameService');
const DiceService = require('../services/DiceService');

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
          // Traje: 3 puntos, Estrés: 2 puntos, Armas: excepto Pistola Laser y Blaster, Pasajeros: 4
          partida.capitan.traje = 3;
          partida.capitan.estres = 2;
          partida.armas = partida.armas.filter(a => a.nombre !== 'Pistola Laser' && a.nombre !== 'Blaster');
          partida.pasajeros = 4;
          break;
        case 'LOCURA':
          // Traje: 2 puntos, Estrés: 3 puntos, Armas: solo Palanca y Pistola de Plasma, Pasajeros: 2
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

      // NUEVO: Verificar que adyacencias existe
    if (!partida.adyacencias) {
      console.error('Partida sin adyacencias definidas:', id_partida);
      // Si no existe, intentar reconstruirlo (opción avanzada)
      // O simplemente informar del error
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
        console.log('Error al explorar:', resultado.mensaje);
        return res.status(400).json({
          exito: false,
          mensaje: resultado.mensaje // Asegurar que se usa el mensaje personalizado
        });
      }

      // Guardar estado actualizado
      await Partida.updateEstado(id_partida, partida);

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al explorar habitación:', error);
      res.status(500).json({ mensaje: 'Error al explorar habitación', error: error.message });
    }
  },
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
  },

  // Resuelve las acciones de la armería
  resolverArmeria: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { opcion, armaSeleccionada } = req.body;

      // Validar opción
      if (!opcion || !['recargar_armas', 'reparar_traje', 'recargar_y_reparar'].includes(opcion)) {
        return res.status(400).json({ mensaje: 'Opción no válida' });
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

      // Aplicar efecto según la opción seleccionada
      const resultado = GameService.resolverArmeria(partida, opcion, armaSeleccionada);

      if (!resultado.exito) {
        return res.status(400).json({ mensaje: resultado.mensaje });
      }

      // Si requiere selección de arma, devolver opciones sin guardar el estado
      if (resultado.requiereSeleccionArma) {
        return res.status(200).json(resultado);
      }

      // Guardar estado actualizado
      await Partida.updateEstado(id_partida, partida);

      res.status(200).json({
        exito: true,
        mensaje: resultado.mensaje,
        partida
      });
    } catch (error) {
      console.error('Error al resolver armería:', error);
      res.status(500).json({ mensaje: 'Error al resolver armería', error: error.message });
    }
  },

  // Método para explorar celda interactivamente (primera fase: tirar dado)
  explorarTirarDado: async (req, res) => {
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

      // Verificar si hay un encuentro forzado por sacrificio de pasajeros
      let valorDado;
      let encuentroForzado = false;

      if (partida.proxima_habitacion_encuentro) {
        // Forzar encuentro (valor 1 del dado)
        valorDado = 1;
        encuentroForzado = true;
        // Limpiar la bandera
        partida.proxima_habitacion_encuentro = false;
      } else {
        // Usar DiceService para tirar el dado normalmente
        valorDado = DiceService.rollDie(6);
      }

      // Guardar el resultado temporalmente
      partida.ultimo_dado_exploracion = valorDado;
      await Partida.updateEstado(id_partida, partida);

      // Preparar mensaje según el valor del dado
      let mensaje = '';
      let tipo = '';
      let resultDetails = null;

      switch (valorDado) {
        case 1:
          if (encuentroForzado) {
            mensaje = 'Los gritos del pasajero han atraído a un alien: ¡Te encontraste con una criatura!';
          } else {
            mensaje = 'Habitación infestada: ¡Te encontraste con un alien!';
          }
          tipo = 'encuentro';
          break;
        case 2:
          mensaje = 'Bahía de carga infestada: ¡Has encontrado un ítem pero hay un alien!';
          tipo = 'encuentro_item';
          break;
        case 3:
          mensaje = 'Control infestado: ¡Has encontrado un código de activación pero hay un alien!';
          tipo = 'encuentro_codigo';
          break;
        case 4:
          mensaje = 'Control: Has encontrado un código de activación';
          tipo = 'codigo';
          break;
        case 5:
          mensaje = 'Armería: Selecciona una opción para mejorar tu equipo';
          tipo = 'armeria';
          break;
        case 6:
          mensaje = 'Seguridad: Has encontrado un superviviente y te sientes más tranquilo';
          tipo = 'seguridad';
          break;
      }

      res.status(200).json({
        exito: true,
        resultado: valorDado,
        mensaje,
        tipo,
        resultDetails,
        encuentroForzado // Información adicional para el frontend
      });
    } catch (error) {
      console.error('Error al tirar dado de exploración:', error);
      res.status(500).json({ mensaje: 'Error al tirar dado de exploración', error: error.message });
    }
  },

  // Método para explorar celda interactivamente (segunda fase: resolver resultado)
  explorarResolver: async (req, res) => {
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

      // Obtener valor del dado almacenado
      const valorDado = partida.ultimo_dado_exploracion;

      if (!valorDado) {
        return res.status(400).json({ mensaje: 'Debes tirar el dado primero' });
      }

      // Actualizar posición actual
      partida.posicion_actual = { ...coordenadas };

      // Obtener celda actual
      const celda = partida.mapa[coordenadas.y][coordenadas.x];

      // Marcar como explorada
      celda.explorado = true;
      partida.habitaciones_exploradas.push(`${coordenadas.x},${coordenadas.y}`);

      // Consumir oxígeno
      partida.capitan.oxigeno -= 1;
      if (partida.capitan.oxigeno <= 0) {
        return finalizarPartida(partida, 'DERROTA', 'Te has quedado sin oxígeno');
      }

      // Resolver según el valor del dado
      let resultado;

      switch (valorDado) {
        case 1: // Infestado - solo encuentro
          const alienAleatorio = obtenerAlienAleatorio();
          resultado = {
            exito: true,
            resultado: {
              tipo: 'encuentro',
              mensaje: `¡Te has encontrado con un ${alienAleatorio.nombre}!`,
              encuentro: {
                alien: alienAleatorio.tipo,
                pg: alienAleatorio.pg,
                alienData: alienAleatorio
              }
            }
          };
          partida.encuentro_actual = {
            alien: alienAleatorio.tipo,
            pg: alienAleatorio.pg
          };
          break;

        case 2: // Infestado Bahía de carga - ítem + encuentro
          const item = obtenerItemAleatorio();
          if (partida.mochila.length < 5) {
            partida.mochila.push(item);
          }

          const alienBahia = obtenerAlienAleatorio();
          resultado = {
            exito: true,
            resultado: {
              tipo: 'encuentro',
              mensaje: `Has encontrado ${item.nombre}! Pero también hay un alien.`,
              encuentro: {
                alien: alienBahia.tipo,
                pg: alienBahia.pg,
                alienData: alienBahia
              },
              itemObtenido: item
            }
          };
          partida.encuentro_actual = {
            alien: alienBahia.tipo,
            pg: alienBahia.pg
          };
          break;

        case 3: // Infestado Control - código + encuentro
          partida.codigos_activacion += 1;
          const alienControl = obtenerAlienAleatorio();
          resultado = {
            exito: true,
            resultado: {
              tipo: 'encuentro',
              mensaje: "¡Has encontrado un código de activación! Pero también hay un alien.",
              encuentro: {
                alien: alienControl.tipo,
                pg: alienControl.pg,
                alienData: alienControl
              },
              codigoObtenido: true
            }
          };
          partida.encuentro_actual = {
            alien: alienControl.tipo,
            pg: alienControl.pg
          };
          break;

        case 4: // Control - solo código
          partida.codigos_activacion += 1;
          resultado = {
            exito: true,
            resultado: {
              tipo: 'control',
              mensaje: '¡Has encontrado un código de activación!'
            }
          };
          break;

        case 5: // Armería
          resultado = {
            exito: true,
            resultado: {
              tipo: 'armeria',
              mensaje: 'Has llegado a la armería. Selecciona una opción:',
              opciones: [
                { id: 'recargar_armas', texto: 'Recargar todas las armas' },
                { id: 'reparar_traje', texto: 'Reparar todo el traje' },
                { id: 'recargar_y_reparar', texto: 'Recargar 1 arma y 3 ptos de traje' }
              ]
            }
          };
          break;

        case 6: // Seguridad
          partida.pasajeros += 1;
          partida.capitan.estres = 0;
          resultado = {
            exito: true,
            resultado: {
              tipo: 'seguridad',
              mensaje: '¡Has encontrado un superviviente! También te sientes más tranquilo. (Estrés = 0)'
            }
          };
          break;
      }

      // Limpiar el dado de exploración
      partida.ultimo_dado_exploracion = null;

      // Guardar estado actualizado
      await Partida.updateEstado(id_partida, partida);

      // Añadir la partida actualizada a la respuesta
      resultado.partida = partida;

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al resolver exploración:', error);
      res.status(500).json({ mensaje: 'Error al resolver exploración', error: error.message });
    }
  },

  // Método para revisitar celda interactivamente (primera fase: tirar dado)
  revisitarTirarDado: async (req, res) => {
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

      // Usar DiceService para tirar el dado
      const valorDado = DiceService.rollDie(6);

      // Guardar el resultado temporalmente
      partida.ultimo_dado_revisita = valorDado;
      await Partida.updateEstado(id_partida, partida);

      // Preparar mensaje según el valor del dado
      let mensaje = '';
      let tipo = '';

      if (valorDado <= 2) {
        mensaje = 'Encuentro: ¡Hay un alien en esta habitación!';
        tipo = 'encuentro';
      } else if (valorDado <= 5) {
        mensaje = 'Habitación vacía: Te sientes más calmado (-1 Estrés)';
        tipo = 'habitacion_vacia';
      } else {
        mensaje = 'Superviviente: ¡Has encontrado un pasajero!';
        tipo = 'pasajero';
      }

      res.status(200).json({
        exito: true,
        resultado: valorDado,
        mensaje,
        tipo
      });
    } catch (error) {
      console.error('Error al tirar dado de revisita:', error);
      res.status(500).json({ mensaje: 'Error al tirar dado de revisita', error: error.message });
    }
  },

  // Método para revisitar celda interactivamente (segunda fase: resolver resultado)
  revisitarResolver: async (req, res) => {
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

      // Obtener valor del dado almacenado
      const valorDado = partida.ultimo_dado_revisita;

      if (!valorDado) {
        return res.status(400).json({ mensaje: 'Debes tirar el dado primero' });
      }

      // Actualizar posición actual
      partida.posicion_actual = { ...coordenadas };

      // Obtener celda actual
      const celda = partida.mapa[coordenadas.y][coordenadas.x];

      // Consumir oxígeno
      partida.capitan.oxigeno -= 1;
      if (partida.capitan.oxigeno <= 0) {
        return finalizarPartida(partida, 'DERROTA', 'Te has quedado sin oxígeno');
      }

      // Resolver según el valor del dado
      let resultado;

      if (valorDado <= 2) {
        // 1-2: Encuentro con alien
        const alienAleatorio = obtenerAlienAleatorio();
        resultado = {
          exito: true,
          resultado: {
            tipo: 'encuentro',
            mensaje: `¡Te has encontrado con un ${alienAleatorio.nombre}!`,
            encuentro: {
              alien: alienAleatorio.tipo,
              pg: alienAleatorio.pg,
              alienData: alienAleatorio
            }
          }
        };
        partida.encuentro_actual = {
          alien: alienAleatorio.tipo,
          pg: alienAleatorio.pg
        };
      } else if (valorDado <= 5) {
        // 3-5: Habitación vacía, reduce estrés
        partida.capitan.estres = Math.max(0, partida.capitan.estres - 1);
        resultado = {
          exito: true,
          resultado: {
            tipo: 'habitacion_vacia',
            mensaje: 'La habitación está vacía. Te sientes un poco más calmado (-1 Estrés).'
          }
        };
      } else {
        // 6: Encuentras un pasajero
        partida.pasajeros += 1;
        resultado = {
          exito: true,
          resultado: {
            tipo: 'pasajero',
            mensaje: '¡Has encontrado un superviviente! Se une a tu grupo.'
          }
        };
      }

      // Limpiar el dado de revisita
      partida.ultimo_dado_revisita = null;

      // Guardar estado actualizado
      await Partida.updateEstado(id_partida, partida);

      // Añadir la partida actualizada a la respuesta
      resultado.partida = partida;

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al resolver revisita:', error);
      res.status(500).json({ mensaje: 'Error al resolver revisita', error: error.message });
    }
  },

  // Método para tirar dado de encuentro (primera fase: determinar alien)
  encuentroTirarDado: async (req, res) => {
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

      // Usar DiceService para tirar el dado
      const valorDado = DiceService.rollDie(6);

      // Obtener alien según el valor del dado
      const alienData = obtenerAlienPorDado(valorDado);

      // Guardar el resultado temporalmente
      partida.ultimo_dado_encuentro = valorDado;
      partida.alien_pendiente = alienData;
      await Partida.updateEstado(id_partida, partida);

      res.status(200).json({
        exito: true,
        resultado: valorDado,
        alien: alienData,
        mensaje: `¡Te enfrentas a un ${alienData.nombre}!`
      });
    } catch (error) {
      console.error('Error al tirar dado de encuentro:', error);
      res.status(500).json({ mensaje: 'Error al tirar dado de encuentro', error: error.message });
    }
  },

  // Método para resolver encuentro (segunda fase: iniciar combate)
  encuentroResolver: async (req, res) => {
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

      // Obtener alien pendiente
      const alienData = partida.alien_pendiente;

      if (!alienData) {
        return res.status(400).json({ mensaje: 'Debes tirar el dado primero' });
      }

      // Iniciar combate avanzado directamente
      const resultadoCombate = GameService.iniciarCombateAvanzado(partida, alienData.tipo);

      if (!resultadoCombate.exito) {
        return res.status(400).json({ mensaje: resultadoCombate.mensaje });
      }

      // Limpiar datos temporales
      partida.ultimo_dado_encuentro = null;
      partida.alien_pendiente = null;

      // Guardar estado actualizado
      await Partida.updateEstado(id_partida, partida);

      const resultado = {
        exito: true,
        resultado: {
          tipo: 'encuentro',
          mensaje: `¡El combate contra el ${alienData.nombre} ha comenzado!`,
          encuentro: {
            alien: alienData.tipo,
            pg: alienData.pg,
            alienData: alienData
          }
        },
        combate_estado: resultadoCombate.combate_estado,
        partida
      };

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al resolver encuentro:', error);
      res.status(500).json({ mensaje: 'Error al resolver encuentro', error: error.message });
    }
  },

  // NUEVOS ENDPOINTS PARA COMBATE AVANZADO

  // Iniciar combate avanzado
  iniciarCombateAvanzado: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { tipo_alien } = req.body;

      const partida = await Partida.getById(id_partida);
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      const resultado = GameService.iniciarCombateAvanzado(partida, tipo_alien);

      if (resultado.exito) {
        await Partida.updateEstado(id_partida, partida);
      }

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al iniciar combate avanzado:', error);
      res.status(500).json({ mensaje: 'Error al iniciar combate avanzado', error: error.message });
    }
  },

  // Seleccionar arma en combate
  seleccionarArmaEnCombate: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { nombre_arma } = req.body;

      const partida = await Partida.getById(id_partida);
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      const resultado = GameService.seleccionarArmaEnCombate(partida, nombre_arma);

      if (resultado.exito) {
        await Partida.updateEstado(id_partida, partida);
      }

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al seleccionar arma en combate:', error);
      res.status(500).json({ mensaje: 'Error al seleccionar arma en combate', error: error.message });
    }
  },

  // Lanzar dados en combate
  lanzarDadosEnCombate: async (req, res) => {
    try {
      const { id_partida } = req.params;

      const partida = await Partida.getById(id_partida);
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      const resultado = GameService.lanzarDadosEnCombate(partida);

      if (resultado.exito) {
        await Partida.updateEstado(id_partida, partida);
      }

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al lanzar dados en combate:', error);
      res.status(500).json({ mensaje: 'Error al lanzar dados en combate', error: error.message });
    }
  },

  // Avanzar de fase lanzamiento a uso de estrés
  avanzarAUsoEstres: async (req, res) => {
    try {
      const { id_partida } = req.params;

      const partida = await Partida.getById(id_partida);
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      // Verificar que esté en fase lanzamiento con dados ya lanzados
      if (!partida.combate_actual || partida.combate_actual.fase !== 'lanzamiento' || !partida.combate_actual.datos_lanzamiento) {
        return res.status(400).json({ mensaje: 'No se puede avanzar a uso de estrés desde esta fase' });
      }

      // Si el estrés ya está al máximo, saltar directamente al resultado
      if (partida.capitan.estres >= 3) {
        partida.combate_actual.fase = 'resultado';
        partida.combate_actual.acciones_disponibles = GameService.generarAccionesDisponibles(partida, 'resultado');
        
        await Partida.updateEstado(id_partida, partida);
        
        // Procesar directamente el resultado del combate
        const resultado = GameService.continuarCombate(partida);
        
        if (resultado.exito) {
          await Partida.updateEstado(id_partida, partida);
        }
        
        return res.status(200).json(resultado);
      } else {
        // Ir a fase de uso de estrés
        partida.combate_actual.fase = 'uso_estres';
        partida.combate_actual.acciones_disponibles = GameService.generarAccionesDisponibles(partida, 'uso_estres');

        await Partida.updateEstado(id_partida, partida);

        res.status(200).json({
          exito: true,
          mensaje: 'Avanzando a fase de uso de estrés',
          combate_estado: partida.combate_actual,
          partida
        });
      }
    } catch (error) {
      console.error('Error al avanzar a uso de estrés:', error);
      res.status(500).json({ mensaje: 'Error al avanzar a uso de estrés', error: error.message });
    }
  },

  // Usar estrés en combate
  usarEstresEnCombateAvanzado: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { accion, parametros } = req.body;

      const partida = await Partida.getById(id_partida);
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      const resultado = GameService.usarEstresEnCombate(partida, accion, parametros);

      if (resultado.exito) {
        await Partida.updateEstado(id_partida, partida);
      }

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al usar estrés en combate:', error);
      res.status(500).json({ mensaje: 'Error al usar estrés en combate', error: error.message });
    }
  },

  // Continuar combate
  continuarCombateAvanzado: async (req, res) => {
    try {
      const { id_partida } = req.params;

      const partida = await Partida.getById(id_partida);
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      const resultado = GameService.continuarCombate(partida);

      if (resultado.exito) {
        await Partida.updateEstado(id_partida, partida);
      }

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al continuar combate:', error);
      res.status(500).json({ mensaje: 'Error al continuar combate', error: error.message });
    }
  },

  // Usar ítem en combate avanzado
  usarItemEnCombateAvanzado: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { indice_item } = req.body;

      const partida = await Partida.getById(id_partida);
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      const resultado = GameService.usarItemEnCombateAvanzado(partida, indice_item);

      if (resultado.exito) {
        await Partida.updateEstado(id_partida, partida);
      }

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al usar ítem en combate:', error);
      res.status(500).json({ mensaje: 'Error al usar ítem en combate', error: error.message });
    }
  },

  // Sacrificar pasajero en combate avanzado
  sacrificarPasajeroEnCombateAvanzado: async (req, res) => {
    try {
      const { id_partida } = req.params;
      const { accion } = req.body;

      const partida = await Partida.getById(id_partida);
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      const resultado = GameService.sacrificarPasajeroEnCombateAvanzado(partida, accion);

      if (resultado.exito || resultado.partida) {
        await Partida.updateEstado(id_partida, partida);
      }

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al sacrificar pasajero en combate:', error);
      res.status(500).json({ mensaje: 'Error al sacrificar pasajero en combate', error: error.message });
    }
  },

  // Obtener estado del combate
  obtenerEstadoCombate: async (req, res) => {
    try {
      const { id_partida } = req.params;

      const partida = await Partida.getById(id_partida);
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      const resultado = GameService.obtenerEstadoCombate(partida);
      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al obtener estado del combate:', error);
      res.status(500).json({ mensaje: 'Error al obtener estado del combate', error: error.message });
    }
  },

  // Finalizar combate
  finalizarCombate: async (req, res) => {
    try {
      const { id_partida } = req.params;

      const partida = await Partida.getById(id_partida);
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      const resultado = GameService.finalizarCombate(partida);

      if (resultado.exito) {
        await Partida.updateEstado(id_partida, partida);
      }

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al finalizar combate:', error);
      res.status(500).json({ mensaje: 'Error al finalizar combate', error: error.message });
    }
  },

  // Obtener información de armas por dificultad
  obtenerArmasDisponibles: async (req, res) => {
    try {
      const { dificultad } = req.query;
      const armas = GameService.obtenerArmasDisponibles(dificultad || 'NORMAL');
      res.status(200).json({ armas });
    } catch (error) {
      console.error('Error al obtener armas disponibles:', error);
      res.status(500).json({ mensaje: 'Error al obtener armas disponibles', error: error.message });
    }
  },

  // Obtener información de alien
  obtenerInfoAlien: async (req, res) => {
    try {
      const { tipo_alien } = req.params;
      const alien = GameService.obtenerInfoAlien(tipo_alien);
      
      if (!alien) {
        return res.status(404).json({ mensaje: 'Tipo de alien no encontrado' });
      }

      res.status(200).json({ alien });
    } catch (error) {
      console.error('Error al obtener información del alien:', error);
      res.status(500).json({ mensaje: 'Error al obtener información del alien', error: error.message });
    }
  },

  // Obtener logros de combate
  obtenerLogrosCombate: async (req, res) => {
    try {
      const { id_partida } = req.params;

      const partida = await Partida.getById(id_partida);
      if (!partida) {
        return res.status(404).json({ mensaje: 'Partida no encontrada' });
      }

      if (partida.id_usuario !== req.usuario.id_usuario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta partida' });
      }

      const logros = GameService.obtenerLogrosCombate(partida);
      res.status(200).json({ logros });
    } catch (error) {
      console.error('Error al obtener logros de combate:', error);
      res.status(500).json({ mensaje: 'Error al obtener logros de combate', error: error.message });
    }
  },

  // Método para sacrificio interactivo (primera fase: tirar dado)
  sacrificioTirarDado: async (req, res) => {
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

      // Usar DiceService para tirar el dado
      const valorDado = DiceService.rollDie(6);

      // Guardar el resultado temporalmente junto con la acción
      partida.ultimo_dado_sacrificio = valorDado;
      partida.accion_sacrificio_pendiente = accion;
      await Partida.updateEstado(id_partida, partida);

      // Preparar mensaje según el valor del dado
      let mensaje = '';
      let tipo = '';

      if (valorDado === 1) {
        mensaje = 'Te roban munición y huyen - Pierdes 1 munición de cada arma y a este pasajero';
        tipo = 'robo_municion';
      } else if (valorDado >= 2 && valorDado <= 4) {
        mensaje = 'Gritan de miedo y llaman la atención - Pierdes al pasajero y la próxima habitación tendrá un alien';
        tipo = 'gritan_miedo';
      } else { // valorDado >= 5
        // Personalizar mensaje según la acción
        switch (accion) {
          case 'escapar_encuentro':
            mensaje = 'Se convierte en héroe - Te ayuda a escapar del alien';
            break;
          case 'evadir_ataque':
            mensaje = 'Se convierte en héroe - Evita que el alien te ataque este turno';
            break;
          case 'recuperar_oxigeno':
            mensaje = 'Se convierte en héroe - Te entrega su oxígeno (+3 O2)';
            break;
        }
        tipo = 'heroico';
      }

      res.status(200).json({
        exito: true,
        resultado: valorDado,
        mensaje,
        tipo,
        accion
      });
    } catch (error) {
      console.error('Error al tirar dado de sacrificio:', error);
      res.status(500).json({ mensaje: 'Error al tirar dado de sacrificio', error: error.message });
    }
  },

  // Método para sacrificio interactivo (segunda fase: resolver resultado)
  sacrificioResolver: async (req, res) => {
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

      // Verificar que hay un dado de sacrificio pendiente
      if (!partida.ultimo_dado_sacrificio || !partida.accion_sacrificio_pendiente) {
        return res.status(400).json({ mensaje: 'No hay sacrificio pendiente para resolver' });
      }

      const valorDado = partida.ultimo_dado_sacrificio;
      const accion = partida.accion_sacrificio_pendiente;

      // Aplicar resultado según el valor del dado
      let resultado;

      // Registrar sacrificio para logros
      if (!partida.pasajeros_sacrificados) {
        partida.pasajeros_sacrificados = 0;
      }

      if (valorDado === 1) {
        // Te roban munición y huyen
        let municionRobada = false;
        partida.armas.forEach(arma => {
          if (arma.nombre !== 'Palanca' && arma.municion > 0) {
            arma.municion -= 1;
            municionRobada = true;
          }
        });

        partida.pasajeros -= 1;
        const mensaje = municionRobada ?
          'El pasajero te robó munición y huyó' :
          'El pasajero intentó robarte munición pero no tenías, simplemente huyó';

        resultado = {
          exito: false,
          mensaje,
          reaccion: valorDado,
          tipo: 'robo_municion'
        };
      } else if (valorDado >= 2 && valorDado <= 4) {
        // Gritan de miedo y llaman la atención
        partida.pasajeros -= 1;
        partida.proxima_habitacion_encuentro = true;
        
        resultado = {
          exito: false,
          mensaje: 'El pasajero gritó de miedo y huyó, atrayendo la atención de los aliens',
          reaccion: valorDado,
          tipo: 'gritan_miedo'
        };
      } else { // valorDado >= 5
        // Reacción heroica
        partida.pasajeros -= 1;
        partida.pasajeros_sacrificados += 1;

        // Aplicar efecto según la acción solicitada
        let mensaje = '';
        switch (accion) {
          case 'escapar_encuentro':
            if (partida.encuentro_actual) {
              partida.encuentro_actual = null;
              if (partida.combate_actual) {
                partida.combate_actual = null;
              }
              mensaje = 'El pasajero se sacrificó heroicamente, permitiéndote escapar del alien';
            } else {
              mensaje = 'El pasajero se sacrificó, pero no había ningún encuentro del que escapar';
            }
            break;

          case 'evadir_ataque':
            if (partida.encuentro_actual) {
              mensaje = 'El pasajero se interpuso heroicamente, evitando que el alien te ataque en este turno';
              partida.evadir_proximo_ataque = true;
            } else {
              mensaje = 'El pasajero se sacrificó, pero no había ningún ataque que evadir';
            }
            break;

          case 'recuperar_oxigeno':
            partida.capitan.oxigeno = Math.min(10, partida.capitan.oxigeno + 3);
            mensaje = 'El pasajero te entregó heroicamente su oxígeno, recuperas 3 puntos de O2';
            break;
        }

        resultado = {
          exito: true,
          mensaje,
          reaccion: valorDado,
          tipo: 'heroico'
        };
      }

      // Limpiar dados temporales
      partida.ultimo_dado_sacrificio = null;
      partida.accion_sacrificio_pendiente = null;

      // Guardar estado actualizado
      await Partida.updateEstado(id_partida, partida);

      // Añadir la partida actualizada a la respuesta
      resultado.partida = partida;

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al resolver sacrificio:', error);
      res.status(500).json({ mensaje: 'Error al resolver sacrificio', error: error.message });
    }
  }
};

// Helper function - Tabla de encuentros según 1d6
function obtenerAlienPorDado(valorDado) {
  const aliens = {
    arana: { tipo: 'arana', nombre: 'Araña', danio: 1, objetivo: 3, pg: 2, sacrificio: 1 },
    sabueso: { tipo: 'sabueso', nombre: 'Sabueso', danio: 2, objetivo: 5, pg: 4, sacrificio: 1 },
    rastreador: { tipo: 'rastreador', nombre: 'Rastreador', danio: 3, objetivo: 6, pg: 5, sacrificio: 2 },
    reina: { tipo: 'reina', nombre: 'Reina', danio: 3, objetivo: 8, pg: 8, sacrificio: 3 }
  };

  // Tabla de encuentros según 1d6:
  // 1: Araña
  // 2-3: Sabueso  
  // 4-5: Rastreador
  // 6: Reina
  let tipoAlien;
  if (valorDado === 1) {
    tipoAlien = 'arana';
  } else if (valorDado >= 2 && valorDado <= 3) {
    tipoAlien = 'sabueso';
  } else if (valorDado >= 4 && valorDado <= 5) {
    tipoAlien = 'rastreador';
  } else { // valorDado === 6
    tipoAlien = 'reina';
  }

  return aliens[tipoAlien];
}

// Función de compatibilidad para código existente
function obtenerAlienAleatorio() {
  const valorDado = Math.floor(Math.random() * 6) + 1;
  return obtenerAlienPorDado(valorDado);
}

// Esta función auxiliar debe estar fuera del objeto gameController,
// Antes del módulo exports si no está ya definida:
function obtenerItemAleatorio() {
  const items = [
    { nombre: 'Kit de Reparación', efecto: 'Repara 2 puntos de traje', usos: 1 },
    { nombre: 'Analgésico', efecto: 'Reduce 2 puntos de estrés', usos: 1 },
    { nombre: 'Visor', efecto: 'Añade +1 a la precisión del arma', usos: 3 },
    { nombre: 'Munición', efecto: 'Recarga 2 municiones de un arma', usos: 1 },
    { nombre: 'Tanque de O2', efecto: 'Recupera 3 puntos de oxígeno', usos: 1 }
  ];

  const indice = Math.floor(Math.random() * items.length);
  return { ...items[indice] };
}

module.exports = gameController;