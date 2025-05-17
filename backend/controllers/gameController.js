// controllers/gameController.js - Actualizado con métodos para el mapa
const Partida = require('../models/Partida');
const GameService = require('../services/GameService');

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
  
  // --- INICIO: Preservo estos métodos originales ---
  
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
  }
  
  // --- FIN: Métodos originales preservados ---
};

module.exports = gameController;