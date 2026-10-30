import { useEffect, useState } from "react";
import { obtenerFirmantesSugeridos } from "../../services/observadorApi";

/**
 * El padre y la madre de la ficha, para la ventana de firma
 * (`docs/funcionalidades/FIRMA_OBSERVADOR.md`).
 *
 * Solo pregunta cuando la ventana está abierta (`activo`), y **una vez por
 * estudiante**: firmar varias anotaciones seguidas no vuelve a pedirlos. Si la
 * consulta falla -o el servidor responde 403-, la lista queda vacía y la
 * ventana se sigue llenando a mano: las sugerencias ayudan, no son necesarias.
 */

const SIN_CARGAR = { estudianteId: null, sugeridos: [] };

export default function useFirmantesSugeridos({ estudianteId, activo }) {
  const [cargado, setCargado] = useState(SIN_CARGAR);
  const [cargando, setCargando] = useState(false);

  const yaCargado = cargado.estudianteId === estudianteId;

  useEffect(() => {
    if (!activo || !estudianteId || yaCargado) return undefined;

    const controller = new AbortController();
    setCargando(true);

    obtenerFirmantesSugeridos(estudianteId, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setCargado({ estudianteId, sugeridos: Array.isArray(data) ? data : [] });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCargado({ estudianteId, sugeridos: [] });
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });

    return () => {
      controller.abort();
      setCargando(false);
    };
  }, [activo, estudianteId, yaCargado]);

  return { sugeridos: yaCargado ? cargado.sugeridos : [], cargando };
}
