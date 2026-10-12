import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ActivacionAnioView from "../components/anioLectivo/ActivacionAnioView";
import AniosPasadosView from "../components/anioLectivo/AniosPasadosView";
import MatriculasPreparacionView from "../components/anioLectivo/MatriculasPreparacionView";
import ResumenPreparacionView from "../components/anioLectivo/ResumenPreparacionView";
import useActivacionAnio from "../hooks/anioLectivo/useActivacionAnio";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useCambioAnioPasado from "../hooks/anioLectivo/useCambioAnioPasado";
import usePreparacionMatriculas from "../hooks/anioLectivo/usePreparacionMatriculas";
import {
  copiarConfiguracionAnio,
  crearAnioLectivo,
} from "../services/aniosLectivosApi";
import {
  ESTADO_PREPARACION,
  aniosPasados,
  etiquetaEstadoAnio,
} from "../utils/anioLectivo";

const OPCIONES_INICIALES = Object.freeze({
  copiar_precios: false,
  copiar_carga_academica: false,
  copiar_directores: false,
});

// Lo que copia cada casilla, según la copia del backend (paso 5.4): la ayuda
// debe cambiar si cambia lo que el backend copia.
function opcionesCopia(anioOrigen, anioDestino) {
  return [
    {
      campo: "copiar_precios",
      etiqueta: "Copiar precios por curso",
      ayuda: `Copia a qué cursos se cobra cada concepto y su valor (por ejemplo, la mensualidad de cada curso). Si no lo marcas, los conceptos de ${anioDestino} no se le cobran a ningún curso hasta que les pongas precio en Tipos de Pago.`,
    },
    {
      campo: "copiar_carga_academica",
      etiqueta: "Copiar carga académica",
      ayuda: `Copia las clases de cada curso: materia, profesor, horario y orden en el boletín. No copia notas, asistencia, observaciones, planeador ni planes de clase: en ${anioDestino} empiezan vacíos. Los profesores verán sus clases cuando ${anioDestino} esté activo. Si no lo marcas, creas las clases en Asignaciones.`,
    },
    {
      campo: "copiar_directores",
      etiqueta: "Copiar directores de grupo",
      ayuda: `Cada curso de ${anioDestino} queda con el mismo director de grupo que tiene en ${anioOrigen}. Si no lo marcas, los cursos quedan sin director y lo asignas en Cursos.`,
    },
  ];
}

function detalleError(error, respaldo) {
  const detalle = error?.response?.data?.detail;
  return typeof detalle === "string" && detalle.trim() ? detalle : respaldo;
}

