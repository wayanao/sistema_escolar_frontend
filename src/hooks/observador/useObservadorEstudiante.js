import { useCallback, useEffect, useRef, useState } from "react";
import { obtenerObservador } from "../../services/observadorApi";
import { periodoParaConsulta } from "../../utils/observador/anotaciones";

/**
 * Consulta de la bitácora de un estudiante, con descarte de respuestas
 * obsoletas.
 *
 * **Una sola petición pinta la pantalla entera.** Ahí es donde muere el fallo
 * que reportó el usuario: la pantalla vieja monta un componente por alumno y
 * cada uno pide lo suyo -12 peticiones, 16-20 s, y el hook se rinde a los
 * 10 s-. Aquí se abre un alumno y se pide una vez.
 *
 * Cambiar de periodo sí vuelve a preguntar, porque es otra consulta; cambiar
 * de agrupación o de vista **no debe** hacerlo.
 */

/** El estudiante no existe. Es distinto de que no tenga anotaciones todavía:
 * son dos mensajes distintos en pantalla y no deben mezclarse. */
export const ERROR_ESTUDIANTE_NO_EXISTE = "no_existe";

/** Cualquier otro fallo de la consulta. */
export const ERROR_CONSULTA = "consulta";

const SIN_CARGAR = { estudianteId: null, nivel: null, anotaciones: [] };

export default function useObservadorEstudiante({ estudianteId, periodo }) {
  // Lo cargado se guarda junto al alumno del que salió. Sin eso, abrir un
  // segundo alumno enseñaría un instante el nivel del anterior: el título
  // diría "Luis · Primaria" cuando Luis es de preescolar. Al cambiar solo de
  // periodo el alumno sigue siendo el mismo, así que el nivel no parpadea.
  const [cargado, setCargado] = useState(SIN_CARGAR);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!estudianteId) {
      setCargado(SIN_CARGAR);
      setCargando(false);
      setError(null);
      return undefined;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const vigente = () =>
      controllerRef.current === controller && !controller.signal.aborted;

    setCargando(true);
    setError(null);

    obtenerObservador(estudianteId, {
      periodo: periodoParaConsulta(periodo),
      signal: controller.signal,
    })
      .then((data) => {
        if (!vigente()) return;
        setCargado({
          estudianteId,
          nivel: data?.nivel ?? null,
          anotaciones: data?.anotaciones || [],
        });
      })
      .catch((fallo) => {
        if (!vigente()) return;
        setCargado(SIN_CARGAR);
        setError(
          fallo?.response?.status === 404
            ? ERROR_ESTUDIANTE_NO_EXISTE
            : ERROR_CONSULTA,
        );
      })
      .finally(() => {
        if (vigente()) setCargando(false);
      });

    return () => {
      controller.abort();
    };
  }, [estudianteId, periodo, intento]);

  /** Vuelve a pedir la bitácora. Sirve para el botón de reintentar cuando la
   * consulta falla y para refrescar después de guardar una anotación. */
  const recargar = useCallback(() => {
    setIntento((actual) => actual + 1);
  }, []);

  const esDelAlumnoAbierto = cargado.estudianteId === estudianteId;

  return {
    nivel: esDelAlumnoAbierto ? cargado.nivel : null,
    anotaciones: esDelAlumnoAbierto ? cargado.anotaciones : [],
    cargando,
    error,
    recargar,
  };
}
