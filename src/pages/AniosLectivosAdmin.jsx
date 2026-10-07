import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import {
  copiarConfiguracionAnio,
  crearAnioLectivo,
} from "../services/aniosLectivosApi";
import {
  ESTADO_PREPARACION,
  etiquetaEstadoAnio,
} from "../utils/anioLectivo";

const OPCIONES_INICIALES = Object.freeze({
  copiar_precios: false,
  copiar_carga_academica: false,
  copiar_directores: false,
});

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
      setMensaje(`La configuración de ${anioActivo.anio} se copió a ${anioPreparacion.anio}.`);
    } catch (err) {
      setError(detalleError(err, "No se pudo copiar la configuración."));
    } finally {
      setCopiando(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-2">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">
          Preparación institucional
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Años lectivos</h1>
        <p className="mt-2 text-gray-600">
          Crea el siguiente año y copia su estructura antes de matricular estudiantes.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}
      {mensaje && (
        <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          {mensaje}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
            className="mt-4 rounded-lg bg-purple-700 px-5 py-2.5 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creando ? "Creando..." : `Crear ${siguienteAnio ?? "siguiente año"}`}
          </button>
        )}
      </section>

      {anioPreparacion && anioActivo && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">2. Copiar configuración</h2>
          <p className="mt-2 text-sm text-gray-600">
            Los cursos activos de {anioActivo.anio} se copian a {anioPreparacion.anio}.
            Los conceptos de pago se copian siempre.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["copiar_precios", "Copiar precios por curso"],
              ["copiar_carga_academica", "Copiar carga académica"],
              ["copiar_directores", "Copiar directores de grupo"],
            ].map(([campo, etiqueta]) => (
              <label key={campo} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={opciones[campo]}
                  onChange={() => cambiarOpcion(campo)}
                  className="mt-0.5 h-4 w-4"
                />
                <span>{etiqueta}</span>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={copiarConfiguracion}
            disabled={copiando}
            className="mt-5 rounded-lg bg-purple-700 px-5 py-2.5 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copiando ? "Copiando..." : `Copiar configuración de ${anioActivo.anio}`}
          </button>

          {resultadoCopia && (
            <div className="mt-5 grid gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 sm:grid-cols-2">
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
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-bold text-blue-950">Continuar la preparación</h2>
          <p className="mt-1 text-sm text-blue-900">
            Al continuar, trabajarás en {anioPreparacion.anio} para agregar registros
            que no vinieron de la copia.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/admin?modulo=cursos"
              onClick={() => seleccionarAnio(anioPreparacion.id)}
              className="rounded-lg bg-white px-4 py-2 font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
            >
              Administrar cursos
            </Link>
            <Link
              to="/admin/tipos-pagos"
              onClick={() => seleccionarAnio(anioPreparacion.id)}
              className="rounded-lg bg-white px-4 py-2 font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
            >
              Administrar conceptos de pago
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default AniosLectivosAdmin;
