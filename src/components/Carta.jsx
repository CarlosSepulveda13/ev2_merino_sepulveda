import React from "react";
import { motion } from "framer-motion";
import { esJoker, etiquetaNumero, PINTAS } from "../carioca.js";

export function Carta({ carta, descartar }) {
  const joker = esJoker(carta);
  const pinta = PINTAS.find((p) => p.id === carta.pinta);
  const simbolo = joker ? "★" : pinta.simbolo;
  const rojo = joker || pinta.color === "roja";

  return (
    <motion.div
      layout
      className={`carta ${rojo ? "roja" : "negra"}`}
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -25, rotate: 15, scale: 0.7 }}
      transition={{ duration: 0.25 }}
    >
      <span className="valor-carta">{etiquetaNumero(carta.numero)}</span>
      <span className="pinta-carta">{simbolo}</span>
      <button
        type="button"
        className="descartar"
        onClick={() => descartar(carta.id)}
        title="Descartar y devolver al mazo"
      >
        ×
      </button>
    </motion.div>
  );
}
