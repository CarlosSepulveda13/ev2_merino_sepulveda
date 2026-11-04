import React from "react";
import { PINTAS, esJoker, etiquetaNumero } from "../carioca.js";

export function Historial({ jugadas, conectado, error }) {
  return (
    <section className="panel historial">
      <h2>Jugadas guardadas</h2>
      {!conectado && <p>Configura Firebase en el archivo .env para guardar jugadas.</p>}
      {error && <p className="error">Error de Firebase: {error}</p>}
      {conectado && !error && jugadas.length === 0 && <p>Todavía no hay jugadas guardadas.</p>}
      {jugadas.map((jugada) => (
        <div key={jugada.id} className="jugada-guardada">
          <strong>Dos tríos</strong>
          <div className="lista-mini-cartas">
            {(jugada.cartas || []).map((carta, i) => {
              const simbolo = esJoker(carta)
                ? "★"
                : PINTAS.find((p) => p.id === carta.pinta)?.simbolo || "?";
              return <span key={i}>{etiquetaNumero(carta.numero)}{simbolo}</span>;
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
