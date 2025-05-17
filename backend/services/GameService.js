// Tablas de datos del juego
const ALIENS = {
  arana: { nombre: 'Araña', danio: 1, objetivo: 3, pg: 1 },
  arana_monstruosa: { nombre: 'Araña Monstruosa', danio: 2, objetivo: 4, pg: 3 },
  sabueso: { nombre: 'Sabueso', danio: 2, objetivo: 5, pg: 2 },
  sabueso_rabioso: { nombre: 'Sabueso Rabioso', danio: 4, objetivo: 7, pg: 6 },
  rastreador: { nombre: 'Rastreador', danio: 3, objetivo: 6, pg: 4 },
  reina: { nombre: 'Reina', danio: 3, objetivo: 8, pg: 8 },
  reina_negra: { nombre: 'Reina Negra', danio: 4, objetivo: 9, pg: 10 }
};

const ITEMS = [
  { nombre: 'Kit de Reparación', efecto: 'Repara 2 puntos de traje', usos: 1 },
  { nombre: 'Analgésico', efecto: 'Reduce 2 puntos de estrés', usos: 1 },
  { nombre: 'Visor', efecto: 'Añade +1 a la precisión del arma', usos: 3 },
  { nombre: 'Munición', efecto: 'Recarga 2 municiones de un arma', usos: 1 },
  { nombre: 'Tanque de O2', efecto: 'Recupera 3 puntos de oxígeno', usos: 1 }
];

// Tablas de exploración
const TABLA_EXPLORACION = [
  { rango: [2, 2], resultado: 'encuentro', alien: 'reina' },
  { rango: [3, 4], resultado: 'encuentro', alien: 'arana' },
  { rango: [5, 6], resultado: 'encuentro', alien: 'sabueso' },
  { rango: [7, 7], resultado: 'encuentro', alien: 'rastreador' },
  { rango: [8, 8], resultado: 'habitacion_vacia' },
  { rango: [9, 9], resultado: 'item', cantidad: 1 },
  { rango: [10, 10], resultado: 'oxigeno', cantidad: 2 },
  { rango: [11, 11], resultado: 'pasajero', cantidad: 1 },
  { rango: [12, 12], resultado: 'codigo_activacion', cantidad: 1 }
];

// Funciones para tirar dados
function tirarDado() {
  return Math.floor(Math.random() * 6) + 1;
}

function tirarDados(cantidad) {
  const resultados = [];
  for (let i = 0; i < cantidad; i++) {
    resultados.push(tirarDado());
  }
  return resultados;
}

function sumarDados(dados) {
  return dados.reduce((sum, value) => sum + value, 0);
}

