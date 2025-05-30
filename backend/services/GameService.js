// Tablas de datos del juego

// ARMAS COMPLETAS SEGÚN ESPECIFICACIONES
const ARMAS = {
  'Palanca': { nombre: 'Palanca', danio: 1, precision: 1, municion: null, municion_max: null },
  'Pistola de Plasma': { nombre: 'Pistola de Plasma', danio: 2, precision: 3, municion: 4, municion_max: 4 },
  'Aguijón': { nombre: 'Aguijón', danio: 3, precision: 2, municion: 3, municion_max: 3 },
  'Pistola Laser': { nombre: 'Pistola Laser', danio: 3, precision: 3, municion: 2, municion_max: 2 },
  'Blaster': { nombre: 'Blaster', danio: 4, precision: 2, municion: 2, municion_max: 2 }
};

// ALIENS COMPLETOS CON INFORMACIÓN DE SACRIFICIO
const ALIENS = {
  arana: { nombre: 'Araña', danio: 1, objetivo: 3, pg: 1, sacrificio_requerido: 1 },
  arana_monstruosa: { nombre: 'Araña Monstruosa', danio: 2, objetivo: 4, pg: 3, sacrificio_requerido: 1 },
  sabueso: { nombre: 'Sabueso', danio: 2, objetivo: 5, pg: 2, sacrificio_requerido: 1 },
  sabueso_rabioso: { nombre: 'Sabueso Rabioso', danio: 4, objetivo: 7, pg: 6, sacrificio_requerido: 2 },
  rastreador: { nombre: 'Rastreador', danio: 3, objetivo: 6, pg: 4, sacrificio_requerido: 1 },
  reina: { nombre: 'Reina', danio: 3, objetivo: 8, pg: 8, sacrificio_requerido: 2 },
  reina_negra: { nombre: 'Reina Negra', danio: 4, objetivo: 9, pg: 10, sacrificio_requerido: 3 }
};

const ITEMS = [
  { nombre: 'Kit de Reparación', efecto: 'Repara 2 puntos de traje', usos: 1 },
  { nombre: 'Analgésico', efecto: 'Reduce 2 puntos de estrés', usos: 1 },
  { nombre: 'Visor', efecto: 'Añade +1 a la precisión del arma', usos: 3 },
  { nombre: 'Munición', efecto: 'Recarga 2 municiones de un arma', usos: 1 },
  { nombre: 'Tanque de O2', efecto: 'Recupera 3 puntos de oxígeno', usos: 1 }
];

// Constantes de dificultad para armas disponibles
const ARMAS_POR_DIFICULTAD = {
  'MUY_FACIL': ['Palanca', 'Pistola de Plasma', 'Aguijón', 'Pistola Laser', 'Blaster'],
  'NORMAL': ['Palanca', 'Pistola de Plasma', 'Aguijón', 'Pistola Laser'],
  'DIFICIL': ['Palanca', 'Pistola de Plasma', 'Aguijón'],
  'LOCURA': ['Palanca', 'Pistola de Plasma']
};

// Configuración inicial por dificultad
const CONFIG_DIFICULTAD = {
  'MUY_FACIL': { traje_inicial: 5, estres_inicial: 0 },
  'NORMAL': { traje_inicial: 4, estres_inicial: 1 },
  'DIFICIL': { traje_inicial: 3, estres_inicial: 2 },
  'LOCURA': { traje_inicial: 2, estres_inicial: 3 }
};

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

// NUEVAS FUNCIONES PARA COMBATE AVANZADO

// Inicializar combate avanzado
function iniciarCombateAvanzado(partida, tipoAlien) {
  const alien = ALIENS[tipoAlien];
  if (!alien) {
    throw new Error(`Tipo de alien no válido: ${tipoAlien}`);
  }

  const combateState = {
    fase: 'preparacion',
    turno: 1,
    acciones_disponibles: generarAccionesDisponibles(partida, 'preparacion'),
    historial: [],
    alien_pg_inicial: alien.pg,
    puede_usar_estres: partida.capitan.estres < 3
  };

  partida.combate_actual = combateState;
  partida.encuentro_actual = {
    alien: tipoAlien,
    pg: alien.pg,
    alienData: alien
  };

  return {
    exito: true,
    combate_estado: combateState,
    mensaje: `¡Combate iniciado contra ${alien.nombre}!`,
    partida
  };
}

