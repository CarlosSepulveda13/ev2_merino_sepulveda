// Certamen 2: DOS TRÍOS con cartas 1–10, Jota, Queena, Kaiser y cuatro Jokers.
// Se usan dos barajas de 52 cartas más 4 Jokers: 108 cartas físicas.
// Cada trío debe tener al menos una carta natural; el Joker completa las restantes.

export const PINTAS = [
  { id: "diamante", nombre: "Diamante", simbolo: "♦", color: "roja" },
  { id: "corazon", nombre: "Corazón", simbolo: "♥", color: "roja" },
  { id: "trebol", nombre: "Trébol", simbolo: "♣", color: "negra" },
  { id: "pica", nombre: "Pica", simbolo: "♠", color: "negra" },
];

// Las figuras se guardan con su nombre, NO como 11, 12 o 13.
export const FIGURAS = ["Jota", "Queena", "Kaiser"];
export const VALORES_NATURALES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  ...FIGURAS,
];
export const JOKER = "J"; // J a secas se reserva para el Joker.
export const PINTA_JOKER = "joker";
export const MAX_COPIAS = 2;
export const MAX_JOKERS = 4;
export const MAX_CARTAS_EN_MESA = 6;

export function esJoker(carta) {
  return carta?.numero === JOKER && carta?.pinta === PINTA_JOKER;
}

export function esValorNatural(valor) {
  return VALORES_NATURALES.includes(valor);
}

// Lee el campo escrito por el usuario. J=Joker; JOTA=Jota normal.
// Q y K también se aceptan como atajos de Queena y Kaiser.
export function interpretarNumero(entrada) {
  const texto = String(entrada ?? "").trim().toUpperCase();
  if (texto === "J") return JOKER;
  if (texto === "JOTA") return "Jota";
  if (texto === "Q" || texto === "QUEENA") return "Queena";
  if (texto === "K" || texto === "KAISER") return "Kaiser";
  if (/^(10|[1-9])$/.test(texto)) return Number(texto);
  return null; // Se rechazan entradas 11, 12 y 13.
}

// Compatibilidad visual: si existiera historial antiguo con 11/12/13,
// se muestra como figura, sin volver a permitir esos números al agregar.
export function etiquetaNumero(numero) {
  if (numero === JOKER) return "J";
  if (numero === 11) return "Jota";
  if (numero === 12) return "Queena";
  if (numero === 13) return "Kaiser";
  return String(numero);
}

export function ordenNumero(numero) {
  if (numero === JOKER) return 99;
  if (numero === "Jota" || numero === 11) return 11;
  if (numero === "Queena" || numero === 12) return 12;
  if (numero === "Kaiser" || numero === 13) return 13;
  return typeof numero === "number" && numero >= 1 && numero <= 10 ? numero : 99;
}

export function construirMazo() {
  const mazo = [];
  for (let copia = 1; copia <= MAX_COPIAS; copia += 1) {
    for (const numero of VALORES_NATURALES) {
      for (const pinta of PINTAS) {
        mazo.push({ id: `${numero}-${pinta.id}-${copia}`, numero, pinta: pinta.id });
      }
    }
  }
  for (let copia = 1; copia <= MAX_JOKERS; copia += 1) {
    mazo.push({ id: `joker-${copia}`, numero: JOKER, pinta: PINTA_JOKER });
  }
  return mazo;
}

export const MAZO_COMPLETO = construirMazo();

// Al descartar, la carta reaparece en el mazo de cartas disponibles.
export function obtenerMazoDisponible(cartasEnMesa) {
  const ocupadas = new Set(cartasEnMesa.map((carta) => carta.id));
  return MAZO_COMPLETO.filter((carta) => !ocupadas.has(carta.id));
}

export function contarCopias(cartas, numero, pinta) {
  return cartas.filter((carta) => carta.numero === numero && carta.pinta === pinta).length;
}

export function obtenerGrupos(cartas) {
  const grupos = new Map();
  for (const carta of cartas) {
    if (!esJoker(carta)) {
      grupos.set(carta.numero, (grupos.get(carta.numero) || 0) + 1);
    }
  }
  return [...grupos.entries()].sort((a, b) => ordenNumero(a[0]) - ordenNumero(b[0]));
}

export function validarDosTrios(cartas) {
  if (!Array.isArray(cartas) || cartas.length !== MAX_CARTAS_EN_MESA) {
    return { valido: false, mensaje: "Necesitas exactamente 6 cartas: 3 para cada trío." };
  }

  const repetidas = new Map();
  let cantidadJokers = 0;
  for (const carta of cartas) {
    if (esJoker(carta)) {
      cantidadJokers += 1;
      if (cantidadJokers > MAX_JOKERS) {
        return { valido: false, mensaje: "El mazo contiene solamente 4 Jokers." };
      }
      continue;
    }
    if (!esValorNatural(carta.numero) || !PINTAS.some((pinta) => pinta.id === carta.pinta)) {
      return {
        valido: false,
        mensaje: "Solo se permiten 1–10, Jota, Queena, Kaiser y el Joker J, con pintas válidas.",
      };
    }
    const clave = `${carta.numero}-${carta.pinta}`;
    repetidas.set(clave, (repetidas.get(clave) || 0) + 1);
    if (repetidas.get(clave) > MAX_COPIAS) {
      return { valido: false, mensaje: "Solo existen 2 copias de una misma carta." };
    }
  }

  const grupos = obtenerGrupos(cartas);
  if (grupos.length !== 2) {
    return {
      valido: false,
      mensaje: "Para DOS TRÍOS necesitas dos valores naturales distintos, con al menos una carta de cada uno.",
    };
  }
  if (grupos.some(([, cantidad]) => cantidad > 3)) {
    return { valido: false, mensaje: "Un trío no puede tener más de tres cartas del mismo valor." };
  }

  const asignacion = grupos.map(([numero, naturales]) => ({
    numero,
    naturales,
    comodines: 3 - naturales,
  }));
  const necesarios = asignacion.reduce((total, grupo) => total + grupo.comodines, 0);
  if (necesarios !== cantidadJokers) {
    return { valido: false, mensaje: "Los Jokers no alcanzan o sobran para formar los dos tríos." };
  }

  const numeros = grupos.map(([numero]) => numero);
  const descripcion = asignacion
    .map(({ numero, comodines }) => `trío de ${etiquetaNumero(numero)}${comodines ? ` (con ${comodines} Joker${comodines > 1 ? "s" : ""})` : ""}`)
    .join(" y ");
  return {
    valido: true,
    numeros,
    comodines: cantidadJokers,
    asignacion,
    mensaje: `¡Dos tríos! ${descripcion}.`,
  };
}

// La clave de Firebase no depende del orden ni de qué Joker físico se usó.
export function claveDeJugada(cartas) {
  return cartas
    .map((carta) => esJoker(carta)
      ? "J-joker"
      : `${String(ordenNumero(carta.numero)).padStart(2, "0")}-${carta.pinta}`)
    .sort()
    .join("__");
}

export function cartasParaGuardar(cartas) {
  return cartas.map(({ numero, pinta }) => ({ numero, pinta }));
}