// Servicio principal del juego
const GameService = {
  // Explorar una habitación
  explorarHabitacion: (partida, coordenadas) => {
    // Validar movimiento
    if (!esMovimientoValido(partida, coordenadas)) {
      return {
        exito: false,
        mensaje: 'Movimiento no válido'
      };
    }

    // Actualizar posición actual
    partida.posicion_actual = { ...coordenadas };

    // Obtener celda actual
    const celda = partida.mapa[coordenadas.y][coordenadas.x];

    // Si la habitación ya fue explorada, realizar revisita
    if (celda.explorado) {
      return revisitarHabitacion(partida, celda);
    }

    // Marcar como explorada
    celda.explorado = true;
    partida.habitaciones_exploradas.push(`${coordenadas.x},${coordenadas.y}`);

    // Consumir oxígeno
    partida.capitan.oxigeno -= 1;
    if (partida.capitan.oxigeno <= 0) {
      return finalizarPartida(partida, 'DERROTA', 'Te has quedado sin oxígeno');
    }

    // Procesar según el tipo de habitación
    let resultado;

    switch (celda.tipo) {
      case 'estacion_oxigeno':
        partida.capitan.oxigeno = Math.min(10, partida.capitan.oxigeno + 3);
        resultado = {
          tipo: 'estacion_oxigeno',
          mensaje: 'Has recuperado 3 puntos de oxígeno'
        };
        break;

      case 'armeria':
        const armasRecargadas = recargarArmas(partida.armas);
        resultado = {
          tipo: 'armeria',
          mensaje: `Has recargado todas tus armas`,
          armas: partida.armas
        };
        break;

      case 'control':
        partida.codigos_activacion += 1;
        resultado = {
          tipo: 'control',
          mensaje: 'Has encontrado un código de activación',
          codigos_activacion: partida.codigos_activacion
        };
        break;

      case 'bahia_carga':
        const itemAleatorio = obtenerItemAleatorio();
        if (partida.mochila.length < 5) {
          partida.mochila.push(itemAleatorio);
        }
        resultado = {
          tipo: 'bahia_carga',
          mensaje: `Has encontrado: ${itemAleatorio.nombre}`,
          item: itemAleatorio
        };
        break;

      case 'evento_aleatorio':
        resultado = procesarEventoAleatorio(partida);
        break;

      case 'bahia_escape':
        if (partida.codigos_activacion >= 6) {
          return finalizarPartida(partida, 'VICTORIA', '¡Has desbloqueado la bahía de escape y escapado con éxito!');
        } else {
          resultado = {
            tipo: 'bahia_escape',
            mensaje: `Necesitas ${6 - partida.codigos_activacion} códigos de activación más para desbloquear la puerta.`
          };
        }
        break;

      case 'explorable':
      default:
        resultado = explorarHabitacionNormal(partida);
        break;
    }

    return {
      exito: true,
      resultado,
      partida
    };
  },

  // Manejar combate
  resolverCombate: (partida, opcionCombate) => {
    const { armaSeleccionada, usarItem } = opcionCombate;
    const encuentro = partida.encuentro_actual;

    if (!encuentro) {
      return {
        exito: false,
        mensaje: 'No hay un combate activo'
      };
    }

    // Verificar si se usa un ítem
    if (usarItem) {
      const resultado = usarItemEnCombate(partida, usarItem);
      if (!resultado.exito) {
        return resultado;
      }
    }

    // Verificar arma seleccionada
    const arma = partida.armas.find(a => a.nombre === armaSeleccionada);
    if (!arma) {
      return {
        exito: false,
        mensaje: 'Arma no encontrada'
      };
    }

    // Verificación de munición - Palanca tiene munición ilimitada
    if (arma.nombre !== 'Palanca' && arma.municion <= 0) {
      return {
        exito: false,
        mensaje: 'El arma no tiene munición'
      };
    }

    // Atacar - Solo restar munición si no es la Palanca
    if (arma.nombre !== 'Palanca') {
      arma.municion -= 1;
    }

    const dados = tirarDados(arma.precision);
    const resultado = sumarDados(dados);
    const alien = ALIENS[encuentro.alien];

    let mensaje = `Has lanzado ${dados.join(' + ')} = ${resultado}. `;

    // Comprobar si el ataque tiene éxito
    if (resultado >= alien.objetivo) {
      encuentro.pg -= arma.danio;
      mensaje += `¡Impacto! Has causado ${arma.danio} puntos de daño.`;

      // Comprobar si el alien ha sido derrotado
      if (encuentro.pg <= 0) {
        // Actualizar logros
        actualizarLogrosAlienDerrotado(partida, encuentro.alien);

        // Eliminar encuentro
        partida.encuentro_actual = null;

        return {
          exito: true,
          victoria: true,
          mensaje: `${mensaje} Has derrotado al ${alien.nombre}.`,
          dados,
          partida
        };
      }
    } else {
      mensaje += `Fallaste el disparo.`;
    }

    // Ataque del alien
    partida.capitan.traje -= alien.danio;
    mensaje += ` El ${alien.nombre} te ha atacado causando ${alien.danio} puntos de daño a tu traje.`;

    // Comprobar derrota
    if (partida.capitan.traje <= 0) {
      return finalizarPartida(partida, 'DERROTA', `Tu traje ha sido destruido por el ${alien.nombre}. Fin del juego.`);
    }

    return {
      exito: true,
      victoria: false,
      mensaje,
      dados,
      encuentro: {
        alien: encuentro.alien,
        pg: encuentro.pg,
        alienData: alien
      },
      partida
    };
  },

  // Sacrificar pasajero
  sacrificarPasajero: (partida, accion) => {
    if (partida.pasajeros <= 0) {
      return {
        exito: false,
        mensaje: 'No tienes pasajeros para sacrificar'
      };
    }

    // Tirar para reacción del pasajero
    const reaccion = tirarDado();

    // Reacciones negativas
    if (reaccion === 1) {
      // Te roban munición y huyen
      partida.armas.forEach(arma => {
        if (arma.municion > 0) arma.municion -= 1;
      });
      partida.pasajeros -= 1;

      return {
        exito: false,
        mensaje: 'El pasajero te roba munición y huye',
        reaccion,
        partida
      };
    }
    else if (reaccion >= 2 && reaccion <= 4) {
      // Gritan de miedo y llaman la atención
      partida.pasajeros -= 1;
      partida.proxima_habitacion_encuentro = true;

      return {
        exito: false,
        mensaje: 'El pasajero grita de miedo y huye, atrayendo la atención de los aliens',
        reaccion,
        partida
      };
    }

    // Reacción heroica (5-6)
    partida.pasajeros -= 1;

    // Aplicar efecto según la acción solicitada
    let mensaje = '';

    switch (accion) {
      case 'escapar_encuentro':
        if (partida.encuentro_actual) {
          partida.encuentro_actual = null;
          mensaje = 'El pasajero se sacrifica, permitiéndote escapar del alien';
        } else {
          mensaje = 'El pasajero se sacrifica, pero no hay ningún encuentro del que escapar';
        }
        break;

      case 'evadir_ataque':
        if (partida.encuentro_actual) {
          // Evitar un ataque en combate
          mensaje = 'El pasajero se interpone, evitando que el alien te ataque en este turno';
          partida.evadir_proximo_ataque = true;
        } else {
          mensaje = 'El pasajero se sacrifica, pero no hay ningún ataque que evadir';
        }
        break;

      case 'recuperar_oxigeno':
        partida.capitan.oxigeno = Math.min(10, partida.capitan.oxigeno + 3);
        mensaje = 'El pasajero te entrega su oxígeno, recuperas 3 puntos de O2';
        break;

      default:
        return {
          exito: false,
          mensaje: 'Acción de sacrificio no válida'
        };
    }

    return {
      exito: true,
      mensaje,
      reaccion,
      partida
    };
  },

  // Usar ítem
  usarItem: (partida, indiceItem) => {
    if (indiceItem < 0 || indiceItem >= partida.mochila.length) {
      return {
        exito: false,
        mensaje: 'Ítem no encontrado'
      };
    }

    const item = partida.mochila[indiceItem];
    let mensaje = '';

    // Aplicar efecto del ítem
    switch (item.nombre) {
      case 'Kit de Reparación':
        partida.capitan.traje = Math.min(6, partida.capitan.traje + 2);
        mensaje = 'Has reparado 2 puntos de tu traje';
        break;

      case 'Analgésico':
        partida.capitan.estres = Math.max(0, partida.capitan.estres - 2);
        mensaje = 'Has reducido 2 puntos de estrés';
        break;

      case 'Visor':
        // El visor se usa durante el combate, aquí solo actualizamos usos
        mensaje = 'Has activado el visor para tu siguiente ataque';
        break;

      case 'Munición':
        // Mostrar selección de arma en frontend, aquí asumimos primera arma no llena
        const arma = partida.armas.find(a => a.municion < a.municion_max);
        if (arma) {
          arma.municion = Math.min(arma.municion_max, arma.municion + 2);
          mensaje = `Has recargado 2 municiones de ${arma.nombre}`;
        } else {
          mensaje = 'Todas tus armas están completamente cargadas';
        }
        break;

      case 'Tanque de O2':
        partida.capitan.oxigeno = Math.min(10, partida.capitan.oxigeno + 3);
        mensaje = 'Has recuperado 3 puntos de oxígeno';
        break;
    }

    // Reducir usos y eliminar si es necesario
    item.usos -= 1;
    if (item.usos <= 0) {
      partida.mochila.splice(indiceItem, 1);
    }

    return {
      exito: true,
      mensaje,
      partida
    };
  }
};

