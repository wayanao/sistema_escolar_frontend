import { useCallback, useRef, useState } from "react";

import { prepararFirma } from "./lienzoFirma";

// Firmas guardadas para el boletín (docs/funcionalidades/FIRMAS_BOLETIN.md):
// la firma nueva mientras se prepara, antes de guardarla. Dos caminos:
//
// - "foto": se elige una foto de la firma en papel; se limpia y se muestra
//   cómo va a salir;
// - "dibujo": se firma con el dedo en el recuadro; cada trazo se limpia igual.
//
// En los dos, `imagen` es lo que se guardaría (PNG con solo la tinta) o
// `null` si todavía no hay nada que guardar.

export default function useEditorFirma() {
  const [modo, setModo] = useState(null);
  const [imagen, setImagen] = useState(null);
  const [preparando, setPreparando] = useState(false);
  const [error, setError] = useState("");
  // Cada preparación lleva un número: si llega tarde (otro trazo u otra foto
  // ya empezó, o se cerró el editor), su resultado se descarta.
  const turnoRef = useRef(0);

  const preparar = useCallback(async (fuente, opciones) => {
    const turno = ++turnoRef.current;
    setPreparando(true);
    setError("");
    try {
      const lista = await prepararFirma(fuente, opciones);
      if (turno === turnoRef.current) setImagen(lista);
    } catch (fallo) {
      if (turno !== turnoRef.current) return;
      setImagen(null);
      setError(fallo?.message || "No se pudo preparar la firma.");
    } finally {
      if (turno === turnoRef.current) setPreparando(false);
    }
  }, []);

  const elegirFoto = useCallback(
    (archivo) => {
      if (!archivo) return;
      setModo("foto");
      setImagen(null);
      preparar(archivo);
    },
    [preparar],
  );

  const abrirDibujo = useCallback(() => {
    turnoRef.current += 1;
    setModo("dibujo");
    setImagen(null);
    setError("");
    setPreparando(false);
  }, []);

  /** Lo que avisa el recuadro: el trazo como `data:` o `null` al borrar. */
  const cambiarDibujo = useCallback(
    (trazo) => {
      if (!trazo) {
        turnoRef.current += 1;
        setImagen(null);
        setError("");
        setPreparando(false);
        return;
      }
      // El trazo no tiene polvo: un toque corto (el punto de una «i») se queda.
      preparar(trazo, { quitarMotas: false });
    },
    [preparar],
  );

  const cerrar = useCallback(() => {
    turnoRef.current += 1;
    setModo(null);
    setImagen(null);
    setError("");
    setPreparando(false);
  }, []);

  return { modo, imagen, preparando, error, elegirFoto, abrirDibujo, cambiarDibujo, cerrar };
}
