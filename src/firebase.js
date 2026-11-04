import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { cartasParaGuardar, claveDeJugada } from "./carioca.js";

const configuracion = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// No fingir guardados exitosos cuando aún no se configuró Firebase.
export const firebaseConfigurado = ["apiKey", "authDomain", "projectId", "appId"].every(
  (campo) => configuracion[campo] && !configuracion[campo].includes("REEMPLAZAR")
);

const app = firebaseConfigurado ? initializeApp(configuracion) : null;
const db = app ? getFirestore(app) : null;
export const NOMBRE_COLECCION = "jugadascarioca";

export async function guardarJugadaUnica(cartas, numeros) {
  if (!db) throw new Error("FIREBASE_SIN_CONFIGURAR");

  const clave = claveDeJugada(cartas);
  const referencia = doc(db, NOMBRE_COLECCION, clave);

  // La transacción impide guardar dos veces exactamente las mismas 6 cartas,
  // incluso si dos personas presionan Validar a la vez.
  return runTransaction(db, async (transaccion) => {
    const existente = await transaccion.get(referencia);
    if (existente.exists()) return { guardada: false, repetida: true };

    transaccion.set(referencia, {
      clave,
      tipo: "dos_trios",
      numeros,
      cartas: cartasParaGuardar(cartas),
      creadoEn: serverTimestamp(),
    });
    return { guardada: true, repetida: false };
  });
}

export function escucharJugadas(alCambiar, alError) {
  if (!db) return () => {};
  const consulta = query(
    collection(db, NOMBRE_COLECCION),
    orderBy("creadoEn", "desc"),
    limit(8)
  );
  return onSnapshot(
    consulta,
    (instantanea) => {
      alCambiar(instantanea.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
      })));
    },
    alError
  );
}