// Generar acciones disponibles según la fase
function generarAccionesDisponibles(partida, fase) {
  const acciones = [];

  switch (fase) {
    case 'preparacion':
      // Usar ítems pre-combate
      if (partida.mochila.length > 0) {
        acciones.push({
          tipo: 'usar_item',
          disponible: true,
          descripcion: 'Usar ítem antes del combate'
        });
      }
      
      // Sacrificar pasajero para escapar
      if (partida.pasajeros > 0) {
        acciones.push({
          tipo: 'sacrificar_pasajero',
          disponible: true,
          descripcion: 'Sacrificar pasajero para escapar',
          parametros: { accion: 'escapar_encuentro' }
        });
      }

      // Continuar al combate
      acciones.push({
        tipo: 'continuar',
        disponible: true,
        descripcion: 'Comenzar combate'
      });
      break;

    case 'seleccion_arma':
      // Seleccionar arma con munición
      partida.armas.forEach(arma => {
        if (arma.nombre === 'Palanca' || arma.municion > 0) {
          acciones.push({
            tipo: 'seleccionar_arma',
            disponible: true,
            descripcion: `Usar ${arma.nombre} (${arma.municion === null ? '∞' : arma.municion} munición)`,
            parametros: { arma: arma.nombre }
          });
        }
      });
      break;

    case 'lanzamiento':
      // Si ya hay datos de lanzamiento, permitir continuar a fase de estrés
      if (partida.combate_actual.datos_lanzamiento) {
        acciones.push({
          tipo: 'continuar',
          disponible: true,
          descripcion: 'Continuar al uso de estrés'
        });
      } else {
        // Si no hay datos, mostrar opción de lanzar dados
        acciones.push({
          tipo: 'lanzar_dados',
          disponible: true,
          descripcion: 'Lanzar dados de ataque'
        });
      }
      break;

    case 'uso_estres':
      if (partida.capitan.estres < 3 && partida.combate_actual.datos_lanzamiento) {
        // Alterar resultado de dados
        acciones.push({
          tipo: 'usar_estres',
          disponible: true,
          descripcion: 'Alterar resultado de dado (+1 o -1)',
          costo: 1,
          parametros: { accion: 'alterar_resultado' }
        });

        // Volver a tirar dados
        acciones.push({
          tipo: 'usar_estres',
          disponible: true,
          descripcion: 'Volver a tirar un dado',
          costo: 1,
          parametros: { accion: 'volver_a_tirar' }
        });

        // Reparar traje
        acciones.push({
          tipo: 'usar_estres',
          disponible: true,
          descripcion: 'Reparar traje (+1 punto)',
          costo: 1,
          parametros: { accion: 'reparar_traje' }
        });
      }

      // Continuar sin usar estrés
      acciones.push({
        tipo: 'continuar',
        disponible: true,
        descripcion: 'Continuar sin usar estrés'
      });
      break;

    case 'resultado':
      // Usar ítems durante combate
      if (partida.mochila.length > 0) {
        acciones.push({
          tipo: 'usar_item',
          disponible: true,
          descripcion: 'Usar ítem'
        });
      }

      // Sacrificar pasajero para evadir
      if (partida.pasajeros > 0 && partida.encuentro_actual && partida.encuentro_actual.pg > 0) {
        acciones.push({
          tipo: 'sacrificar_pasajero',
          disponible: true,
          descripcion: 'Sacrificar pasajero para evadir ataque',
          parametros: { accion: 'evadir_ataque' }
        });
      }

      // Continuar turno
      acciones.push({
        tipo: 'continuar',
        disponible: true,
        descripcion: 'Continuar'
      });
      break;
  }

  return acciones;
}

// Procesar selección de arma
function procesarSeleccionArma(partida, nombreArma) {
  const arma = partida.armas.find(a => a.nombre === nombreArma);
  if (!arma) {
    return {
      exito: false,
      mensaje: 'Arma no encontrada'
    };
  }

  // Verificar munición (Palanca tiene munición ilimitada)
  if (arma.nombre !== 'Palanca' && arma.municion <= 0) {
    return {
      exito: false,
      mensaje: 'El arma no tiene munición'
    };
  }

  // Consumir munición
  if (arma.nombre !== 'Palanca') {
    arma.municion -= 1;
  }

  // Guardar el arma seleccionada pero NO lanzar dados aún
  partida.combate_actual.arma_seleccionada = { ...arma };
  partida.combate_actual.fase = 'lanzamiento';
  partida.combate_actual.acciones_disponibles = [
    {
      tipo: 'lanzar_dados',
      disponible: true,
      descripcion: 'Lanzar dados de ataque'
    }
  ];

  // Agregar entrada al historial
  partida.combate_actual.historial.push({
    turno: partida.combate_actual.turno,
    accion: `Arma seleccionada: ${arma.nombre}`,
    resultado: `Preparado para atacar con ${arma.nombre}`
  });

  return {
    exito: true,
    mensaje: `Has seleccionado ${arma.nombre}. ¡Presiona el botón para lanzar los dados!`,
    combate_estado: partida.combate_actual,
    partida
  };
}

// Lanzar dados en combate
function lanzarDadosEnCombate(partida) {
  if (!partida.combate_actual || partida.combate_actual.fase !== 'lanzamiento') {
    return {
      exito: false,
      mensaje: 'No se puede lanzar dados en esta fase del combate'
    };
  }

  const arma = partida.combate_actual.arma_seleccionada;
  if (!arma) {
    return {
      exito: false,
      mensaje: 'No hay arma seleccionada'
    };
  }

  // Aplicar bonus de precisión temporal si existe
  const precisionFinal = arma.precision + (partida.bonus_precision_temporal || 0);
  partida.bonus_precision_temporal = 0; // Consumir el bonus

  // Tirar dados
  const dados = tirarDados(precisionFinal);
  const suma = sumarDados(dados);
  const alien = partida.encuentro_actual.alienData;

  // Guardar datos del lanzamiento
  const datosLanzamiento = {
    dados: [...dados], // Copia de los dados originales
    suma: suma,
    objetivo: alien.objetivo,
    exito: suma >= alien.objetivo,
    arma_usada: { ...arma }
  };

  partida.combate_actual.datos_lanzamiento = datosLanzamiento;
  
  // MANTENER EN FASE DE LANZAMIENTO después de tirar dados
  // La fase solo debe cambiar cuando el frontend lo solicite explícitamente
  partida.combate_actual.fase = 'lanzamiento';
  partida.combate_actual.acciones_disponibles = generarAccionesDisponibles(partida, 'lanzamiento');

  // Agregar entrada al historial
  partida.combate_actual.historial.push({
    turno: partida.combate_actual.turno,
    accion: `Ataque con ${arma.nombre}`,
    resultado: `Tirada: ${dados.join(' + ')} = ${suma} (Objetivo: ${alien.objetivo})`,
    dados: [...dados]
  });

  return {
    exito: true,
    mensaje: `Has lanzado ${dados.join(' + ')} = ${suma}. Objetivo: ${alien.objetivo}`,
    dados: dados,
    combate_estado: partida.combate_actual,
    partida
  };
}

