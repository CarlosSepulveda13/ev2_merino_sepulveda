import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Carta } from "./components/Carta.jsx";
import { Historial } from "./components/Historial.jsx";
import {
  JOKER,
  PINTAS,
  MAX_CARTAS_EN_MESA,
  MAX_JOKERS,
  esJoker,
  interpretarNumero,
  obtenerMazoDisponible,
  ordenNumero,
  validarDosTrios,
} from "./carioca.js";
import { escucharJugadas, firebaseConfigurado, guardarJugadaUnica } from "./firebase.js";

export default function App() {
  const [numero, setNumero] = useState("");
  const [pinta, setPinta] = useState("corazon");
  const [cartas, setCartas] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [resultado, setResultado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [jugadas, setJugadas] = useState([]);
  const [errorFirebase, setErrorFirebase] = useState("");

  // Las cartas que no están en la mesa siguen disponibles en el mazo.
  const disponibles = obtenerMazoDisponible(cartas);
  const jokersLibres = disponibles.filter(esJoker).length;
  const escribiendoJoker = numero.trim().toUpperCase() === JOKER;

  useEffect(() => {
    if (!firebaseConfigurado) return;
    return escucharJugadas(setJugadas, (error) => setErrorFirebase(error.message));
  }, []);

  function agregarCarta(evento) {
    evento.preventDefault();
    setMensaje("");
    setResultado(null);

    const valor = interpretarNumero(numero);
    if (valor === null) {
      setMensaje("Escribe 1-10, Jota, Queena, Kaiser o J para Joker.");
      return;
    }
    if (cartas.length >= MAX_CARTAS_EN_MESA) {
      setMensaje("Solo puedes tener 6 cartas en la mesa.");
      return;
    }

    // La pinta no importa si es Joker.
    const carta = disponibles.find((item) =>
      valor === JOKER
        ? esJoker(item)
        : item.numero === valor && item.pinta === pinta
    );

    if (!carta) {
      setMensaje(valor === JOKER
        ? "Solo existen 4 Jokers en el mazo."
        : "Solo existen 2 cartas iguales por número y pinta.");
      return;
    }

    setCartas([...cartas, carta]);
    setNumero("");
  }

  function descartarCarta(id) {
    // Al sacar una carta de la mesa, vuelve a estar disponible en el mazo.
    setCartas(cartas.filter((carta) => carta.id !== id));
    setResultado(null);
    setMensaje("");
  }

  function ordenarCartas(criterio) {
    const ordenadas = [...cartas].sort((a, b) => {
      if (criterio === "numero") {
        return ordenNumero(a.numero) - ordenNumero(b.numero);
      }
      const pintaA = esJoker(a) ? 4 : PINTAS.findIndex((p) => p.id === a.pinta);
      const pintaB = esJoker(b) ? 4 : PINTAS.findIndex((p) => p.id === b.pinta);
      return pintaA - pintaB || ordenNumero(a.numero) - ordenNumero(b.numero);
    });
    setCartas(ordenadas);
  }

  async function validarJuego() {
    setMensaje("");
    const validacion = validarDosTrios(cartas);

    if (!validacion.valido) {
      setResultado({ tipo: "error", texto: "NO FORMA JUEGO :C", detalle: validacion.mensaje });
      return;
    }

    if (!firebaseConfigurado) {
      setResultado({ tipo: "aviso", texto: "DOS TRÍOS VÁLIDOS", detalle: "Falta configurar Firebase para guardar." });
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await guardarJugadaUnica(cartas, validacion.numeros);
      if (respuesta.repetida) {
        setResultado({ tipo: "aviso", texto: "JUGADA REPETIDA", detalle: "Esta combinación ya estaba guardada en Firebase." });
      } else {
        setResultado({ tipo: "ok", texto: "DOS TRÍOS VÁLIDOS", detalle: "Jugada guardada en Firebase." });
      }
    } catch (error) {
      setResultado({ tipo: "aviso", texto: "DOS TRÍOS VÁLIDOS", detalle: "No se guardó en Firebase: " + error.message });
    }
    setGuardando(false);
  }

  return (
    <main className="contenedor">
      <h1>Carioca - Dos tríos</h1>
      <p>Agrega seis cartas, forma dos tríos distintos y valida tu jugada.</p>

      <section className="panel">
        <h2>Agregar carta</h2>
        <form onSubmit={agregarCarta} className="formulario">
          <label>
            Número o figura
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="1-10, Jota, Q, K o J"
              disabled={guardando}
            />
          </label>
          <label>
            Pinta
            <select
              value={pinta}
              onChange={(e) => setPinta(e.target.value)}
              disabled={guardando || escribiendoJoker}
            >
              {PINTAS.map((p) => (
                <option key={p.id} value={p.id}>{p.simbolo} {p.nombre}</option>
              ))}
            </select>
          </label>
          <motion.button whileTap={{ scale: 0.93 }} type="submit" disabled={guardando || cartas.length === 6}>
            Agregar
          </motion.button>
        </form>
        <p className="ayuda">J significa Joker (comodín). Jota, Queena y Kaiser son cartas normales.</p>
        {mensaje && <p className="error">{mensaje}</p>}
      </section>

      <section className="panel">
        <h2>Cartas en la mesa ({cartas.length}/6)</h2>
        <p className="contador">Mazo disponible: {disponibles.length}/108 · Jokers disponibles: {jokersLibres}/{MAX_JOKERS}</p>
        <div className="mesa">
          {cartas.length === 0 && <p>La mesa está vacía.</p>}
          {/* Se mantiene AnimatePresence aunque quitemos la última carta. */}
          <div className="cartas">
            <AnimatePresence>
              {cartas.map((carta) => (
                <Carta key={carta.id} carta={carta} descartar={descartarCarta} />
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="acciones">
          <button type="button" onClick={() => ordenarCartas("numero")} disabled={guardando || cartas.length < 2}>Ordenar por número</button>
          <button type="button" onClick={() => ordenarCartas("pinta")} disabled={guardando || cartas.length < 2}>Ordenar por pinta</button>
          <button type="button" className="principal" onClick={validarJuego} disabled={guardando}>
            {guardando ? "Guardando..." : "Validar juego"}
          </button>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {resultado && (
          <motion.div
            key={`${resultado.tipo}-${resultado.texto}-${resultado.detalle}`}
            className={`resultado ${resultado.tipo}`}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.h1 initial={{ y: 15 }} animate={{ y: 0 }}>
              {resultado.texto}
            </motion.h1>
            <p>{resultado.detalle}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Historial jugadas={jugadas} conectado={firebaseConfigurado} error={errorFirebase} />
    </main>
  );
}