// Función para obtener las celdas adyacentes en un mapa hexagonal
function obtenerCeldasAdyacentes(partida, posicion) {
  const { x, y } = posicion;
  const key = `${x},${y}`;
  
  // Usar las adyacencias explícitamente definidas
  if (partida.adyacencias && partida.adyacencias[key]) {
    return partida.adyacencias[key];
  }
  
  // Si no se encuentran adyacencias (no debería ocurrir), devolver array vacío
  console.error('Adyacencias no encontradas para la posición', posicion);
  return [];
}

// Funciones auxiliares
// Función actualizada para verificar si un movimiento es válido
function esMovimientoValido(partida, coordenadas) {
  const { x, y } = coordenadas;

  // Verificar si las coordenadas son válidas
  if (y < 0 || y >= partida.mapa.length) {
    console.log('Movimiento inválido: Coordenada Y fuera de rango');
    return false;
  }

  // Verificar si X está dentro del rango de la fila
  if (x < 0 || x >= partida.mapa[y].length) {
    console.log('Movimiento inválido: Coordenada X fuera de rango');
    return false;
  }

  // Encontrar la celda destino
  const celda = partida.mapa[y].find(c => c.x === x && c.y === y);

  if (!celda) {
    console.log('Movimiento inválido: Celda no encontrada');
    return false;
  }

  // Verificar si la celda es inaccesible
  if (celda.tipo === 'inaccesible') {
    console.log('Movimiento inválido: Celda inaccesible');
    return false;
  }

  // Verificar si hay puerta bloqueada
  if (celda.puerta_bloqueada && partida.codigos_activacion < celda.codigos_requeridos) {
    console.log('Movimiento inválido: Puerta bloqueada');
    return false;
  }

  // Verificar si hay combate activo
  if (partida.encuentro_actual) {
    console.log('Movimiento inválido: Hay un combate activo');
    return false;
  }

  // Obtener las celdas adyacentes a la posición actual
  const adyacentes = obtenerCeldasAdyacentes(partida, partida.posicion_actual);
  // const adyacentes = obtenerCeldasAdyacentes(partida.mapa, partida.posicion_actual);

  // Debug para ver qué celdas se consideran adyacentes
  console.log('Posición actual:', partida.posicion_actual);
  console.log('Coordenadas destino:', coordenadas);
  console.log('Celdas adyacentes:', adyacentes);

  // Verificar si la celda está en las adyacentes o ya ha sido explorada
  // const esAdyacente = adyacentes.some(adj => adj.x === x && adj.y === y);
  const esAdyacente = adyacentes.some(adj => adj.x === coordenadas.x && adj.y === coordenadas.y);
  const estaExplorada = celda.explorado;

  console.log('Es adyacente:', esAdyacente);
  console.log('Está explorada:', estaExplorada);

  if (!esAdyacente && !estaExplorada) {
    console.log('Movimiento inválido: No es adyacente ni explorada');
    return false;
  }

  return true;
}