// Usar estrés en combate
function usarEstresEnCombate(partida, accion, parametros = {}) {
  if (partida.capitan.estres >= 3) {
    return {
      exito: false,
      mensaje: 'No puedes usar más estrés (máximo 3 puntos)'
    };
  }

  if (!partida.combate_actual || !partida.combate_actual.datos_lanzamiento) {
    return {
      exito: false,
      mensaje: 'No hay datos de lanzamiento para modificar'
    };
  }

  const datos = partida.combate_actual.datos_lanzamiento;
  let mensaje = '';

  switch (accion) {
    case 'alterar_resultado':
      const { indice_dado, modificacion } = parametros;
      if (indice_dado < 0 || indice_dado >= datos.dados.length) {
        return {
          exito: false,
          mensaje: 'Índice de dado no válido'
        };
      }

      const valorOriginal = datos.dados[indice_dado];
      const valorNuevo = Math.max(1, Math.min(6, valorOriginal + modificacion));
      
      if (!datos.dados_modificados) datos.dados_modificados = [];
      datos.dados_modificados.push({
        indice: indice_dado,
        valor_original: valorOriginal,
        valor_nuevo: valorNuevo
      });

      datos.dados[indice_dado] = valorNuevo;
      datos.suma = sumarDados(datos.dados);
      datos.exito = datos.suma >= datos.objetivo;

      mensaje = `Dado modificado: ${valorOriginal} → ${valorNuevo}. Nueva suma: ${datos.suma}`;
      break;

    case 'volver_a_tirar':
      const indiceDado = parametros.indice_dado;
      if (indiceDado < 0 || indiceDado >= datos.dados.length) {
        return {
          exito: false,
          mensaje: 'Índice de dado no válido'
        };
      }

      const valorAnt = datos.dados[indiceDado];
      const nuevoValor = tirarDado();
      
      if (!datos.dados_relanzados) datos.dados_relanzados = [];
      datos.dados_relanzados.push({
        indice: indiceDado,
        valor_original: valorAnt,
        valor_nuevo: nuevoValor
      });

      datos.dados[indiceDado] = nuevoValor;
      datos.suma = sumarDados(datos.dados);
      datos.exito = datos.suma >= datos.objetivo;

      mensaje = `Dado relanzado: ${valorAnt} → ${nuevoValor}. Nueva suma: ${datos.suma}`;
      break;

    case 'reparar_traje':
      partida.capitan.traje += 1;
      mensaje = 'Has reparado 1 punto de traje usando estrés';
      break;

    default:
      return {
        exito: false,
        mensaje: 'Acción de estrés no válida'
      };
  }

  // Incrementar estrés
  partida.capitan.estres += 1;

  // Agregar al historial
  partida.combate_actual.historial.push({
    turno: partida.combate_actual.turno,
    accion: `Usar estrés: ${accion}`,
    resultado: mensaje
  });

  return {
    exito: true,
    mensaje: mensaje,
    dados_modificados: datos.dados,
    estres_restante: 3 - partida.capitan.estres,
    combate_estado: partida.combate_actual,
    partida
  };
}

// Continuar combate después de acciones de estrés
function continuarCombate(partida) {
  if (!partida.combate_actual || !partida.combate_actual.datos_lanzamiento) {
    return {
      exito: false,
      mensaje: 'No hay combate activo'
    };
  }

  const datos = partida.combate_actual.datos_lanzamiento;
  const alien = partida.encuentro_actual.alienData;
  let mensaje = '';

  // Aplicar resultado del ataque
  if (datos.exito) {
    const danio = datos.arma_usada.danio;
    partida.encuentro_actual.pg -= danio;
    mensaje += `¡Impacto! Has causado ${danio} puntos de daño. `;

    // Agregar al historial
    partida.combate_actual.historial.push({
      turno: partida.combate_actual.turno,
      accion: 'Resultado del ataque',
      resultado: `Impacto exitoso`,
      danio_causado: danio
    });

    // Verificar si el alien fue derrotado
    if (partida.encuentro_actual.pg <= 0) {
      return finalizarCombateVictorioso(partida);
    }
  } else {
    mensaje += 'Fallaste el disparo. ';
    partida.combate_actual.historial.push({
      turno: partida.combate_actual.turno,
      accion: 'Resultado del ataque',
      resultado: 'Ataque fallido'
    });
  }

  // Turno del alien
  return procesarTurnoAlien(partida, mensaje);
}

// Procesar turno del alien
function procesarTurnoAlien(partida, mensajeAnterior = '') {
  let mensaje = mensajeAnterior;
  const alien = partida.encuentro_actual.alienData;

  // Verificar si hay evasión por sacrificio de pasajero
  if (partida.evadir_proximo_ataque) {
    mensaje += `El pasajero evita el ataque del ${alien.nombre} esta vez.`;
    partida.evadir_proximo_ataque = false;
    
    partida.combate_actual.historial.push({
      turno: partida.combate_actual.turno,
      accion: 'Turno del alien',
      resultado: 'Ataque evadido por sacrificio de pasajero'
    });
  } else {
    // Aplicar daño del alien
    const danioAlien = alien.danio;
    partida.capitan.traje -= danioAlien;
    mensaje += `El ${alien.nombre} te ha atacado causando ${danioAlien} puntos de daño a tu traje.`;

    partida.combate_actual.historial.push({
      turno: partida.combate_actual.turno,
      accion: 'Turno del alien',
      resultado: `${alien.nombre} ataca`,
      danio_recibido: danioAlien
    });

    // Verificar derrota
    if (partida.capitan.traje <= 0) {
      return finalizarCombateDerrota(partida, alien);
    }
  }

  // Preparar siguiente turno
  partida.combate_actual.turno += 1;
  partida.combate_actual.fase = 'seleccion_arma';
  partida.combate_actual.datos_lanzamiento = null;
  partida.combate_actual.acciones_disponibles = generarAccionesDisponibles(partida, 'seleccion_arma');

  return {
    exito: true,
    mensaje: mensaje,
    combate_estado: partida.combate_actual,
    partida,
    puede_continuar: true
  };
}

