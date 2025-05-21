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

      // Usar DiceService para tirar el dado
      const valorDado = DiceService.rollDie(6);

      // Guardar el resultado temporalmente
      partida.ultimo_dado_exploracion = valorDado;
      await Partida.updateEstado(id_partida, partida);

      // Preparar mensaje según el valor del dado
      let mensaje = '';
      let tipo = '';
      let resultDetails = null;

      switch (valorDado) {
        case 1:
          mensaje = 'Habitación infestada: ¡Te encontraste con un alien!';
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
        resultDetails
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
};

// Helper function
function obtenerAlienAleatorio() {
  const aliens = {
    arana: { tipo: 'arana', nombre: 'Araña', danio: 1, objetivo: 3, pg: 1 },
    sabueso: { tipo: 'sabueso', nombre: 'Sabueso', danio: 2, objetivo: 5, pg: 2 },
    rastreador: { tipo: 'rastreador', nombre: 'Rastreador', danio: 3, objetivo: 6, pg: 4 },
    reina: { tipo: 'reina', nombre: 'Reina', danio: 3, objetivo: 8, pg: 8 }
  };

  const rand = Math.random();
  let tipoAlien;

  if (rand < 0.4) {
    tipoAlien = 'arana';
  } else if (rand < 0.7) {
    tipoAlien = 'sabueso';
  } else if (rand < 0.9) {
    tipoAlien = 'rastreador';
  } else {
    tipoAlien = 'reina';
  }

  return aliens[tipoAlien];
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