function revisitarHabitacion(partida, celda) {
  // Tirar dado para determinar qué sucede al revisitar
  const resultado = tirarDado();

  if (resultado <= 2) {
    // Encuentro con alien
    return iniciarEncuentroAleatorio(partida);
  }
  else if (resultado <= 5) {
    // Habitación vacía, reduce estrés
    partida.capitan.estres = Math.max(0, partida.capitan.estres - 1);
    return {
      exito: true,
      resultado: {
        tipo: 'habitacion_vacia',
        mensaje: 'La habitación está vacía. Te sientes un poco más calmado (-1 Estrés).'
      },
      partida
    };
  }
  else {
    // Encuentras un pasajero
    partida.pasajeros += 1;
    return {
      exito: true,
      resultado: {
        tipo: 'pasajero',
        mensaje: '¡Has encontrado un superviviente! Se une a tu grupo.'
      },
      partida
    };
  }
}

function explorarHabitacionNormal(partida) {
  // Si hay un encuentro pendiente debido a pasajeros que huyeron
  if (partida.proxima_habitacion_encuentro) {
    partida.proxima_habitacion_encuentro = false;
    return iniciarEncuentroAleatorio(partida);
  }

  // Tirar 2d6 para consultar tabla de exploración
  const dado1 = tirarDado();
  const dado2 = tirarDado();
  const suma = dado1 + dado2;

  // Buscar resultado en la tabla
  const entry = TABLA_EXPLORACION.find(e =>
    suma >= e.rango[0] && suma <= e.rango[1]
  );

  if (!entry) {
    return { tipo: 'error', mensaje: 'Error en la tabla de exploración' };
  }

  switch (entry.resultado) {
    case 'encuentro':
      // Iniciar encuentro con alien
      return iniciarEncuentro(partida, entry.alien);

    case 'habitacion_vacia':
      return {
        tipo: 'habitacion_vacia',
        mensaje: 'La habitación está vacía y segura.'
      };

    case 'item':
      const item = obtenerItemAleatorio();
      if (partida.mochila.length < 5) {
        partida.mochila.push(item);
        return {
          tipo: 'item',
          mensaje: `Has encontrado: ${item.nombre}`,
          item
        };
      } else {
        return {
          tipo: 'item_perdido',
          mensaje: 'Has encontrado un ítem, pero tu mochila está llena.'
        };
      }

    case 'oxigeno':
      partida.capitan.oxigeno = Math.min(10, partida.capitan.oxigeno + entry.cantidad);
      return {
        tipo: 'oxigeno',
        mensaje: `Has encontrado un tubo de oxígeno (+${entry.cantidad} O2)`
      };

    case 'pasajero':
      partida.pasajeros += entry.cantidad;
      return {
        tipo: 'pasajero',
        mensaje: `Has encontrado ${entry.cantidad} superviviente(s).`
      };

    case 'codigo_activacion':
      partida.codigos_activacion += entry.cantidad;
      return {
        tipo: 'codigo_activacion',
        mensaje: `¡Has encontrado un código de activación!`
      };
  }
}

