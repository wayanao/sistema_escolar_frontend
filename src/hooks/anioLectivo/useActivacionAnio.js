import { useCallback, useEffect, useState } from "react";
import {
  activarAnioLectivo,
  obtenerVistaPreviaActivacion,
} from "../../services/aniosLectivosApi";
import { listarEstudiantes } from "../../services/estudiantesObservadorApi";
import {
  confirmacionCoincide,
  leerPendientesDeActivacion,
  mensajeDeErrorAnio,
} from "../../utils/anioLectivo";

// Paso 6.7: la vista previa y la activación del año en preparación. El
// backend decide si se puede activar (`puede_activar`) y vuelve a revisarlo
// al activar; aquí solo se muestra y se pide el año escrito.
//
// `onActivado` recibe la respuesta del backend; la página la usa para
// recargar los años y dejar elegido el nuevo activo. El resultado se conserva
// aunque el año en preparación desaparezca de la lista al activarse.
//
// Ajuste del 2026-10-30: con la vista previa llegan los matriculados del año
// en preparación, para mostrar quién va en cada curso. Viajan juntos para que
// las recargas de siempre (matricular, marcar, editar, "Actualizar") traigan
// los dos.
export default function useActivacionAnio(anioPreparacion, { onActivado } = {}) {
  const anioLectivoId = anioPreparacion?.id ?? null;
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [matriculados, setMatriculados] = useState(null);
  const [cargandoVistaPrevia, setCargandoVistaPrevia] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [activando, setActivando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  const recargarVistaPrevia = useCallback(async ({ signal } = {}) => {
    if (!anioLectivoId) return;
    setCargandoVistaPrevia(true);
    try {
      // Con el id de un año que no es el activo, el backend devuelve solo sus
      // matriculados, cada uno con su curso de ese año. "todos": también
      // quien conserva otro estado (decisión del paso 6.3).
      const [datos, estudiantes] = await Promise.all([
        obtenerVistaPreviaActivacion(anioLectivoId, { signal }),
        listarEstudiantes("todos", {
          parametrosAnio: { anio_lectivo_id: anioLectivoId },
          signal,
        }),
      ]);
      if (signal?.aborted) return;
      setVistaPrevia(datos);
      setMatriculados(Array.isArray(estudiantes) ? estudiantes : []);
    } catch (err) {
      if (signal?.aborted) return;
      setError(
        mensajeDeErrorAnio(err, "No se pudo cargar la vista previa de la activación."),
      );
    } finally {
      if (!signal?.aborted) setCargandoVistaPrevia(false);
    }
  }, [anioLectivoId]);

  useEffect(() => {
    if (!anioLectivoId) {
      setVistaPrevia(null);
      setMatriculados(null);
      setConfirmacion("");
      return undefined;
    }
    const controller = new AbortController();
    void recargarVistaPrevia({ signal: controller.signal });
    return () => controller.abort();
  }, [anioLectivoId, recargarVistaPrevia]);

  const activar = useCallback(async () => {
    if (!anioPreparacion || !confirmacionCoincide(confirmacion, anioPreparacion.anio)) {
      return { estado: "validacion" };
    }

    setActivando(true);
    setError("");
    let datos;
    try {
      datos = await activarAnioLectivo(anioPreparacion.id, Number(confirmacion.trim()));
    } catch (err) {
      const pendientes = leerPendientesDeActivacion(err);
      if (pendientes) {
        setVistaPrevia((actual) =>
          actual
            ? {
                ...actual,
                puede_activar: false,
                sin_decidir: pendientes,
                resumen: { ...actual.resumen, sin_decidir: pendientes.length },
              }
            : actual,
        );
      }
      setError(mensajeDeErrorAnio(err, "No se pudo activar el año."));
      setActivando(false);
      return { estado: "error", error: err };
    }

    setResultado(datos);
    setConfirmacion("");
    // La activación ya ocurrió: si falla recargar los años, no se presenta como
    // fallida para que nadie intente repetirla.
    try {
      await onActivado?.(datos);
    } catch {
      setError(
        `${anioPreparacion.anio} quedó activo, pero no se pudo actualizar la lista de años. Recarga la página.`,
      );
    }
    setActivando(false);
    return { estado: "exito", resultado: datos };
  }, [anioPreparacion, confirmacion, onActivado]);

  return {
    vistaPrevia,
    matriculados,
    cargandoVistaPrevia,
    confirmacion,
    setConfirmacion,
    activando,
    resultado,
    error,
    activar,
    recargarVistaPrevia,
  };
}
