import { useCallback, useEffect, useRef, useState } from "react";
import { listarMisEstudiantes } from "../../services/observadorApi";

/**
 * Los alumnos del profesor, de todos sus cursos.
 *
 * **Una sola petición, sin necesidad de elegir clase.** Sustituye a
 * `usePlanillaObservador` en esta pantalla: aquélla pedía los alumnos de *una*
 * asignación, y era lo único que ataba el observador a la materia.
 *
 * `usePlanillaObservador` no se toca: la pantalla vieja (`/Formulario`) sigue
 * usándola.
 */

/** Quien pide no es profesor. El admin entra al observador por la ficha del
 * alumno, no por esta lista. */
export const ERROR_SIN_LISTA = "sin_lista";

/** Cualquier otro fallo de la consulta. */
export const ERROR_CONSULTA_LISTA = "consulta";

export default function useMisEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);
  const controllerRef = useRef(null);

  useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const vigente = () =>
      controllerRef.current === controller && !controller.signal.aborted;

    setCargando(true);
    setError(null);

    listarMisEstudiantes({ signal: controller.signal })
      .then((data) => {
        if (!vigente()) return;
        setEstudiantes(Array.isArray(data) ? data : []);
      })
      .catch((fallo) => {
        if (!vigente()) return;
        setEstudiantes([]);
        setError(
          fallo?.response?.status === 403
            ? ERROR_SIN_LISTA
            : ERROR_CONSULTA_LISTA,
        );
      })
      .finally(() => {
        if (vigente()) setCargando(false);
      });

    return () => {
      controller.abort();
    };
  }, [intento]);

  const recargar = useCallback(() => {
    setIntento((actual) => actual + 1);
  }, []);

  return { estudiantes, cargando, error, recargar };
}
