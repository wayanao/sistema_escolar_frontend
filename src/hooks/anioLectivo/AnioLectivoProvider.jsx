import { useCallback, useEffect, useMemo, useState } from "react";
import { listarAniosLectivos } from "../../services/aniosLectivosApi";
import {
  encontrarAnioActivo,
  normalizarAniosLectivos,
  parametrosAnio,
} from "../../utils/anioLectivo";
import { ContextoAnioLectivo } from "./useAnioLectivo";

// Carga los años una sola vez y guarda cuál está mirando el admin. Envuelve
// solo el layout del admin: el profesor no tiene selector ni pide la lista.
//
// El año elegido vive solo en memoria: recargar la página vuelve al activo,
// para que nadie quede trabajando en un año viejo sin darse cuenta. Si la
// lista no llega, todo sigue como antes: año activo y sin selector.
export default function AnioLectivoProvider({ children }) {
  const [anios, setAnios] = useState([]);
  // `null` = el año activo. Solo cambia cuando el admin elige otro año.
  const [anioSeleccionadoId, setAnioSeleccionadoId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    listarAniosLectivos({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setAnios(normalizarAniosLectivos(data));
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("No se pudo cargar la lista de años lectivos", error);
        }
      });

    return () => controller.abort();
  }, []);

  const anioActivo = useMemo(() => encontrarAnioActivo(anios), [anios]);

  const anioSeleccionado = useMemo(
    () => anios.find((anio) => anio.id === anioSeleccionadoId) ?? anioActivo,
    [anioActivo, anioSeleccionadoId, anios],
  );

  const seleccionarAnio = useCallback(
    (id) => {
      const elegido = anios.find((anio) => anio.id === Number(id));
      if (!elegido) return;
      // Elegir el activo es lo mismo que no elegir: las peticiones vuelven a
      // ser las de siempre y la página no se reinicia de más.
      setAnioSeleccionadoId(elegido.id === anioActivo?.id ? null : elegido.id);
    },
    [anioActivo, anios],
  );

  const volverAlActivo = useCallback(() => setAnioSeleccionadoId(null), []);

  const valor = useMemo(
    () => ({
      anios,
      anioActivo,
      anioSeleccionado,
      anioSeleccionadoId,
      hayVariosAnios: anios.length > 1,
      parametros: parametrosAnio(anioSeleccionadoId, anioActivo?.id ?? null),
      seleccionarAnio,
      volverAlActivo,
    }),
    [anioActivo, anioSeleccionado, anioSeleccionadoId, anios, seleccionarAnio, volverAlActivo],
  );

  return <ContextoAnioLectivo.Provider value={valor}>{children}</ContextoAnioLectivo.Provider>;
}
