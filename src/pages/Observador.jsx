import { useCallback, useEffect, useMemo, useState } from "react";
import FormularioAnotacionObservador from "../components/observador/FormularioAnotacionObservador";
import ListaAlumnosObservador from "../components/observador/ListaAlumnosObservador";
import VistaObservadorEstudiante from "../components/observador/VistaObservadorEstudiante";
import usePlanillaObservador from "../hooks/estudiantesObservador/usePlanillaObservador";
import useComandosObservador from "../hooks/observador/useComandosObservador";
import useFormularioAnotacion from "../hooks/observador/useFormularioAnotacion";
import useObservadorEstudiante, {
  ERROR_ESTUDIANTE_NO_EXISTE,
} from "../hooks/observador/useObservadorEstudiante";
import { filtrarEstudiantesObservador } from "../utils/estudiantesObservador/estudiantes";
import {
  PERIODO_TODOS,
  titularObservador,
} from "../utils/observador/anotaciones";
import { obtenerPeriodoProfesor } from "../utils/periodoProfesor";

/**
 * Observador del estudiante unificado: la bitácora acumulativa de un alumno,
 * con las anotaciones de todos sus profesores.
 *
 * Convive con la pantalla vieja (`/Formulario`), que se queda intacta hasta
 * que el usuario ordene retirarla. Ver
 * `docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`.
 *
 * La asignación elegida se usa **solo** para saber a qué alumnos listar. Nada
 * de la materia se guarda en la anotación: el observador es del niño, no de la
 * clase por la que se entró.
 */

const MENSAJE_NO_EXISTE = "No encontramos a ese estudiante.";
const MENSAJE_FALLO = "No se pudo consultar el observador. Intenta de nuevo.";

/** Marca de que el formulario abierto es una anotación nueva y no la
 * corrección de una existente. */
const NUEVA = "nueva";

function Observador() {
  const asignacionId = localStorage.getItem("asignacionId");
  const profesorId = leerProfesorId();
  // El periodo que se le pega a una anotación nueva sale del que el profesor
  // eligió en el Dashboard, decidido con el usuario el 2026-09-09. Es distinto
  // del selector de la pantalla, que solo filtra lo que se ve.
  const periodoEscritura = Number.parseInt(obtenerPeriodoProfesor(), 10) || 1;

  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  // "Todos" por defecto: el periodo es una etiqueta, no un filtro obligatorio,
  // y abrir la página nunca puede esconder historial (invariante 4).
  const [periodo, setPeriodo] = useState(PERIODO_TODOS);
  const [editando, setEditando] = useState(null);
  const [errorGuardado, setErrorGuardado] = useState(null);

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
    recargar,
  } = useObservadorEstudiante({
    estudianteId: seleccionado?.estudiante_id,
    periodo,
  });

  const formulario = useFormularioAnotacion();
  const { guardando, guardarNueva, guardarCorreccion } = useComandosObservador();

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

  const { reiniciar } = formulario;

  const cerrarFormulario = useCallback(() => {
    setEditando(null);
    setErrorGuardado(null);
    reiniciar(null);
  }, [reiniciar]);

  const abrirNueva = useCallback(() => {
    reiniciar(null);
    setErrorGuardado(null);
    setEditando(NUEVA);
  }, [reiniciar]);

  const abrirCorreccion = useCallback((anotacion) => {
    reiniciar(anotacion);
    setErrorGuardado(null);
    setEditando(anotacion);
  }, [reiniciar]);

  const abrirEstudiante = useCallback((estudiante) => {
    setEditando(null);
    setErrorGuardado(null);
    setSeleccionado(estudiante);
  }, []);

  const volverALaLista = useCallback(() => {
    setEditando(null);
    setErrorGuardado(null);
    setSeleccionado(null);
  }, []);

  const guardar = async () => {
    const esNueva = editando === NUEVA;
    const resultado = esNueva
      ? await guardarNueva(formulario.valores, {
        estudianteId: seleccionado.estudiante_id,
        periodo: periodoEscritura,
      })
      : await guardarCorreccion(formulario.valores, editando.id);

    if (resultado.estado !== "exito") {
      setErrorGuardado(resultado.mensaje);
      return;
    }

    cerrarFormulario();

    // Una anotación nueva nace con el periodo del Dashboard. Si el selector
    // está filtrando otro, lo recién escrito no aparecería y la profesora
    // creería que no se guardó: se pasa a "Todos", que además nunca oculta
    // nada. Cambiar el selector ya dispara la recarga, así que sigue siendo
    // **una sola petición**.
    if (esNueva && periodo !== PERIODO_TODOS && Number(periodo) !== periodoEscritura) {
      setPeriodo(PERIODO_TODOS);
      return;
    }

    recargar();
  };

  const mensajeError = error
    ? (error === ERROR_ESTUDIANTE_NO_EXISTE ? MENSAJE_NO_EXISTE : MENSAJE_FALLO)
    : null;

  const vistaFormulario = editando ? (
    <FormularioAnotacionObservador
      titulo={editando === NUEVA ? "Nueva anotación" : "Corregir tu anotación"}
      valores={formulario.valores}
      onCambiarTexto={formulario.cambiarTexto}
      onSalirDeCampo={formulario.corregirAlSalir}
      onCambiarPositiva={formulario.cambiarPositiva}
      onGuardar={guardar}
      onCancelar={cerrarFormulario}
      guardando={guardando}
      puedeGuardar={formulario.puedeGuardar}
      error={errorGuardado}
      periodoTexto={
        editando === NUEVA
          ? `Se guardará en el Periodo ${periodoEscritura}, el que tienes activo.`
          : "Al corregir no cambia el periodo ni el estudiante."
      }
    />
  ) : null;

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
          onReintentar={recargar}
          onVolver={volverALaLista}
          profesorId={profesorId}
          onEditar={abrirCorreccion}
          onNuevaAnotacion={abrirNueva}
          formulario={vistaFormulario}
        />
      ) : (
        <ListaAlumnosObservador
          busqueda={busqueda}
          onCambiarBusqueda={setBusqueda}
          estudiantes={filtrados}
          cargando={cargandoEstudiantes}
          error={errorEstudiantes}
          onAbrir={abrirEstudiante}
        />
      )}
    </div>
  );
}

/** El profesor de la sesión, solo para decidir dónde se pinta `[Editar]`. Es
 * cosmético: la regla de verdad la impone el servidor. */
function leerProfesorId() {
  try {
    return JSON.parse(localStorage.getItem("profesor") || "null")?.id ?? null;
  } catch {
    return null;
  }
}

export default Observador;
