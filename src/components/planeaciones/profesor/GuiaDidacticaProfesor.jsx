import guiaDidacticaUtilesBg from "../../../assets/guia-didactica-utiles-bg.jpg";
import { NOMBRES_CUADROS_ORIGINALES } from "../../../utils/planeaciones/cuadros";
import CampoTextareaPlanProfesor from "./CampoTextareaPlanProfesor";
import EvidenciasPlanProfesor from "./EvidenciasPlanProfesor";

export default function GuiaDidacticaProfesor({
  asignacion,
  cargando,
  form,
  imagenesSeleccionadas,
  imagenesGuardadas,
  onActualizarCampo,
  onRegistrarInputImagen,
  onManejarImagen,
  onEliminarImagen,
  onAbrirPresentacion,
  // Nombres y ayudas de los cuadros que usa el colegio (useCuadrosPlan).
  cuadros = NOMBRES_CUADROS_ORIGINALES,
}) {
  return (
    <section
      className="rounded-xl border border-purple-200 bg-purple-100 p-4 shadow-sm sm:p-6"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.22)), url(${guiaDidacticaUtilesBg})`,
        backgroundPosition: "top center",
        backgroundRepeat: "repeat-y",
        backgroundSize: "100% auto",
      }}
    >
      <div className="mb-4 rounded-lg border border-white/70 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-950">
              Guía didáctica
            </h2>
            <p className="text-sm text-gray-600">
              Organiza la intención, la ruta de clase y las evidencias de
              aprendizaje.
            </p>
          </div>
          <div className="flex max-w-full flex-wrap items-center gap-2">
            {asignacion && <ResumenAsignacion asignacion={asignacion} />}
            <button
              type="button"
              onClick={onAbrirPresentacion}
              disabled={!asignacion || cargando}
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-violet-200 bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-800 hover:shadow-md disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="13" rx="2" />
                <path
                  d="M8 21h8M12 17v4M8 9l3 3 5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Presentación de clase
            </button>
          </div>
        </div>
      </div>

      {cargando ? (
        <CargandoGuiaDidactica />
      ) : (
        <div className="space-y-4">
          <ContextoPedagogico
            form={form}
            cuadros={cuadros}
            onActualizarCampo={onActualizarCampo}
          />
          <TemaYLogro
            form={form}
            cuadros={cuadros}
            onActualizarCampo={onActualizarCampo}
          />
          <ActividadInicial
            form={form}
            cuadros={cuadros}
            onActualizarCampo={onActualizarCampo}
          />
          <EvidenciasPlanProfesor
            form={form}
            cuadros={cuadros}
            imagenesSeleccionadas={imagenesSeleccionadas}
            imagenesGuardadas={imagenesGuardadas}
            onActualizarCampo={onActualizarCampo}
            onRegistrarInputImagen={onRegistrarInputImagen}
            onManejarImagen={onManejarImagen}
            onEliminarImagen={onEliminarImagen}
          />
        </div>
      )}
    </section>
  );
}

function ResumenAsignacion({ asignacion }) {
  const jornada = asignacion.jornada || "Sin jornada";

  return (
    <div
      className="flex w-fit max-w-full shrink-0 items-center gap-2 overflow-hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm"
      title={`${asignacion.materia} · ${asignacion.curso} · ${jornada}`}
      aria-label={`Materia ${asignacion.materia}, curso ${asignacion.curso}, jornada ${asignacion.jornada || "sin definir"}`}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      </span>
      <span className="min-w-0 max-w-52 truncate sm:max-w-64">
        {asignacion.materia}
      </span>
      <span
        className="h-4 w-px shrink-0 bg-emerald-200"
        aria-hidden="true"
      />
      <span className="shrink-0">{asignacion.curso}</span>
      <span
        className="h-4 w-px shrink-0 bg-emerald-200"
        aria-hidden="true"
      />
      <span className="shrink-0">{jornada}</span>
    </div>
  );
}

function ContextoPedagogico({ form, cuadros, onActualizarCampo }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <EncabezadoBloque
        titulo="Contexto pedagógico"
        descripcion="Define el enfoque y el propósito de la clase."
        color="bg-purple-600"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CampoTextareaPlanProfesor
          label={cuadros.unidad.nombre}
          value={form.unidad}
          onChange={(valor) => onActualizarCampo("unidad", valor)}
          placeholder={cuadros.unidad.ayuda}
          rows={2}
        />

        <CampoTextareaPlanProfesor
          label={cuadros.estandar.nombre}
          value={form.estandar}
          onChange={(valor) => onActualizarCampo("estandar", valor)}
          placeholder={cuadros.estandar.ayuda}
          rows={3}
        />
      </div>
    </div>
  );
}

function TemaYLogro({ form, cuadros, onActualizarCampo }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <div className="grid grid-cols-1 gap-4">
        <CampoTextareaPlanProfesor
          label={cuadros.tema.nombre}
          value={form.tema}
          onChange={(valor) => onActualizarCampo("tema", valor)}
          placeholder={cuadros.tema.ayuda}
          rows={2}
          color="bg-emerald-500"
        />

        <CampoTextareaPlanProfesor
          label={cuadros.proposito.nombre}
          value={form.proposito}
          onChange={(valor) => onActualizarCampo("proposito", valor)}
          placeholder={cuadros.proposito.ayuda}
          rows={3}
          color="bg-emerald-500"
        />
      </div>
    </div>
  );
}

function ActividadInicial({ form, cuadros, onActualizarCampo }) {
  return (
    <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50/80 via-white to-purple-50/50 p-4 sm:p-5">
      <CampoTextareaPlanProfesor
        label={cuadros.clase.nombre}
        value={form.clase}
        onChange={(valor) => onActualizarCampo("clase", valor)}
        placeholder={cuadros.clase.ayuda}
        rows={6}
        color="bg-purple-600"
      />
    </div>
  );
}

function EncabezadoBloque({ titulo, descripcion, color }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className={`h-9 w-1 shrink-0 rounded-full ${color}`}
        aria-hidden="true"
      />
      <div>
        <h3 className="text-sm font-semibold text-gray-950 sm:text-base">
          {titulo}
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">{descripcion}</p>
      </div>
    </div>
  );
}

function CargandoGuiaDidactica() {
  return (
    <div
      className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-violet-200 bg-violet-50/45 px-5 py-12"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100">
          <span
            className="h-7 w-7 animate-spin rounded-full border-[3px] border-current border-r-transparent"
            aria-hidden="true"
          />
        </div>
        <h3 className="mt-4 text-sm font-black text-slate-900">
          Cargando datos de la guía...
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Estamos consultando tu clase y la planeación de la fecha seleccionada.
        </p>
      </div>
    </div>
  );
}
