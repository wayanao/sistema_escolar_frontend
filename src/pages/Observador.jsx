import { useCallback, useMemo, useState } from "react";
import FormularioAnotacionObservador from "../components/observador/FormularioAnotacionObservador";
import ListaAlumnosObservador from "../components/observador/ListaAlumnosObservador";
import ObservadorImprimible from "../components/observador/ObservadorImprimible";
import VentanaFirmaAnotacion from "../components/observador/VentanaFirmaAnotacion";
import VistaObservadorEstudiante from "../components/observador/VistaObservadorEstudiante";
import useComandosObservador from "../hooks/observador/useComandosObservador";
import useFirmaAnotacion from "../hooks/observador/useFirmaAnotacion";
import useFormularioAnotacion from "../hooks/observador/useFormularioAnotacion";
import useMisEstudiantes, {
  ERROR_SIN_LISTA,
} from "../hooks/observador/useMisEstudiantes";
import useObservadorEstudiante, {
  ERROR_ESTUDIANTE_NO_EXISTE,
} from "../hooks/observador/useObservadorEstudiante";
import { filtrarAlumnosObservador } from "../utils/observador/alumnos";
import {
  AGRUPACION_DIMENSION,
  PERIODO_TODOS,
  titularObservador,
} from "../utils/observador/anotaciones";
import { anotacionesParaImprimir } from "../utils/observador/impresion";
import { obtenerPeriodoProfesor } from "../utils/periodoProfesor";

/**
 * Observador del estudiante unificado: la bitácora acumulativa de un alumno,
 * con las anotaciones de todos sus profesores.
 *
 * Convive con la pantalla vieja (`/Formulario`), que se queda intacta hasta
 * que el usuario ordene retirarla. Ver
 * `docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`.
 *
 * **No depende de ninguna clase elegida.** El observador es del niño y no de la
 * materia: la lista sale de `GET /observador/mis-estudiantes`, que devuelve los
 * alumnos de todos los cursos del profesor en una sola petición.
 */

const MENSAJE_NO_EXISTE = "No encontramos a ese estudiante.";
const MENSAJE_FALLO = "No se pudo consultar el observador. Intenta de nuevo.";
const MENSAJE_SIN_LISTA =
  "Esta pantalla es para profesores. Abre el observador desde la ficha del estudiante.";
const MENSAJE_FALLO_LISTA =
  "No se pudo cargar tu lista de estudiantes. Intenta de nuevo.";

/** Marca de que el formulario abierto es una anotación nueva y no la
 * corrección de una existente. */
const NUEVA = "nueva";

function Observador() {
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
  const [agrupacion, setAgrupacion] = useState(AGRUPACION_DIMENSION);
  // Qué reporte se está imprimiendo, o `null` si no hay ninguno abierto.
  const [imprimiendo, setImprimiendo] = useState(null);

  const {
    estudiantes,
    cargando: cargandoEstudiantes,
    error: errorEstudiantes,
    recargar: recargarEstudiantes,
  } = useMisEstudiantes();

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

  // Firma del acudiente (docs/funcionalidades/FIRMA_OBSERVADOR.md). Al firmar
  // -o si el servidor dice que la anotación cambió- se vuelve a pedir la
  // bitácora: es la única forma de ver el sello y de que desaparezca [Editar].
  const firma = useFirmaAnotacion({
    estudianteId: seleccionado?.estudiante_id,
    anotaciones,
    onFirmada: recargar,
  });

  // El filtro es local sobre la lista ya cargada: escribir en el buscador no
  // vuelve a preguntarle nada al servidor.
  const filtrados = useMemo(
    () => filtrarAlumnosObservador(estudiantes, busqueda),
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
    setImprimiendo(null);
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

  const mensajeErrorLista = errorEstudiantes
    ? (errorEstudiantes === ERROR_SIN_LISTA ? MENSAJE_SIN_LISTA : MENSAJE_FALLO_LISTA)
    : null;

  const mensajeError = error
    ? (error === ERROR_ESTUDIANTE_NO_EXISTE ? MENSAJE_NO_EXISTE : MENSAJE_FALLO)
    : null;

  const tituloAlumno = titularObservador({ ...seleccionado, nivel });

  // Se imprime **lo que se está viendo**: las anotaciones que ya están en
  // pantalla -o sea, las del periodo elegido- y con la agrupación puesta. El
  // filtro de la impresión solo decide de quién, nunca de cuándo.
  const vistaFormulario = editando ? (
    <FormularioAnotacionObservador
      titulo={editando === NUEVA ? "Nueva anotación" : "Corregir tu anotación"}
      valores={formulario.valores}
      onCambiarTexto={formulario.cambiarTexto}
      onSalirDeCampo={formulario.corregirAlSalir}
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

  // Una sola salida, con ternario, en vez de un `return` temprano: el
  // compilador de React no puede conservar la memoizacion si el componente
  // vuelve antes de tiempo, y `pnpm run lint` lo rechaza.
  return imprimiendo ? (
    <ObservadorImprimible
      alumno={tituloAlumno}
      periodo={periodo}
      agrupacion={agrupacion}
      anotaciones={anotacionesParaImprimir(anotaciones, imprimiendo, profesorId)}
      opcion={imprimiendo}
      profesor={leerProfesor()}
      onVolver={() => setImprimiendo(null)}
    />
  ) : (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
        📘 Observador del estudiante
      </h1>

      {seleccionado ? (
        <VistaObservadorEstudiante
          titulo={tituloAlumno}
          periodo={periodo}
          onCambiarPeriodo={setPeriodo}
          agrupacion={agrupacion}
          onCambiarAgrupacion={setAgrupacion}
          onImprimir={setImprimiendo}
          anotaciones={anotaciones}
          cargando={cargando}
          error={mensajeError}
          onReintentar={recargar}
          onVolver={volverALaLista}
          profesorId={profesorId}
          onEditar={abrirCorreccion}
          onFirmar={firma.abrir}
          onFirmarPeriodo={firma.abrirPeriodo}
          onNuevaAnotacion={abrirNueva}
          formulario={vistaFormulario}
        />
      ) : (
        <ListaAlumnosObservador
          busqueda={busqueda}
          onCambiarBusqueda={setBusqueda}
          estudiantes={filtrados}
          cargando={cargandoEstudiantes}
          error={mensajeErrorLista}
          onReintentar={recargarEstudiantes}
          onAbrir={abrirEstudiante}
        />
      )}

      {seleccionado && firma.abierta && (
        <VentanaFirmaAnotacion titulo={tituloAlumno} {...firma.propsVentana} />
      )}
    </div>
  );
}

/** El profesor de la sesión. Se usa para decidir dónde se pinta `[Editar]` -que
 * es cosmético: la regla de verdad la impone el servidor- y para firmar el
 * impreso de «Solo mis anotaciones». */
function leerProfesor() {
  try {
    return JSON.parse(localStorage.getItem("profesor") || "null");
  } catch {
    return null;
  }
}

function leerProfesorId() {
  return leerProfesor()?.id ?? null;
}

export default Observador;
