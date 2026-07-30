import { useEffect, useMemo, useState } from "react";
import { listarClasesProfesor } from "../../services/planeacionesApi";

export default function useClasesPlaneacionProfesor({
  profesorId,
  asignacionInicial = "",
  onError,
}) {
  const [asignacionId, setAsignacionId] = useState(
    asignacionInicial || localStorage.getItem("asignacionId") || "",
  );
  const [clases, setClases] = useState([]);
  const [cargandoClases, setCargandoClases] = useState(Boolean(profesorId));

  useEffect(() => {
    if (!profesorId) {
      setCargandoClases(false);
      return;
    }

    let activa = true;
    setCargandoClases(true);

    listarClasesProfesor(profesorId)
      .then((data) => {
        if (!activa) return;
        const siguientesClases = Array.isArray(data) ? data : [];
        setClases(siguientesClases);
        setAsignacionId((actual) => {
          const existeAsignacionActual = siguientesClases.some(
            (claseItem) => String(claseItem.id) === String(actual),
          );
          if (actual && existeAsignacionActual) return actual;

          if (siguientesClases.length === 0) {
            localStorage.removeItem("asignacionId");
            return "";
          }

          const primeraAsignacion = String(siguientesClases[0].id);
          localStorage.setItem("asignacionId", primeraAsignacion);
          return primeraAsignacion;
        });
      })
      .catch((requestError) => {
        if (!activa) return;
        console.error("Error cargando clases", requestError);
        onError?.("No se pudieron cargar tus clases asignadas.");
      })
      .finally(() => {
        if (activa) setCargandoClases(false);
      });

    return () => {
      activa = false;
    };
  }, [onError, profesorId]);

  useEffect(() => {
    if (!asignacionId) return;
    localStorage.setItem("asignacionId", String(asignacionId));
  }, [asignacionId]);

  const claseSeleccionada = useMemo(
    () =>
      clases.find(
        (claseItem) => String(claseItem.id) === String(asignacionId),
      ),
    [clases, asignacionId],
  );

  const clasesUnicas = useMemo(() => {
    const clasesPorCursoMateria = new Map();

    clases.forEach((claseItem) => {
      const clave = `${claseItem.curso}__${claseItem.materia}`;
      const esAsignacionActual =
        String(claseItem.id) === String(asignacionId);

      if (!clasesPorCursoMateria.has(clave) || esAsignacionActual) {
        clasesPorCursoMateria.set(clave, claseItem);
      }
    });

    return Array.from(clasesPorCursoMateria.values());
  }, [clases, asignacionId]);

  return {
    asignacionId,
    setAsignacionId,
    claseSeleccionada,
    clasesUnicas,
    cargandoClases,
  };
}
