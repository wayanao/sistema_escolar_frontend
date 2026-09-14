import { useCallback, useState } from "react";

/**
 * Decide cómo se abre una evidencia ya descargada: un PDF se muestra en una capa
 * sobre la pantalla, para no sacar al profesor de la clase; una imagen sigue
 * abriéndose en otra pestaña, como siempre.
 */
export default function useAperturaEvidencia({ url, esPdf }) {
  const [visorAbierto, setVisorAbierto] = useState(false);

  const abrir = useCallback(() => {
    if (!url) return;
    if (esPdf) {
      setVisorAbierto(true);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }, [esPdf, url]);

  const cerrar = useCallback(() => setVisorAbierto(false), []);

  return { abrir, cerrar, visorAbierto };
}