function iniciarEncuentro(partida, tipoAlien) {
  const alien = ALIENS[tipoAlien];

  partida.encuentro_actual = {
    alien: tipoAlien,
    pg: alien.pg
  };

  return {
    tipo: 'encuentro',
    mensaje: `¡Te has encontrado con un ${alien.nombre}!`,
    encuentro: {
      alien: tipoAlien,
      pg: alien.pg,
      alienData: alien
    }
  };
}

function iniciarEncuentroAleatorio(partida) {
  // Seleccionar alien aleatorio según probabilidad
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

  return {
    exito: true,
    resultado: iniciarEncuentro(partida, tipoAlien),
    partida
  };
}

function procesarEventoAleatorio(partida) {
  // Tirar 4d6 para obtener un evento aleatorio
  const dados = tirarDados(4);
  const suma = sumarDados(dados);

  // Comprobar si el evento ya ha sido completado
  if (partida.eventos_completados.includes(suma)) {
    // Volver a tirar una vez
    const nuevosDados = tirarDados(4);
    const nuevaSuma = sumarDados(nuevosDados);

    if (partida.eventos_completados.includes(nuevaSuma)) {
      // Si también ha sido completado, ignorar evento
      return {
        tipo: 'evento_ignorado',
        mensaje: 'Este evento ya ha sido completado. Continúas explorando.'
      };
    }

    partida.eventos_completados.push(nuevaSuma);
    return procesarEventoEspecifico(partida, nuevaSuma);
  }

  partida.eventos_completados.push(suma);
  return procesarEventoEspecifico(partida, suma);
}