function AniosLectivosAdmin() {
  const { anios, anioActivo, recargarAnios, seleccionarAnio } = useAnioLectivo();
  const [opciones, setOpciones] = useState(OPCIONES_INICIALES);
  const [creando, setCreando] = useState(false);
  const [copiando, setCopiando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [resultadoCopia, setResultadoCopia] = useState(null);

  const anioPreparacion = useMemo(
    () => anios.find((anio) => anio.estado === ESTADO_PREPARACION) ?? null,
    [anios],
  );
  const siguienteAnio = anioActivo ? anioActivo.anio + 1 : null;
  const preparacion = usePreparacionMatriculas(anioPreparacion);
  // Al activar, recarga los años dejando elegido el nuevo activo: así toda la
  // aplicación pasa a trabajar en él.
  const alActivar = useCallback(
    (datos) => recargarAnios({ seleccionarId: datos.anio_activo.id }),
    [recargarAnios],
  );
  const activacion = useActivacionAnio(anioPreparacion, { onActivado: alActivar });

  // Marcar o matricular cambia quién falta por decidir: la vista previa se
  // vuelve a pedir para que la lista de pendientes no quede vieja.
  const marcarSalida = async (estudianteId, estadoSalida) => {
    const respuesta = await preparacion.marcarSalida(estudianteId, estadoSalida);
    if (respuesta.estado === "exito") void activacion.recargarVistaPrevia();
    return respuesta;
  };
  const promover = async () => {
    const respuesta = await preparacion.promover();
    if (respuesta.estado === "exito") void activacion.recargarVistaPrevia();
    return respuesta;
  };
  const resultadoActivacion = activacion.resultado;

  // Reabrir o volver a cerrar recarga los años, para que el selector muestre
  // el estado nuevo; la selección actual se conserva.
  const alCambiarAnioPasado = useCallback(() => recargarAnios(), [recargarAnios]);
  const cambioAnioPasado = useCambioAnioPasado({ onCambiado: alCambiarAnioPasado });
  const pasados = useMemo(() => aniosPasados(anios), [anios]);

  const errorVisible =
    error || preparacion.error || activacion.error || cambioAnioPasado.error;

  const crearSiguiente = async () => {
    setCreando(true);
    setError("");
    setMensaje("");
    try {
      const creado = await crearAnioLectivo();
      await recargarAnios({ seleccionarId: creado.id });
      setMensaje(`El año ${creado.anio} quedó en preparación.`);
    } catch (err) {
      setError(detalleError(err, "No se pudo crear el siguiente año lectivo."));
    } finally {
      setCreando(false);
    }
  };

  const cambiarOpcion = (campo) => {
    setOpciones((actuales) => ({ ...actuales, [campo]: !actuales[campo] }));
  };

  const copiarConfiguracion = async () => {
    if (!anioPreparacion) return;
    setCopiando(true);
    setError("");
    setMensaje("");
    setResultadoCopia(null);
    try {
      const resultado = await copiarConfiguracionAnio(
        anioPreparacion.id,
        opciones,
      );
      setResultadoCopia(resultado.copiados);
      await preparacion.recargarPreparacion();
      setMensaje(`La configuración de ${anioActivo.anio} se copió a ${anioPreparacion.anio}.`);
    } catch (err) {
      setError(detalleError(err, "No se pudo copiar la configuración."));
    } finally {
      setCopiando(false);
    }
  };

  return (
    <div className="w-full space-y-4 py-2 sm:space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">
          Preparación institucional
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          Años lectivos
        </h1>
        <p className="mt-2 text-gray-600">
          Crea el siguiente año y copia su estructura antes de matricular estudiantes.
        </p>
      </header>

      {errorVisible && (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800 sm:p-4">
          {errorVisible}
        </div>
      )}
      {mensaje && (
        <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-800 sm:p-4">
          {mensaje}
        </div>
      )}
      {cambioAnioPasado.mensaje && (
        <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-800 sm:p-4">
          {cambioAnioPasado.mensaje}
        </div>
      )}
      {resultadoActivacion && (
        <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-900 sm:p-4">
          <p className="font-semibold">
            {resultadoActivacion.anio_activo.anio} quedó activo y{" "}
            {resultadoActivacion.anio_cerrado.anio} cerrado.
          </p>
          <p className="mt-1 text-sm">
            {`Continúan: ${resultadoActivacion.resumen.continuan} · Nuevos: ${resultadoActivacion.resumen.nuevos} · Retirados: ${resultadoActivacion.resumen.retirados} · Egresados: ${resultadoActivacion.resumen.egresados}`}
          </p>
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-gray-900">1. Crear el siguiente año</h2>
        {anioActivo ? (
          <p className="mt-2 text-sm text-gray-600">
            Año vigente: <strong>{anioActivo.anio}</strong>. El servidor creará únicamente
            el año siguiente.
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-700">
            No hay un año activo disponible para calcular el siguiente.
          </p>
        )}

        {anioPreparacion ? (
          <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
            <p className="font-semibold text-purple-900">
              {anioPreparacion.anio} · {etiquetaEstadoAnio(anioPreparacion.estado)}
            </p>
            <p className="mt-1 text-sm text-purple-800">
              Ya existe el año que se está preparando; no se crea otro.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={crearSiguiente}
            disabled={creando || !siguienteAnio}
            className="mt-4 w-full rounded-lg bg-purple-700 px-5 py-2.5 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {creando ? "Creando..." : `Crear ${siguienteAnio ?? "siguiente año"}`}
          </button>
        )}
      </section>

      {anioPreparacion && anioActivo && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-gray-900">Copiar configuración</h2>
          <p className="mt-2 text-sm text-gray-600">
            Los cursos activos de {anioActivo.anio} se copian a {anioPreparacion.anio}.
            Los conceptos de pago se copian siempre. Revisa las opciones antes de
            copiar: la copia se hace una sola vez, y lo que no marques lo completas
            después a mano.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {opcionesCopia(anioActivo.anio, anioPreparacion.anio).map(
              ({ campo, etiqueta, ayuda }) => (
                <div key={campo} className="min-w-0 rounded-lg border border-gray-200 p-3 text-sm">
                  <label className="flex items-start gap-3 font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={opciones[campo]}
                      onChange={() => cambiarOpcion(campo)}
                      aria-describedby={`ayuda-${campo}`}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span>{etiqueta}</span>
                  </label>
                  {/* Fuera de la etiqueta: así no cambia el nombre de la casilla. */}
                  <p id={`ayuda-${campo}`} className="mt-2 pl-7 text-gray-600">
                    {ayuda}
                  </p>
                </div>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={copiarConfiguracion}
            disabled={copiando}
            className="mt-5 w-full rounded-lg bg-purple-700 px-5 py-2.5 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {copiando ? "Copiando..." : `Copiar configuración de ${anioActivo.anio}`}
          </button>

          {resultadoCopia && (
            <div className="mt-5 grid gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 sm:grid-cols-2 lg:grid-cols-5">
              <span>{resultadoCopia.cursos} cursos</span>
              <span>{resultadoCopia.conceptos_pago} conceptos de pago</span>
              <span>{resultadoCopia.precios_curso} precios por curso</span>
              <span>{resultadoCopia.asignaciones} asignaciones</span>
              <span>{resultadoCopia.directores_grupo} directores de grupo</span>
            </div>
          )}
        </section>
      )}

      {anioPreparacion && (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-6">
          <h2 className="text-lg font-bold text-blue-950">Continuar la preparación</h2>
          <p className="mt-1 text-sm text-blue-900">
            Al continuar, trabajarás en {anioPreparacion.anio} para agregar registros
            que no vinieron de la copia.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/admin?modulo=cursos"
              onClick={() => seleccionarAnio(anioPreparacion.id)}
              className="w-full rounded-lg bg-white px-4 py-2 text-center font-semibold text-blue-800 shadow-sm hover:bg-blue-100 sm:w-auto"
            >
              Administrar cursos
            </Link>
            <Link
              to="/admin/tipos-pagos"
              onClick={() => seleccionarAnio(anioPreparacion.id)}
              className="w-full rounded-lg bg-white px-4 py-2 text-center font-semibold text-blue-800 shadow-sm hover:bg-blue-100 sm:w-auto"
            >
              Administrar conceptos de pago
            </Link>
            <Link
              to="/admin/estudiantes"
              onClick={() => seleccionarAnio(anioPreparacion.id)}
              className="w-full rounded-lg bg-white px-4 py-2 text-center font-semibold text-blue-800 shadow-sm hover:bg-blue-100 sm:w-auto"
            >
              Crear estudiante en {anioPreparacion.anio}
            </Link>
          </div>
        </section>
      )}

      {anioPreparacion && anioActivo && (
        <MatriculasPreparacionView
          anioActivo={anioActivo}
          anioPreparacion={anioPreparacion}
          cursosOrigen={preparacion.cursosOrigen}
          cursosDestino={preparacion.cursosDestino}
          cursoOrigenId={preparacion.cursoOrigenId}
          cursoDestinoId={preparacion.cursoDestinoId}
          candidatos={preparacion.candidatos}
          seleccionados={preparacion.seleccionados}
          cargandoPreparacion={preparacion.cargandoPreparacion}
          cargandoCandidatos={preparacion.cargandoCandidatos}
          promoviendo={preparacion.promoviendo}
          guardandoSalidaId={preparacion.guardandoSalidaId}
          resultado={preparacion.resultadoPromocion}
          onCambiarOrigen={preparacion.cambiarCursoOrigen}
          onCambiarDestino={preparacion.setCursoDestinoId}
          onAlternarEstudiante={preparacion.alternarEstudiante}
          onMarcarSalida={marcarSalida}
          onPromover={promover}
        />
      )}

      {anioPreparacion && (
        <ResumenPreparacionView
          anio={anioPreparacion.anio}
          resumen={preparacion.resumen}
          cargando={preparacion.cargandoPreparacion}
        />
      )}

      {anioPreparacion && anioActivo && (
        <ActivacionAnioView
          anioActivo={anioActivo}
          anioPreparacion={anioPreparacion}
          vistaPrevia={activacion.vistaPrevia}
          cargando={activacion.cargandoVistaPrevia}
          confirmacion={activacion.confirmacion}
          activando={activacion.activando}
          onCambiarConfirmacion={activacion.setConfirmacion}
          onActivar={activacion.activar}
          onActualizar={activacion.recargarVistaPrevia}
        />
      )}

      {pasados.length > 0 && (
        <AniosPasadosView
          anios={pasados}
          anioEnCambio={cambioAnioPasado.anioEnCambio}
          confirmacion={cambioAnioPasado.confirmacion}
          guardando={cambioAnioPasado.guardando}
          onIniciar={cambioAnioPasado.iniciar}
          onCancelar={cambioAnioPasado.cancelar}
          onCambiarConfirmacion={cambioAnioPasado.setConfirmacion}
          onConfirmar={cambioAnioPasado.confirmar}
        />
      )}
    </div>
  );
}

export default AniosLectivosAdmin;
