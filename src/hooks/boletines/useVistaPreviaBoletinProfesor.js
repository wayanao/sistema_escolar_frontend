import { useCallback, useEffect, useMemo, useState } from "react";

import {
  clasesDelMismoCurso,
  construirMateriaVistaPrevia,
  construirOtraMateriaVistaPrevia,
  correspondeFormularioAEstudiante,
} from "../../utils/boletines/ingresoBoletin";
import useConsultaOtrasMateriasBoletin from "./useConsultaOtrasMateriasBoletin";

const leerNombreDocente = () => {
  try {
    return JSON.parse(localStorage.getItem("profesor") || "{}")?.nombre || "";
  } catch {
    return "";
  }
};

/**
 * Qué estudiante se ve en la vista previa del boletín y cómo pasar al anterior
 * o al siguiente. La materia se arma con lo que hay en pantalla, así que cada
 * cambio del profesor se ve al instante, aunque no esté guardado.
 */
export default function useVistaPreviaBoletinProfesor({
  asignacionId,
  periodo,
  clases,
  estudiantes,
  datosBoletin,
  estadoGuardado,
}) {
  const [estudianteId, setEstudianteId] = useState(null);
  const [docente] = useState(leerNombreDocente);

  // Al cambiar de clase o de periodo, la vista previa abierta ya no aplica.
  useEffect(() => {
    setEstudianteId(null);
  }, [asignacionId, periodo]);

  // Los mismos estudiantes, y en el mismo orden, que muestra la pantalla.
  const visibles = useMemo(
    () =>
      estudiantes.filter((estudiante) =>
        correspondeFormularioAEstudiante(
          datosBoletin[estudiante.estudiante_id],
          estudiante,
        ),
      ),
    [datosBoletin, estudiantes],
  );

  const indice = visibles.findIndex(
    (estudiante) => String(estudiante.estudiante_id) === String(estudianteId),
  );

  // Sus otras materias en el mismo curso: se consultan al abrir la vista previa.
  const otrasClases = useMemo(
    () => clasesDelMismoCurso(clases, asignacionId),
    [asignacionId, clases],
  );
  const { materias: otrasReferencias, cargando: cargandoOtrasMaterias } =
    useConsultaOtrasMateriasBoletin({
      otrasClases,
      periodo,
      activa: indice >= 0,
    });

  const vistaPrevia = useMemo(() => {
    if (indice < 0) return null;
    const estudiante = visibles[indice];
    const clase = clases.find((item) => String(item.id) === String(asignacionId));
    const materia = construirMateriaVistaPrevia({
      datosBoletin,
      estudianteId: estudiante.estudiante_id,
      asignacionId,
      periodo,
      materia: clase?.materia,
      docente,
    });
    if (!materia) return null;

    const estado = estadoGuardado?.[estudiante.estudiante_id] || {};
    const otrasMaterias = otrasReferencias.map(({ clase: otraClase, estudiantes: alumnos, error }) => ({
      clave: String(otraClase.id),
      nombre: otraClase.materia || "",
      error,
      ...(error
        ? { guardada: false, materia: null }
        : construirOtraMateriaVistaPrevia({
            clase: otraClase,
            estudiantes: alumnos,
            estudianteId: estudiante.estudiante_id,
            periodo,
            docente,
          })),
    }));

    return {
      estudianteId: estudiante.estudiante_id,
      nombre: estudiante.nombre,
      curso: clase?.curso || "",
      periodo,
      materia,
      otrasMaterias,
      tieneOtrasMaterias: otrasClases.length > 0,
      cargandoOtrasMaterias,
      posicion: indice + 1,
      total: visibles.length,
      hayAnterior: indice > 0,
      haySiguiente: indice < visibles.length - 1,
      pendienteDeGuardar: !estado.guardado || Boolean(estado.modificado),
    };
  }, [
    asignacionId,
    cargandoOtrasMaterias,
    clases,
    datosBoletin,
    docente,
    estadoGuardado,
    indice,
    otrasClases.length,
    otrasReferencias,
    periodo,
    visibles,
  ]);

  const abrirVistaPrevia = useCallback((id) => setEstudianteId(id), []);
  const cerrarVistaPrevia = useCallback(() => setEstudianteId(null), []);

  // Mientras está abierta, la página de atrás no se desplaza y Escape la cierra.
  const abierta = vistaPrevia !== null;
  useEffect(() => {
    if (!abierta) return undefined;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const alPresionarTecla = (event) => {
      if (event.key === "Escape") setEstudianteId(null);
    };
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierta]);
  const verAnterior = useCallback(() => {
    if (indice > 0) setEstudianteId(visibles[indice - 1].estudiante_id);
  }, [indice, visibles]);
  const verSiguiente = useCallback(() => {
    if (indice >= 0 && indice < visibles.length - 1) {
      setEstudianteId(visibles[indice + 1].estudiante_id);
    }
  }, [indice, visibles]);

  return {
    vistaPrevia,
    abrirVistaPrevia,
    cerrarVistaPrevia,
    verAnterior,
    verSiguiente,
  };
}
