import { useEffect, useRef, useState } from "react";

import { obtenerFirmaInstitucional } from "../../services/firmasApi";

// Firmas guardadas para el boletín (docs/funcionalidades/FIRMAS_BOLETIN.md,
// paso 5): la firma del rector(a) para ponerla, si el admin quiere, en un
// certificado. Solo lee.
//
// Se pide cuando `activo` pasa a `true` (se abrió un certificado), no al
// entrar a la lista de certificados, y una sola vez mientras la pantalla siga
// abierta: abrir otro certificado no la vuelve a pedir.

export default function useFirmaParaImprimir({ activo }) {
  const [imagen, setImagen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const pedidaRef = useRef(false);

  useEffect(() => {
    if (!activo || pedidaRef.current) return undefined;
    pedidaRef.current = true;
    let terminada = false;
    const controlador = new AbortController();
    setCargando(true);
    setError(false);
    obtenerFirmaInstitucional({ signal: controlador.signal })
      .then((respuesta) => {
        terminada = true;
        if (!controlador.signal.aborted) setImagen(respuesta?.imagen || null);
      })
      .catch(() => {
        terminada = true;
        // Si falló, el certificado sale sin poder marcar la firma.
        if (!controlador.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });
    return () => {
      controlador.abort();
      // Cortada a medias (se cerró el certificado, o React montó dos veces en
      // desarrollo): la próxima vez se vuelve a pedir.
      if (!terminada) pedidaRef.current = false;
    };
  }, [activo]);

  return { imagen, cargando, error };
}