function procesarEventoEspecifico(partida, numeroEvento) {
  // Implementación de los eventos aleatorios del juego original

  switch (numeroEvento) {
    case 4:
      return {
        tipo: 'evento',
        numero: 4,
        mensaje: 'La habitación está completamente a oscuras y solo se puede escuchar tu respiración...',
        opciones: [
          { id: 'avanzar', texto: 'Avanzar en la oscuridad' },
          { id: 'luces', texto: 'Intentar encender las luces' }
        ]
      };

    case 5:
      return {
        tipo: 'evento',
        numero: 5,
        mensaje: 'Encuentras a un tripulante moribundo, parece ser un antiguo compañero tuyo...',
        opciones: [
          { id: 'curar', texto: 'Curarlo con primeros auxilios' },
          { id: 'registrar', texto: 'Dejarlo morir y registrar su cadáver' }
        ]
      };

    // Simplificado para este ejemplo, se implementarían los 24 eventos
    case 10:
      // Evento que otorga ítem directamente
      const item = ITEMS.find(i => i.nombre === 'Analgésico');
      if (partida.mochila.length < 5) {
        partida.mochila.push(item);
      }
      return {
        tipo: 'evento_item',
        numero: 10,
        mensaje: 'Llegas a una sala médica, mirando a través de las cajas encuentras algo útil.',
        item
      };

    case 22:
      // Evento que reduce estrés
      partida.capitan.estres = 0;
      return {
        tipo: 'evento_descanso',
        numero: 22,
        mensaje: 'Llegas a una habitación segura y puedes descansar unos momentos antes de continuar.'
      };

    default:
      return {
        tipo: 'evento_generico',
        numero: numeroEvento,
        mensaje: 'Un evento misterioso ocurre en esta habitación.'
      };
  }
}

function resolverEventoEspecifico(partida, numeroEvento, opcionSeleccionada) {
  switch (numeroEvento) {
    case 4:
      if (opcionSeleccionada === 'avanzar') {
        // Implementación del evento 14 (ligado al 4)
        if (partida.pasajeros > 0) {
          partida.pasajeros -= 1;
        }
        return {
          tipo: 'evento_resuelto',
          mensaje: 'Avanzando por la oscuridad uno de tus compañeros emite un chillido mortal y desaparece, corriendo a toda velocidad el grupo logra llegar a la salida de la habitación.'
        };
      } else if (opcionSeleccionada === 'luces') {
        // Implementación del evento 20 (ligado al 4)
        // Encuentro con Araña Monstruosa
        partida.encuentro_actual = {
          alien: 'arana_monstruosa',
          pg: ALIENS.arana_monstruosa.pg
        };
        return {
          tipo: 'encuentro',
          mensaje: 'Encuentras el interruptor y cuando enciendes las luces, un alien salta sobre ti...',
          encuentro: {
            alien: 'arana_monstruosa',
            pg: ALIENS.arana_monstruosa.pg,
            alienData: ALIENS.arana_monstruosa
          }
        };
      }
      break;

    case 5:
      if (opcionSeleccionada === 'curar') {
        partida.pasajeros += 1;
        return {
          tipo: 'evento_resuelto',
          mensaje: 'Logras estabilizar al tripulante y se une a tu grupo. (+1 Pasajero)'
        };
      } else if (opcionSeleccionada === 'registrar') {
        const item = obtenerItemAleatorio();
        if (partida.mochila.length < 5) {
          partida.mochila.push(item);
        }
        return {
          tipo: 'evento_item',
          mensaje: 'Registras el cuerpo del tripulante y encuentras algo útil.',
          item
        };
      }
      break;

    // Se implementarían todos los eventos del juego
  }

  return {
    tipo: 'error',
    mensaje: 'Opción no válida para este evento'
  };
}

function obtenerItemAleatorio() {
  const indice = Math.floor(Math.random() * ITEMS.length);
  // Clonar el ítem para no modificar el original
  return { ...ITEMS[indice] };
}

function recargarArmas(armas) {
  armas.forEach(arma => {
    arma.municion = arma.municion_max;
  });
  return armas;
}

