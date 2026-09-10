import { useEffect, useMemo, useState } from "react";
import ListaAlumnosObservador from "../components/observador/ListaAlumnosObservador";
import VistaObservadorEstudiante from "../components/observador/VistaObservadorEstudiante";
import usePlanillaObservador from "../hooks/estudiantesObservador/usePlanillaObservador";
import useObservadorEstudiante, {
  ERROR_ESTUDIANTE_NO_EXISTE,
} from "../hooks/observador/useObservadorEstudiante";
import { filtrarEstudiantesObservador } from "../utils/estudiantesObservador/estudiantes";
import {
  PERIODO_TODOS,
  titularObservador,
} from "../utils/observador/anotaciones";

/**
 * Observador del estudiante unificado: la bitácora acumulativa de un alumno,
 * con las anotaciones de todos sus profesores.
 *
 * Convive con la pantalla vieja (`/Formulario`), que se queda intacta hasta
 * que el usuario ordene retirarla. Ver
 * `docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`.
 *
 * Fase 1: solo lectura. Escribir y editar llegan en la fase 2.
 */

const MENSAJE_NO_EXISTE = "No encontramos a ese estudiante.";
const MENSAJE_FALLO = "No se pudo consultar el observador. Intenta de nuevo.";

function Observador() {
  const asignacionId = localStorage.getItem("asignacionId");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  // "Todos" por defecto: el periodo es una etiqueta, no un filtro obligatorio,
  // y abrir la página nunca puede esconder historial (invariante 4).
  const [periodo, setPeriodo] = useState(PERIODO_TODOS);

  const {
    estudiantes,
    cargando: cargandoEstudiantes,
    error: errorEstudiantes,
  } = usePlanillaObservador(asignacionId);

  const {
    nivel,
    anotaciones,
    cargando,
    error,
    reintentar,
  } = useObservadorEstudiante({
    estudianteId: seleccionado?.estudiante_id,
    periodo,
  });

  useEffect(() => {
    if (asignacionId) return;
    alert("Selecciona una asignación primero en la página principal");
    window.location.href = "/";
  }, [asignacionId]);

  useEffect(() => {
    if (errorEstudiantes) console.error("Error cargando estudiantes", errorEstudiantes);
  }, [errorEstudiantes]);

  // El filtro es local sobre la lista ya cargada: escribir en el buscador no
  // vuelve a preguntarle nada al servidor.
  const filtrados = useMemo(
    () => filtrarEstudiantesObservador(estudiantes || [], busqueda),
    [busqueda, estudiantes],
  );

  const mensajeError = error
    ? (error === ERROR_ESTUDIANTE_NO_EXISTE ? MENSAJE_NO_EXISTE : MENSAJE_FALLO)
    : null;

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
        📘 Observador del estudiante
      </h1>

      {seleccionado ? (
        <VistaObservadorEstudiante
          titulo={titularObservador({ ...seleccionado, nivel })}
          periodo={periodo}
          onCambiarPeriodo={setPeriodo}
          anotaciones={anotaciones}
          cargando={cargando}
          error={mensajeError}
          onReintentar={reintentar}
          onVolver={() => setSeleccionado(null)}
        />
      ) : (
        <ListaAlumnosObservador
          busqueda={busqueda}
          onCambiarBusqueda={setBusqueda}
          estudiantes={filtrados}
          cargando={cargandoEstudiantes}
          error={errorEstudiantes}
          onAbrir={setSeleccionado}
        />
      )}
    </div>
  );
}

export default Observador;