// Finalizar combate victorioso
function finalizarCombateVictorioso(partida) {
  const alien = partida.encuentro_actual.alienData;
  
  // Actualizar contadores de aliens derrotados
  if (!partida.aliens_derrotados) {
    partida.aliens_derrotados = {};
  }
  if (!partida.aliens_derrotados[partida.encuentro_actual.alien]) {
    partida.aliens_derrotados[partida.encuentro_actual.alien] = 0;
  }
  partida.aliens_derrotados[partida.encuentro_actual.alien] += 1;

  // Actualizar logros
  actualizarLogrosAlienDerrotado(partida, partida.encuentro_actual.alien);

  // Limpiar estado de combate
  partida.combate_actual = null;
  partida.encuentro_actual = null;

  return {
    exito: true,
    victoria: true,
    mensaje: `¡Has derrotado al ${alien.nombre}!`,
    partida
  };
}

// Finalizar combate por derrota
function finalizarCombateDerrota(partida, alien) {
  return finalizarPartida(partida, 'DERROTA', `Tu traje ha sido destruido por el ${alien.nombre}. Fin del juego.`);
}

// Servicio principal del juego
const GameService = {
  // Explorar una habitación
  explorarHabitacion: (partida, coordenadas) => {

    // Validar movimiento
    const validacion = esMovimientoValido(partida, coordenadas);
    if (!validacion.valido) {
      console.log('Validación de movimiento fallida:', validacion.mensaje);
      return {
        exito: false,
        mensaje: validacion.mensaje || 'Movimiento no válido'
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
        resultado = {
          tipo: 'armeria',
          mensaje: 'Has llegado a la armería. Selecciona una opción:',
          opciones: [
            { id: 'recargar_armas', texto: 'Recargar todas las armas' },
            { id: 'reparar_traje', texto: 'Reparar todo el traje' },
            { id: 'recargar_y_reparar', texto: 'Recargar 1 arma y 3 ptos de traje' }
          ]
        }; break;

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
  // Resolver combate actualizado
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
    if (usarItem !== undefined && usarItem !== null) {
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

    // Aplicar bonus de precisión temporal si existe
    const precisionFinal = arma.precision + (partida.bonus_precision_temporal || 0);
    partida.bonus_precision_temporal = 0; // Consumir el bonus después de usarlo

    const dados = tirarDados(precisionFinal);
    const resultado = sumarDados(dados);
    const alien = ALIENS[encuentro.alien];

    // Guardar información del combate para posible uso de estrés
    partida.ultimo_combate = {
      dados: dados,
      suma: resultado,
      arma: arma,
      alien: alien,
      objetivo: alien.objetivo
    };

    let mensaje = `Has lanzado ${dados.join(' + ')} = ${resultado}. `;

    // Comprobar si el ataque tiene éxito
    if (resultado >= alien.objetivo) {
      encuentro.pg -= arma.danio;
      mensaje += `¡Impacto! Has causado ${arma.danio} puntos de daño.`;

      // Comprobar si el alien ha sido derrotado
      if (encuentro.pg <= 0) {
        // Actualizar contadores de aliens derrotados
        if (!partida.aliens_derrotados) {
          partida.aliens_derrotados = {};
        }
        if (!partida.aliens_derrotados[encuentro.alien]) {
          partida.aliens_derrotados[encuentro.alien] = 0;
        }
        partida.aliens_derrotados[encuentro.alien] += 1;

        // Eliminar encuentro
        partida.encuentro_actual = null;

        // Actualizar logros
        actualizarLogrosAlienDerrotado(partida, encuentro.alien);

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

    // Ataque del alien (a menos que se evada con un pasajero)
    if (partida.evadir_proximo_ataque) {
      mensaje += ` El pasajero evita el ataque del ${alien.nombre} esta vez.`;
      partida.evadir_proximo_ataque = false; // Consumir la evasión
    } else {
      partida.capitan.traje -= alien.danio;
      mensaje += ` El ${alien.nombre} te ha atacado causando ${alien.danio} puntos de daño a tu traje.`;
    }

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
  // Sacrificar pasajero actualizado
  sacrificarPasajero: (partida, accion) => {
    if (partida.pasajeros <= 0) {
      return {
        exito: false,
        mensaje: 'No tienes pasajeros para sacrificar'
      };
    }

    // Registrar sacrificio para logros
    if (!partida.pasajeros_sacrificados) {
      partida.pasajeros_sacrificados = 0;
    }

    // Tirar para reacción del pasajero
    const reaccion = tirarDado();
    let mensaje = '';

    // Reacciones negativas
    if (reaccion === 1) {
      // Te roban munición y huyen
      let municionRobada = false;
      partida.armas.forEach(arma => {
        if (arma.nombre !== 'Palanca' && arma.municion > 0) {
          arma.municion -= 1;
          municionRobada = true;
        }
      });

      partida.pasajeros -= 1;
      mensaje = municionRobada ?
        'El pasajero te roba munición y huye' :
        'El pasajero intenta robarte munición pero no tienes, simplemente huye';

      return {
        exito: false,
        mensaje,
        reaccion,
        partida
      };
    }
    else if (reaccion >= 2 && reaccion <= 4) {
      // Gritan de miedo y llaman la atención
      partida.pasajeros -= 1;
      partida.proxima_habitacion_encuentro = true;
      mensaje = 'El pasajero grita de miedo y huye, atrayendo la atención de los aliens';

      return {
        exito: false,
        mensaje,
        reaccion,
        partida
      };
    }

    // Reacción heroica (5-6)
    partida.pasajeros -= 1;
    partida.pasajeros_sacrificados += 1;

    // Aplicar efecto según la acción solicitada
    switch (accion) {
      case 'escapar_encuentro':
        if (partida.encuentro_actual) {
          partida.encuentro_actual = null;
          mensaje = 'El pasajero se sacrifica heroicamente, permitiéndote escapar del alien';
        } else {
          mensaje = 'El pasajero se sacrifica, pero no hay ningún encuentro del que escapar';
        }
        break;

      case 'evadir_ataque':
        if (partida.encuentro_actual) {
          mensaje = 'El pasajero se interpone heroicamente, evitando que el alien te ataque en este turno';
          partida.evadir_proximo_ataque = true;
        } else {
          mensaje = 'El pasajero se sacrifica, pero no hay ningún ataque que evadir';
        }
        break;

      case 'recuperar_oxigeno':
        partida.capitan.oxigeno = Math.min(10, partida.capitan.oxigeno + 3);
        mensaje = 'El pasajero te entrega heroicamente su oxígeno, recuperas 3 puntos de O2';
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
        partida.capitan.estres = Math.max(0, partida.capitan.estres - 3);
        mensaje = 'Has reducido 3 puntos de estrés';
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
  },

  // Usar estrés
  usarEstres: (partida, accion, indiceDado = null) => {
    // Verificar nivel de estrés (máximo 3 según el documento)
    if (partida.capitan.estres >= 3) {
      return {
        exito: false,
        mensaje: 'Has alcanzado el nivel máximo de estrés'
      };
    }

    let mensaje = '';

    switch (accion) {
      case 'modificar':
        // Necesitamos el contexto del último combate almacenado
        if (!partida.ultimo_combate || !partida.ultimo_combate.dados || indiceDado === null) {
          return {
            exito: false,
            mensaje: 'No hay dados para modificar o no se especificó cuál modificar'
          };
        }

        // Modificar el dado (+1 o -1)
        const valorOriginal = partida.ultimo_combate.dados[indiceDado];
        // Se permite modificar +1 o -1
        const nuevoValor = Math.min(Math.max(valorOriginal + 1, 1), 6); // Por defecto +1, limitado entre 1-6
        partida.ultimo_combate.dados[indiceDado] = nuevoValor;

        // Recalcular suma
        partida.ultimo_combate.suma = sumarDados(partida.ultimo_combate.dados);

        mensaje = `Has usado 1 punto de estrés para modificar un dado de ${valorOriginal} a ${nuevoValor}`;
        break;

      case 'retirar':
        // Necesitamos el contexto del último combate
        if (!partida.ultimo_combate || !partida.ultimo_combate.dados || indiceDado === null) {
          return {
            exito: false,
            mensaje: 'No hay dados para volver a tirar o no se especificó cuál'
          };
        }

        // Volver a tirar el dado
        const valorAnterior = partida.ultimo_combate.dados[indiceDado];
        const nuevoValorDado = tirarDado();
        partida.ultimo_combate.dados[indiceDado] = nuevoValorDado;

        // Recalcular suma
        partida.ultimo_combate.suma = sumarDados(partida.ultimo_combate.dados);

        mensaje = `Has usado 1 punto de estrés para volver a tirar un dado: ${valorAnterior} -> ${nuevoValorDado}`;
        break;

      case 'reparar':
        // Reparar 1 punto de traje
        if (partida.capitan.traje >= 6) {
          return {
            exito: false,
            mensaje: 'Tu traje ya está al máximo'
          };
        }

        partida.capitan.traje += 1;
        mensaje = 'Has usado 1 punto de estrés para reparar 1 punto de traje';
        break;

      default:
        return {
          exito: false,
          mensaje: 'Acción de estrés no reconocida'
        };
    }

    // Aumentar el estrés
    partida.capitan.estres += 1;

    return {
      exito: true,
      mensaje,
      partida
    };
  },

  // Método resolverArmeria
  resolverArmeria: (partida, opcion, armaSeleccionada) => {
    let mensaje = '';

    switch (opcion) {
      case 'recargar_armas':
        // Recargar todas las armas
        partida.armas.forEach(arma => {
          if (arma.municion !== null) { // Solo recargar armas con munición limitada
            arma.municion = arma.municion_max;
          }
        });
        mensaje = 'Has recargado todas tus armas.';
        break;

      case 'reparar_traje':
        // Reparar todo el traje
        partida.capitan.traje = 6; // Máximo
        mensaje = 'Has reparado completamente tu traje.';
        break;

      case 'recargar_y_reparar':
        // Si no se especificó un arma pero se necesita seleccionar una
        if (!armaSeleccionada) {
          // Obtener lista de armas recargables (excluyendo Palanca)
          const armasRecargables = partida.armas.filter(a =>
            a.nombre !== 'Palanca' && a.municion !== null && a.municion < a.municion_max
          );

          if (armasRecargables.length === 0) {
            mensaje = 'Todas tus armas están completamente cargadas. Has reparado 3 puntos de tu traje.';
            partida.capitan.traje = Math.min(6, partida.capitan.traje + 3);
          } else {
            // Devolver listado de armas para selección
            return {
              exito: true,
              requiereSeleccionArma: true,
              armasDisponibles: armasRecargables.map(a => ({
                id: a.nombre,
                texto: `${a.nombre} (${a.municion}/${a.municion_max})`
              })),
              mensaje: 'Selecciona un arma para recargar:'
            };
          }
        }
        // Si ya se especificó un arma
        else {
          // Buscar el arma seleccionada
          const arma = partida.armas.find(a => a.nombre === armaSeleccionada);
          if (arma && arma.municion !== null) {
            arma.municion = arma.municion_max;
            mensaje = `Has recargado tu ${arma.nombre} y reparado 3 puntos de tu traje.`;
          } else {
            mensaje = 'Arma no encontrada. Solo has reparado 3 puntos de tu traje.';
          }

          // Reparar 3 puntos de traje
          partida.capitan.traje = Math.min(6, partida.capitan.traje + 3);
        }
        break;

      default:
        return {
          exito: false,
          mensaje: 'Opción no válida'
        };
    }

    return {
      exito: true,
      mensaje,
      partida
    };
  },

  // NUEVOS MÉTODOS PARA COMBATE AVANZADO

  // Iniciar combate avanzado
  iniciarCombateAvanzado: (partida, tipoAlien) => {
    return iniciarCombateAvanzado(partida, tipoAlien);
  },

  // Seleccionar arma en combate
  seleccionarArmaEnCombate: (partida, nombreArma) => {
    if (!partida.combate_actual || partida.combate_actual.fase !== 'seleccion_arma') {
      return {
        exito: false,
        mensaje: 'No puedes seleccionar arma en esta fase del combate'
      };
    }

    return procesarSeleccionArma(partida, nombreArma);
  },

  // Lanzar dados en combate
  lanzarDadosEnCombate: (partida) => {
    return lanzarDadosEnCombate(partida);
  },

  // Generar acciones disponibles para el frontend
  generarAccionesDisponibles: (partida, fase) => {
    return generarAccionesDisponibles(partida, fase);
  },

  // Usar estrés en combate
  usarEstresEnCombate: (partida, accion, parametros = {}) => {
    if (!partida.combate_actual || partida.combate_actual.fase !== 'uso_estres') {
      return {
        exito: false,
        mensaje: 'No puedes usar estrés en esta fase del combate'
      };
    }

    return usarEstresEnCombate(partida, accion, parametros);
  },

  // Continuar combate
  continuarCombate: (partida) => {
    if (!partida.combate_actual) {
      return {
        exito: false,
        mensaje: 'No hay combate activo'
      };
    }

    switch (partida.combate_actual.fase) {
      case 'preparacion':
        partida.combate_actual.fase = 'seleccion_arma';
        partida.combate_actual.acciones_disponibles = generarAccionesDisponibles(partida, 'seleccion_arma');
        return {
          exito: true,
          mensaje: 'Combate iniciado. Selecciona un arma.',
          combate_estado: partida.combate_actual,
          partida
        };

      case 'uso_estres':
        return continuarCombate(partida);

      case 'resultado':
        return procesarTurnoAlien(partida);

      default:
        return {
          exito: false,
          mensaje: 'No se puede continuar desde esta fase'
        };
    }
  },

  // Usar ítem en combate avanzado
  usarItemEnCombateAvanzado: (partida, indiceItem) => {
    if (!partida.combate_actual) {
      return {
        exito: false,
        mensaje: 'No hay combate activo'
      };
    }

    const resultado = usarItemEnCombate(partida, indiceItem);
    
    if (resultado.exito && partida.combate_actual) {
      // Actualizar acciones disponibles después de usar ítem
      partida.combate_actual.acciones_disponibles = generarAccionesDisponibles(partida, partida.combate_actual.fase);
    }

    return {
      ...resultado,
      combate_estado: partida.combate_actual
    };
  },

  // Sacrificar pasajero en combate avanzado
  sacrificarPasajeroEnCombateAvanzado: (partida, accion) => {
    if (!partida.combate_actual) {
      return {
        exito: false,
        mensaje: 'No hay combate activo'
      };
    }

    const resultado = GameService.sacrificarPasajero(partida, accion);
    
    if (resultado.exito && accion === 'escapar_encuentro') {
      // Finalizar combate si escapó exitosamente
      partida.combate_actual = null;
    } else if (partida.combate_actual) {
      // Actualizar acciones disponibles
      partida.combate_actual.acciones_disponibles = generarAccionesDisponibles(partida, partida.combate_actual.fase);
    }

    return {
      ...resultado,
      combate_estado: partida.combate_actual
    };
  },

  // Obtener estado del combate
  obtenerEstadoCombate: (partida) => {
    if (!partida.combate_actual) {
      return {
        exito: false,
        mensaje: 'No hay combate activo'
      };
    }

    return {
      exito: true,
      combate_estado: partida.combate_actual,
      encuentro: partida.encuentro_actual,
      partida
    };
  },

  // Finalizar combate manualmente (para testing)
  finalizarCombate: (partida) => {
    partida.combate_actual = null;
    partida.encuentro_actual = null;
    
    return {
      exito: true,
      mensaje: 'Combate finalizado',
      partida
    };
  },

  // MÉTODOS HEREDADOS DEL SISTEMA ANTERIOR (para compatibilidad)

  // Usar estrés (método anterior para compatibilidad)
  usarEstres: (partida, accion, indiceDado) => {
    if (!partida.ultimo_combate) {
      return {
        exito: false,
        mensaje: 'No hay combate reciente para usar estrés'
      };
    }

    if (partida.capitan.estres >= 3) {
      return {
        exito: false,
        mensaje: 'No puedes usar más estrés (máximo 3 puntos)'
      };
    }

    let mensaje = '';
    const ultimoCombate = partida.ultimo_combate;

    switch (accion) {
      case 'alterar_resultado':
        if (indiceDado < 0 || indiceDado >= ultimoCombate.dados.length) {
          return {
            exito: false,
            mensaje: 'Índice de dado no válido'
          };
        }

        const valorOriginal = ultimoCombate.dados[indiceDado];
        const modificacion = valorOriginal >= 6 ? -1 : (valorOriginal <= 1 ? 1 : (Math.random() > 0.5 ? 1 : -1));
        const valorNuevo = Math.max(1, Math.min(6, valorOriginal + modificacion));
        
        ultimoCombate.dados[indiceDado] = valorNuevo;
        ultimoCombate.suma = sumarDados(ultimoCombate.dados);

        mensaje = `Dado modificado: ${valorOriginal} → ${valorNuevo}. Nueva suma: ${ultimoCombate.suma}`;
        break;

      case 'volver_a_tirar':
        if (indiceDado < 0 || indiceDado >= ultimoCombate.dados.length) {
          return {
            exito: false,
            mensaje: 'Índice de dado no válido'
          };
        }

        const valorAnterior = ultimoCombate.dados[indiceDado];
        const nuevoValor = tirarDado();
        ultimoCombate.dados[indiceDado] = nuevoValor;
        ultimoCombate.suma = sumarDados(ultimoCombate.dados);

        mensaje = `Dado relanzado: ${valorAnterior} → ${nuevoValor}. Nueva suma: ${ultimoCombate.suma}`;
        break;

      case 'reparar_traje':
        partida.capitan.traje += 1;
        mensaje = 'Has reparado 1 punto de traje usando estrés';
        break;

      default:
        return {
          exito: false,
          mensaje: 'Acción de estrés no válida'
        };
    }

    // Incrementar estrés
    partida.capitan.estres += 1;

    return {
      exito: true,
      mensaje: mensaje,
      dados_modificados: ultimoCombate.dados,
      suma_final: ultimoCombate.suma,
      estres_restante: 3 - partida.capitan.estres,
      partida
    };
  },

  // Método para obtener información de armas disponibles según dificultad
  obtenerArmasDisponibles: (dificultad) => {
    const armasDisponibles = ARMAS_POR_DIFICULTAD[dificultad] || ARMAS_POR_DIFICULTAD['NORMAL'];
    return armasDisponibles.map(nombre => ({
      ...ARMAS[nombre]
    }));
  },

  // Método para obtener configuración de dificultad
  obtenerConfigDificultad: (dificultad) => {
    return CONFIG_DIFICULTAD[dificultad] || CONFIG_DIFICULTAD['NORMAL'];
  },

  // Método para obtener información de aliens
  obtenerInfoAlien: (tipoAlien) => {
    return ALIENS[tipoAlien] || null;
  },

  // Método para obtener logros de combate
  obtenerLogrosCombate: (partida) => {
    const aliens = partida.aliens_derrotados || {};
    const logros = {};

    // Logros por cantidad de aliens derrotados
    logros.ARACNOFOBICO = (aliens.arana || 0) >= 10;
    logros.CAZADOR = (aliens.sabueso || 0) >= 8;
    logros.RASTREADOR = (aliens.rastreador || 0) >= 6;
    logros.GUERRERO = (aliens.reina || 0) >= 4;
    logros.EXTERMINADOR = (aliens.arana_monstruosa || 0) >= 1;
    logros.DOMADOR = (aliens.sabueso_rabioso || 0) >= 1;
    logros.OSCURIDAD = (aliens.reina_negra || 0) >= 1;
    
    // Logro de pacificador
    logros.PACIFICADOR = (partida.pasajeros_sacrificados || 0) === 0 && partida.estado === 'VICTORIA';

    return logros;
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
// Función para verificar si un movimiento es válido
function esMovimientoValido(partida, coordenadas) {
  const { x, y } = coordenadas;

  // Verificar si las coordenadas son válidas
  if (y < 0 || y >= partida.mapa.length) {
    console.log('Movimiento inválido: Coordenada Y fuera de rango');
    return { valido: false, mensaje: 'Coordenadas fuera de rango' };
  }

  // Verificar si X está dentro del rango de la fila
  if (x < 0 || x >= partida.mapa[y].length) {
    console.log('Movimiento inválido: Coordenada X fuera de rango');
    return { valido: false, mensaje: 'Coordenadas fuera de rango' };
  }

  // Encontrar la celda destino
  const celda = partida.mapa[y].find(c => c.x === x && c.y === y);

  if (!celda) {
    console.log('Movimiento inválido: Celda no encontrada');
    return { valido: false, mensaje: 'Celda no encontrada' };
  }

  // Verificar si la celda es inaccesible
  if (celda.tipo === 'inaccesible') {
    console.log('Movimiento inválido: Celda inaccesible');
    return { valido: false, mensaje: 'Esta zona es inaccesible' };
  }

  // Verificar si ya ha sido explorada para habitaciones de una sola visita
  const habitacionesUnaVisita = ['armeria', 'seguridad', 'control', 'bahia_carga'];
  if (habitacionesUnaVisita.includes(celda.tipo) && celda.explorado) {
    // Mensajes específicos según el tipo de habitación
    let mensaje;
    switch (celda.tipo) {
      case 'armeria':
        mensaje = 'Ya has utilizado los recursos de la armería. Solo se puede acceder una vez.';
        break;
      case 'seguridad':
        mensaje = 'La sala de seguridad ya ha sido inspeccionada y no queda nada de utilidad.';
        break;
      case 'control':
        mensaje = 'Ya has recuperado el código de activación de esta sala de control.';
        break;
      case 'bahia_carga':
        mensaje = 'Ya has recogido todos los suministros de esta bahía de carga.';
        break;
      default:
        mensaje = `La habitación de tipo ${celda.tipo} ya ha sido visitada y no hay nada más que hacer.`;
    }
    console.log('Habitación de una visita ya explorada:', mensaje);
    return { valido: false, mensaje };
  }

  // Verificar si hay puerta bloqueada
  if (celda.puerta_bloqueada && partida.codigos_activacion < celda.codigos_requeridos) {
    console.log('Movimiento inválido: Puerta bloqueada');
    return {
      valido: false,
      mensaje: `Esta puerta está bloqueada. Necesitas ${celda.codigos_requeridos} códigos de activación.`
    };
  }

  // Verificar si hay combate activo
  if (partida.encuentro_actual) {
    console.log('Movimiento inválido: Hay un combate activo');
    return {
      valido: false,
      mensaje: 'No puedes moverte mientras estás en combate.'
    };
  }

  // Obtener las celdas adyacentes a la posición actual
  const adyacentes = obtenerCeldasAdyacentes(partida, partida.posicion_actual);

  // Debug para ver qué celdas se consideran adyacentes
  console.log('Posición actual:', partida.posicion_actual);
  console.log('Coordenadas destino:', coordenadas);
  console.log('Celdas adyacentes:', adyacentes);

  // Verificar si la celda está en las adyacentes
  const esAdyacente = adyacentes.some(adj => adj.x === coordenadas.x && adj.y === coordenadas.y);
  console.log('Es adyacente:', esAdyacente);

  if (!esAdyacente) {
    console.log('Movimiento inválido: No es adyacente');
    return {
      valido: false,
      mensaje: 'Solo puedes moverte a habitaciones adyacentes.'
    };
  }

  return { valido: true, mensaje: '' };
}

function revisitarHabitacion(partida, celda) {

  // Caso especial para estaciones de oxígeno
  if (celda.tipo === 'estacion_oxigeno') {
    partida.capitan.oxigeno = Math.min(10, partida.capitan.oxigeno + 3);
    return {
      exito: true,
      resultado: {
        tipo: 'estacion_oxigeno',
        mensaje: 'Has recuperado 3 puntos de oxígeno'
      },
      partida
    };
  }

  // Tirar dado para determinar qué sucede al revisitar
  const resultado = tirarDado();

  if (resultado <= 2) {
    // 1-2: Encuentro con alien
    return iniciarEncuentroAleatorio(partida);
  }
  else if (resultado <= 5) {
    // 3-5: Habitación vacía, reduce estrés
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
    // 6: Encuentras un pasajero
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

  // Tirar 1d6 para consultar tabla de exploración según el documento
  const dado = tirarDado();

  // Inicializar resultado
  let resultado;

  switch (dado) {
    case 1: // Infestado
      return iniciarEncuentroAleatorio(partida);

    case 2: // Infestado Bahia de carga
      // Añadir un ítem
      const item = obtenerItemAleatorio();
      if (partida.mochila.length < 5) {
        partida.mochila.push(item);
      }

      // Guardar información del ítem para mostrar en mensaje
      const mensajeItem = `Has encontrado ${item.nombre}! Pero también hay un alien.`;

      // Iniciar encuentro
      const resultadoEncuentro = iniciarEncuentroAleatorio(partida);
      resultadoEncuentro.resultado.mensaje = mensajeItem;
      resultadoEncuentro.resultado.itemObtenido = item;

      return resultadoEncuentro;

    case 3: // Infestado Control
      // Añadir código de activación
      partida.codigos_activacion += 1;

      // Iniciar encuentro
      const resultadoControl = iniciarEncuentroAleatorio(partida);
      resultadoControl.resultado.mensaje = "¡Has encontrado un código de activación! Pero también hay un alien.";
      resultadoControl.resultado.codigoObtenido = true;

      return resultadoControl;

    case 4: // Control
      // Añadir código de activación
      partida.codigos_activacion += 1;

      return {
        exito: true,
        resultado: {
          tipo: 'control',
          mensaje: '¡Has encontrado un código de activación!'
        },
        partida
      };

    case 5: // Armería
      // El frontend mostrará las opciones y enviará la elección del usuario
      return {
        exito: true,
        resultado: {
          tipo: 'armeria',
          mensaje: 'Has llegado a la armería. Selecciona una opción:',
          opciones: [
            { id: 'recargar_armas', texto: 'Recargar todas las armas' },
            { id: 'reparar_traje', texto: 'Reparar todo el traje' },
            { id: 'recargar_y_reparar', texto: 'Recargar 1 arma y 3 ptos de traje' }
          ]
        },
        partida
      };

    case 6: // Seguridad
      // Añadir pasajero y remover estrés
      partida.pasajeros += 1;
      partida.capitan.estres = 0;

      return {
        exito: true,
        resultado: {
          tipo: 'seguridad',
          mensaje: '¡Has encontrado un superviviente! También te sientes más tranquilo. (Estrés = 0)'
        },
        partida
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