function usarItemEnCombate(partida, indiceItem) {
  if (indiceItem < 0 || indiceItem >= partida.mochila.length) {
    return {
      exito: false,
      mensaje: 'Ítem no encontrado'
    };
  }

  const item = partida.mochila[indiceItem];

  // Solo aplicar efectos de ítems útiles en combate
  switch (item.nombre) {
    case 'Kit de Reparación':
      partida.capitan.traje = Math.min(6, partida.capitan.traje + 2);
      break;
    case 'Visor':
      // El efecto del visor se aplicará en el siguiente ataque
      partida.bonus_precision_temporal = 1;
      break;
    default:
      return {
        exito: false,
        mensaje: 'Este ítem no es útil en combate'
      };
  }

  // Reducir usos
  item.usos -= 1;
  if (item.usos <= 0) {
    partida.mochila.splice(indiceItem, 1);
  }

  return {
    exito: true,
    mensaje: `Has usado ${item.nombre}`
  };
}

function actualizarLogrosAlienDerrotado(partida, tipoAlien) {
  if (!partida.logros) {
    partida.logros = {};
  }

  // Contar aliens derrotados
  if (!partida.logros.aliens_derrotados) {
    partida.logros.aliens_derrotados = {};
  }

  if (!partida.logros.aliens_derrotados[tipoAlien]) {
    partida.logros.aliens_derrotados[tipoAlien] = 0;
  }

  partida.logros.aliens_derrotados[tipoAlien] += 1;

  // Verificar logros específicos
  verificarLogrosCompletados(partida);
}

function verificarLogrosCompletados(partida) {
  const logros = partida.logros;
  const alienesVencidos = logros.aliens_derrotados || {};

  // Ejemplos de verificaciones de logros
  if (alienesVencidos.arana && alienesVencidos.arana >= 10) {
    logros.ARACNOFOBICO = true;
  }

  if (alienesVencidos.sabueso && alienesVencidos.sabueso >= 8) {
    logros.CAZADOR = true;
  }

  if (alienesVencidos.rastreador && alienesVencidos.rastreador >= 6) {
    logros.RASTREADOR = true;
  }

  if (alienesVencidos.reina && alienesVencidos.reina >= 4) {
    logros.GUERRERO = true;
  }

  if (alienesVencidos.arana_monstruosa && alienesVencidos.arana_monstruosa >= 1) {
    logros.EXTERMINADOR = true;
  }

  if (alienesVencidos.sabueso_rabioso && alienesVencidos.sabueso_rabioso >= 1) {
    logros.DOMADOR = true;
  }

  if (alienesVencidos.reina_negra && alienesVencidos.reina_negra >= 1) {
    logros.OSCURIDAD = true;
  }

  // Otros logros
  if (partida.eventos_completados.length >= 10) {
    logros.MEMORIAS = true;
  }
}

function finalizarPartida(partida, resultado, mensaje) {
  partida.estado = resultado;

  // Verificar logros finales
  if (resultado === 'VICTORIA') {
    verificarLogrosFinales(partida);
  }

  return {
    exito: true,
    fin: true,
    resultado,
    mensaje,
    logros: partida.logros,
    rango: calcularRangoFinal(partida),
    partida
  };
}

function verificarLogrosFinales(partida) {
  const logros = partida.logros || {};

  // Logro PACIFICADOR: no sacrificar pasajeros
  if (!partida.pasajeros_sacrificados || partida.pasajeros_sacrificados === 0) {
    logros.PACIFICADOR = true;
  }

  // Logro ACUMULADOR: no usar ítems
  if (!partida.items_usados || partida.items_usados === 0) {
    logros.ACUMULADOR = true;
  }

  // Verificar logro según dificultad
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

function calcularRangoFinal(partida) {
  // Contar logros obtenidos
  const logros = partida.logros || {};
  const totalLogros = Object.values(logros).filter(valor => valor === true).length;

  // Determinar rango según cantidad de logros
  if (totalLogros >= 9) return 'GENERAL';
  if (totalLogros >= 8) return 'ALMIRANTE';
  if (totalLogros >= 6) return 'MAYOR';
  if (totalLogros >= 4) return 'CAPITAN';
  if (totalLogros >= 2) return 'OFICIAL';
  return 'CADETE';
}

// Exportar el servicio con todos sus métodos
module.exports = GameService;