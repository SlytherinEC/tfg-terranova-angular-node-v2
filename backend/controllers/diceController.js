// backend/controllers/diceController.js
const DiceService = require('../services/DiceService');
const Partida = require('../models/Partida');

// Método para tiradas genéricas
const rollDice = async (req, res) => {
  try {
    const { count = 1, sides = 6 } = req.body;

    // Validar parámetros
    if (count < 1 || count > 10) {
      return res.status(400).json({ mensaje: 'Cantidad de dados debe estar entre 1 y 10' });
    }

    if (sides < 2 || sides > 100) {
      return res.status(400).json({ mensaje: 'Número de caras debe estar entre 2 y 100' });
    }

    const result = DiceService.rollAndSum(count, sides);

    res.status(200).json({
      exito: true,
      dados: result.results,
      total: result.total
    });
  } catch (error) {
    console.error('Error al lanzar dados:', error);
    res.status(500).json({ mensaje: 'Error al lanzar dados', error: error.message });
  }
};

// Método para tirar dados con propósito específico
const rollForAction = async (req, res) => {
  try {
    const { id_partida, accion, parametros = {} } = req.body;

    // Validaciones
    if (!id_partida) {
      return res.status(400).json({ mensaje: 'ID de partida requerido' });
    }

    if (!accion) {
      return res.status(400).json({ mensaje: 'Acción requerida' });
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

    // Procesar según la acción
    let resultado;

    switch (accion) {
      case 'exploracion':
        resultado = procesarTiradaExploracion(partida);
        break;

      case 'combate':
        resultado = procesarTiradaCombate(partida, parametros);
        break;

      case 'evento':
        resultado = procesarTiradaEvento(partida);
        break;

      default:
        return res.status(400).json({ mensaje: 'Acción no reconocida' });
    }

    // Guardar el resultado en la partida si es necesario
    if (resultado.guardarEnPartida) {
      await Partida.updateEstado(id_partida, partida);
    }

    res.status(200).json({
      exito: true,
      accion,
      ...resultado
    });
  } catch (error) {
    console.error(`Error al lanzar dados para acción ${req.body.accion}:`, error);
    res.status(500).json({ mensaje: 'Error al procesar la tirada', error: error.message });
  }
};

// Funciones auxiliares para procesar cada tipo de tirada
function procesarTiradaExploracion(partida) {
  // Tirar un d6
  const valorDado = DiceService.rollDie(6);

  // Guardar el resultado en la partida
  partida.ultimo_dado_exploracion = valorDado;

  // Preparar mensaje según el valor del dado
  let mensaje = '';
  let tipo = '';

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
      mensaje = 'Seguridad: Has encontrado un pasajero y te sientes más tranquilo';
      tipo = 'seguridad';
      break;
  }

  return {
    resultado: valorDado,
    mensaje,
    tipo,
    guardarEnPartida: true
  };
}

function procesarTiradaCombate(partida, parametros) {
  const { arma, bonusPrecision = 0 } = parametros;

  // Validar que hay un combate activo
  if (!partida.encuentro_actual) {
    throw new Error('No hay un encuentro activo');
  }

  // Validar y encontrar el arma
  const armaObj = partida.armas.find(a => a.nombre === arma);
  if (!armaObj) {
    throw new Error('Arma no encontrada');
  }

  // Calcular precisión total
  const precision = armaObj.precision + bonusPrecision;

  // Tirar dados según la precisión
  const resultadoDados = DiceService.rollDice(precision, 6);
  const total = DiceService.sumDice(resultadoDados);

  // Obtener datos del alien
  const encuentro = partida.encuentro_actual;
  const tipoAlien = encuentro.alien;

  // Guardar en la partida para posible uso de estrés
  partida.ultimo_combate = {
    dados: resultadoDados,
    suma: total,
    arma: armaObj,
    alien: { nombre: tipoAlien }
  };

  return {
    dados: resultadoDados,
    total,
    arma: armaObj.nombre,
    precision,
    guardarEnPartida: true
  };
}

function procesarTiradaEvento(partida) {
  // Tirar 4d6 para eventos aleatorios
  const resultadoDados = DiceService.rollDice(4, 6);
  const total = DiceService.sumDice(resultadoDados);

  // Verificar si el evento ya ha sido completado
  const eventoCompletado = partida.eventos_completados.includes(total);

  return {
    dados: resultadoDados,
    total,
    eventoCompletado,
    guardarEnPartida: false // No guardamos en la partida automáticamente
  };
}

module.exports = {
  rollDice,
  rollForAction
};