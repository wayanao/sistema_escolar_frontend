import { useEffect, useState } from "react";

import { obtenerReferenciaBoletin } from "../../services/boletinesApi";
import { normalizarEstudiantesReferencia } from "../../utils/boletines/ingresoBoletin";

/**
 * Las otras materias del profesor en el mismo curso, para la vista previa del
 * boletín. Consulta solo cuando la vista previa está abierta (`activa`), una
 * vez por clase y periodo: al pasar de un estudiante a otro no vuelve a pedir
 * nada. Si alguna falla, lo intenta de nuevo la próxima vez que se abra.
 *
 * `otrasClases` debe ser la misma lista entre renders (`useMemo`): si cambia
 * en cada render, la consulta se cancela y vuelve a empezar.
 */
export default function useConsultaOtrasMateriasBoletin({
  otrasClases,
  periodo,
  activa,
}) {
  const [resultado, setResultado] = useState({ clave: null, materias: [] });
  const [cargando, setCargando] = useState(false);

  const clave = `${periodo}|${otrasClases.map((clase) => clase.id).join(",")}`;
  const vigente = resultado.clave === clave;
  const necesitaCargar =
    activa
    && otrasClases.length > 0
    && (!vigente || resultado.materias.some((materia) => materia.error));

  useEffect(() => {
    if (!necesitaCargar) return undefined;

    const controller = new AbortController();
    setCargando(true);

    void Promise.all(
      otrasClases.map((clase) =>
        obtenerReferenciaBoletin(clase.id, periodo, { signal: controller.signal })
          .then((data) => ({
            clase,
            estudiantes: normalizarEstudiantesReferencia(data),
            error: false,
          }))
          .catch((error) => {
            if (!controller.signal.aborted) {
              console.error(`No se pudo cargar ${clase.materia} para la vista previa`, error);
            }
            return { clase, estudiantes: [], error: true };
          }),
      ),
    ).then((materias) => {
      if (controller.signal.aborted) return;
      setResultado({ clave, materias });
      setCargando(false);
    });

    return () => {
      controller.abort();
      setCargando(false);
    };
  }, [clave, necesitaCargar, otrasClases, periodo]);

  return {
    materias: vigente ? resultado.materias : [],
    cargando: activa && otrasClases.length > 0 && (cargando || !vigente),
  };
}
