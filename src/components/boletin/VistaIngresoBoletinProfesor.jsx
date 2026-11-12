import {
  correspondeFormularioAEstudiante,
  formatearEtiquetaNota,
  obtenerTipoNota,
  VALORACIONES_DESARROLLO,
} from "../../utils/boletines/ingresoBoletin";
import {
  esEvaluacionDesarrollo,
  valoracionDesdePromedio,
} from "../../utils/valoracionesDesarrollo";
import MiCursoDirector from "./MiCursoDirector";
import VistaPreviaBoletinProfesor from "./VistaPreviaBoletinProfesor";

export default function VistaIngresoBoletinProfesor({
  asignacionId,
  borradorRecuperado = null,
  cargando,
  clases,
  datosBoletin,
  errorAlumnos = null,
  errorClases = null,
  estudiantes,
  guardandoTodos,
  idPrimerEstudiante = null,
  miCurso = null,
  periodo,
  progresoGrupo = null,
  onCopiarLogrosYGuardar,
  onCambiarAsignacion,
  onCambiarPeriodo,
  onDescartarBorrador,
  onReintentarAlumnos,
  onReintentarClases,
  onGuardarEstudiante,
  onObservacionChange,
  obtenerEstadoVisual,
  vistaPrevia = null,
  onVerVistaPrevia,
  onCerrarVistaPrevia,
  onVistaPreviaAnterior,
  onVistaPreviaSiguiente,
}) {
  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📝 Ingreso a Boletín Final
        </h1>
        <p className="text-gray-600">
          Completa las observaciones de tus alumnos guiándote de sus notas de la planilla.
        </p>
      </div>

      {miCurso?.disponible && (
        <PestanasBoletin
          vistaMiCurso={miCurso.vistaMiCurso}
          onMisMaterias={miCurso.onMostrarMisMaterias}
          onMiCurso={miCurso.onMostrarMiCurso}
        />
      )}

      {/* Clase y periodo de «Mis materias». En «Mi curso», el curso y el
          periodo van en el encabezado del curso (lo pidió el usuario). */}
      {!miCurso?.vistaMiCurso && (
        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clase (Curso / Materia)
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              value={asignacionId}
              onChange={(event) => onCambiarAsignacion(event.target.value)}
            >
              <option value="">Seleccione una clase...</option>
              {clases.map((clase) => (
                <option key={clase.id} value={clase.id}>
                  {clase.curso} - {clase.materia}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periodo
            </label>
            <select
              className="p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              value={periodo}
              onChange={(event) => onCambiarPeriodo(event.target.value)}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
        </div>
      )}

      {miCurso?.vistaMiCurso ? (
        <>
          {/* La firma del director para el boletín (FIRMAS_BOLETIN.md, paso
              3), ya armada por la página. Solo existe con «Mi curso»
              abierto, así que solo entonces se pide al servidor. */}
          {miCurso.cuadroFirma && <div className="mb-6">{miCurso.cuadroFirma}</div>}
          <MiCursoDirector
            cursos={miCurso.cursos}
            cursoId={miCurso.cursoId}
            datos={miCurso.datos}
            cargando={miCurso.cargando}
            error={miCurso.error}
            periodo={periodo}
            onCambiarCurso={miCurso.onCambiarCurso}
            onCambiarPeriodo={onCambiarPeriodo}
            onReintentar={miCurso.onReintentar}
            observaciones={miCurso.observaciones}
          />
        </>
      ) : (
        <>
          {errorClases && (
            <AvisoError
              texto="No se pudieron cargar tus clases. Revisa la conexión e intenta de nuevo."
              onReintentar={onReintentarClases}
            />
          )}

          {cargando ? (
            <p className="text-gray-500 text-center py-10">
              Cargando información del curso...
            </p>
          ) : errorAlumnos ? (
            <AvisoError
              texto="No se pudieron cargar los estudiantes de esta clase. Revisa la conexión e intenta de nuevo."
              onReintentar={onReintentarAlumnos}
            />
          ) : estudiantes.length > 0 ? (
            <div className="space-y-6">
              {borradorRecuperado && (
                <AvisoBorrador
                  borrador={borradorRecuperado}
                  onDescartar={onDescartarBorrador}
                />
              )}
              {estudiantes.map((estudiante) => {
                const form = datosBoletin[estudiante.estudiante_id];
                if (!correspondeFormularioAEstudiante(form, estudiante)) {
                  return null;
                }

                // El primer estudiante es la plantilla del grupo: ahí se escriben
                // los logros que se copian a los demás.
                const esPlantilla =
                  onCopiarLogrosYGuardar
                  && String(estudiante.estudiante_id) === String(idPrimerEstudiante);

                return (
                  <TarjetaEstudiante
                    key={estudiante.estudiante_id}
                    estudiante={estudiante}
                    form={form}
                    plantilla={
                      esPlantilla
                        ? { guardandoTodos, onCopiar: onCopiarLogrosYGuardar }
                        : null
                    }
                    estadoVisual={obtenerEstadoVisual(estudiante.estudiante_id)}
                    onGuardar={() => onGuardarEstudiante(estudiante.estudiante_id)}
                    onVerVistaPrevia={
                      onVerVistaPrevia
                        ? () => onVerVistaPrevia(estudiante.estudiante_id)
                        : undefined
                    }
                    onObservacionChange={(index, texto) =>
                      onObservacionChange(estudiante.estudiante_id, index, texto)
                    }
                  />
                );
              })}
            </div>
          ) : (
            asignacionId && (
              <p className="text-gray-500 text-center py-10 bg-white rounded-lg shadow border border-gray-200">
                No hay estudiantes en este curso o no han cargado información.
              </p>
            )
          )}
        </>
      )}

      {progresoGrupo && <ProgresoGuardadoGrupo progreso={progresoGrupo} />}

      {vistaPrevia && (
        <VistaPreviaBoletinProfesor
          vistaPrevia={vistaPrevia}
          estadoVisual={obtenerEstadoVisual(vistaPrevia.estudianteId)}
          onAnterior={onVistaPreviaAnterior}
          onSiguiente={onVistaPreviaSiguiente}
          onCerrar={onCerrarVistaPrevia}
        />
      )}
    </div>
  );
}

// Solo para el director de grupo: sus materias (lo de siempre) o su curso.
function PestanasBoletin({ vistaMiCurso, onMisMaterias, onMiCurso }) {
  const pestana = (activa) =>
    `flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none ${
      activa
        ? "bg-purple-600 text-white shadow-sm"
        : "text-purple-700 hover:bg-purple-50"
    }`;

  return (
    <div
      role="tablist"
      aria-label="Qué quieres ver"
      className="mb-4 flex gap-1 rounded-lg border border-purple-200 bg-white p-1 shadow-sm sm:inline-flex"
    >
      <button
        type="button"
        role="tab"
        aria-selected={!vistaMiCurso}
        onClick={onMisMaterias}
        className={pestana(!vistaMiCurso)}
      >
        Mis materias
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={vistaMiCurso}
        onClick={onMiCurso}
        className={pestana(vistaMiCurso)}
      >
        Mi curso (director de grupo)
      </button>
    </div>
  );
}

function AvisoBorrador({ borrador, onDescartar }) {
  const fecha = borrador.actualizado ? new Date(borrador.actualizado) : null;
  const cuando = fecha && !Number.isNaN(fecha.getTime())
    ? ` (escrito el ${fecha.toLocaleDateString("es-CO")} a las ${fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })})`
    : "";
  const quienes = borrador.cantidad === 1 ? "un estudiante" : `${borrador.cantidad} estudiantes`;

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-amber-900">
        <span className="font-bold">Recuperamos lo que no habías guardado</span>{" "}
        de {quienes}{cuando}. Revísalo y guárdalo para que le llegue al colegio.
      </p>
      {onDescartar && (
        <button
          type="button"
          onClick={onDescartar}
          className="shrink-0 rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
        >
          Descartar
        </button>
      )}
    </div>
  );
}

function AvisoError({ texto, onReintentar }) {
  return (
    <div
      role="alert"
      className="mb-6 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-medium text-red-800">{texto}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

// Mientras se guarda el grupo: cuántos van y por qué tarda. Tapa la pantalla
// para que nadie edite a mitad del guardado.
function ProgresoGuardadoGrupo({ progreso }) {
  const { guardados, total } = progreso;
  const porcentaje = total > 0 ? Math.round((guardados / total) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-guardando-grupo"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <span
            className="h-6 w-6 shrink-0 rounded-full border-[3px] border-purple-200 border-t-purple-600 motion-safe:animate-spin"
            aria-hidden="true"
          />
          <h2 id="titulo-guardando-grupo" className="text-lg font-bold text-gray-900">
            Guardando el grupo…
          </h2>
        </div>

        <p className="mt-4 text-sm font-semibold text-gray-800">
          Van {guardados} de {total} estudiantes
        </p>
        <div
          role="progressbar"
          aria-label="Estudiantes guardados"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={guardados}
          className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-purple-100"
        >
          <div
            className="h-full rounded-full bg-purple-600 transition-[width] duration-300"
            style={{ width: `${porcentaje}%` }}
          />
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Esto tarda un poco porque es un proceso pesado: se guarda estudiante
          por estudiante, cada uno con sus notas y sus logros. No cierres ni
          cambies de página hasta que termine.
        </p>
      </div>
    </div>
  );
}

function TarjetaEstudiante({
  estudiante,
  estadoVisual,
  form,
  onGuardar,
  onVerVistaPrevia,
  onObservacionChange,
  plantilla = null,
}) {
  const notasVisibles = estudiante.notas || [];
  const esDesarrollo = esEvaluacionDesarrollo(form.observaciones);
  // El profesor ve la carita que resume el periodo, no el número. Ese número
  // existe por debajo para que el estudiante entre en el puesto del curso.
  const valoracionDefinitiva = esDesarrollo
    ? valoracionDesdePromedio(Number(form.definitiva) || null)
    : null;

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white shadow ${
        plantilla ? "border-purple-300 ring-1 ring-purple-200" : "border-gray-200"
      }`}
    >
      {plantilla && <PasosPlantilla nombre={estudiante.nombre} />}
      <div className="border-b border-gray-200 bg-slate-50/70 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold text-gray-900">
              {estudiante.nombre}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${estadoVisual.badgeClass}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${estadoVisual.dotClass}`}
                  aria-hidden="true"
                />
                {estadoVisual.label}
              </span>
              <span className="text-xs font-medium text-gray-500">
                {estadoVisual.detail}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            {esDesarrollo ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 sm:justify-start">
                <span className="text-sm font-semibold text-emerald-700">
                  Definitiva
                </span>
                <span className="inline-flex items-center gap-1.5 rounded bg-white px-2 py-1 text-emerald-800">
                  <span className="text-lg leading-none">
                    {valoracionDefinitiva?.emoji || "—"}
                  </span>
                  <span className="text-sm font-bold">
                    {valoracionDefinitiva?.label || "Sin calificar"}
                  </span>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 sm:justify-start">
                <span className="text-sm font-semibold text-gray-600">
                  Definitiva
                </span>
                <span className="min-w-14 rounded bg-gray-100 px-2 py-1 text-center text-lg font-bold text-gray-900">
                  {Number(form.definitiva || 0).toFixed(1)}
                </span>
              </div>
            )}
            {onVerVistaPrevia && (
              <button
                type="button"
                onClick={onVerVistaPrevia}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-purple-200 bg-gradient-to-b from-white to-purple-50 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-purple-700 shadow-sm transition hover:-translate-y-px hover:border-purple-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 sm:w-auto"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-white shadow-sm transition-transform group-hover:scale-110"
                  aria-hidden="true"
                >
                  <IconoOjo />
                </span>
                Ver cómo queda
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {notasVisibles.length === 0 ? (
          <p className="text-gray-500 italic text-sm p-4 bg-gray-50 rounded">
            Este alumno no tiene notas registradas en esta planilla para usar como referencia.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notasVisibles.map((nota, index) => (
              <NotaBoletin
                key={index}
                nota={nota}
                observacion={form.observaciones[index].observacion}
                onChange={(texto) => onObservacionChange(index, texto)}
              />
            ))}
          </div>
        )}
      </div>

      {plantilla ? (
        // En la plantilla hay un solo botón grande (el del grupo): dos botones
        // morados iguales, uno encima del otro, confundían a los profesores.
        <CopiarAlGrupo
          guardandoTodos={plantilla.guardandoTodos}
          nombre={estudiante.nombre}
          onCopiar={plantilla.onCopiar}
          onGuardarSolo={onGuardar}
        />
      ) : (
        // Guardar va al final: primero se escribe, luego se guarda. La nota
        // sutil aclara que no guarda al grupo.
        <div className="flex flex-col gap-1.5 border-t border-gray-100 bg-slate-50/60 px-4 py-3 sm:flex-row-reverse sm:items-center sm:justify-start sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={onGuardar}
            aria-describedby={`guarda-solo-${estudiante.estudiante_id}`}
            className="w-full rounded-md bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-800 sm:w-auto"
          >
            {estadoVisual.buttonText}
          </button>
          <p
            id={`guarda-solo-${estudiante.estudiante_id}`}
            className="text-center text-xs text-gray-500 sm:text-right"
          >
            Solo guarda a {estudiante.nombre}
          </p>
        </div>
      )}
    </div>
  );
}

// Arriba de la tarjeta del primer estudiante: el proceso completo, en tres pasos.
function PasosPlantilla({ nombre }) {
  const pasos = [
    <>Escribe aquí los logros de <strong>{nombre}</strong>.</>,
    <>Oprime <strong>«Copiar a todos y guardar»</strong>, abajo: se copian a los demás y se guarda todo el grupo.</>,
    <>¿Alguien necesita algo distinto? Cámbialo en su tarjeta y guárdalo con su botón.</>,
  ];

  return (
    <div className="border-b border-purple-200 bg-purple-50/80 px-4 py-4 sm:px-5">
      <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
        Plantilla del grupo
      </p>
      <h2 className="mt-1 text-lg font-bold text-gray-950">
        Escribe aquí los logros de todo el grupo
      </h2>
      <ol className="mt-3 grid gap-2 md:grid-cols-3">
        {pasos.map((texto, indice) => (
          <li key={indice} className="flex items-start gap-2 text-sm text-gray-700">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white"
              aria-hidden="true"
            >
              {indice + 1}
            </span>
            <span className="pt-0.5">{texto}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Debajo de los logros del primer estudiante: el paso 2, con un solo botón
// grande. Guardar solo a este estudiante queda como un enlace pequeño.
function CopiarAlGrupo({ guardandoTodos, nombre, onCopiar, onGuardarSolo }) {
  return (
    <div className="border-t border-purple-200 bg-purple-50/80 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-gray-700">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white"
            aria-hidden="true"
          >
            2
          </span>
          <span className="pt-0.5">
            ¿Listos los logros? Cópialos a los demás y guarda todo el grupo. Lo que
            escribiste a mano para alguien no se toca.
          </span>
        </p>
        <button
          type="button"
          onClick={onCopiar}
          disabled={guardandoTodos}
          className="shrink-0 whitespace-nowrap rounded-md bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-purple-300"
        >
          {guardandoTodos ? "Guardando grupo..." : "Copiar a todos y guardar"}
        </button>
      </div>
      {onGuardarSolo && (
        <p className="mt-3 border-t border-purple-100 pt-3 text-center text-sm text-gray-500 sm:text-right">
          ¿Solo cambiaste algo de {nombre}?{" "}
          <button
            type="button"
            onClick={onGuardarSolo}
            disabled={guardandoTodos}
            className="font-semibold text-purple-700 underline underline-offset-2 hover:text-purple-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Guardar solo a {nombre}
          </button>
        </p>
      )}
    </div>
  );
}

// Ojo de "Ver cómo queda", dibujado a mano como los demás íconos de la app.
function IconoOjo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function NotaBoletin({ nota, observacion, onChange }) {
  const etiquetaNota = formatearEtiquetaNota(obtenerTipoNota(nota));
  const emoji =
    VALORACIONES_DESARROLLO.find((opcion) => opcion.value === nota.valoracion)
      ?.emoji || "—";

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <span
          className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate max-w-[120px]"
          title={etiquetaNota}
          translate="no"
        >
          {etiquetaNota}
        </span>
        {nota.tipo_evaluacion === "numerica" ? (
          <span className="bg-purple-100 text-purple-800 text-sm font-bold px-3 py-1 rounded-full">
            Nota: {nota.valor}
          </span>
        ) : (
          <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full">
            {emoji}
          </span>
        )}
      </div>
      {nota.tipo_evaluacion === "desarrollo" && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Valoración registrada
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            <span>{emoji}</span>
          </span>
        </div>
      )}
      <textarea
        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
        rows="3"
        placeholder={
          nota.tipo_evaluacion === "desarrollo"
            ? "Describe el proceso del niño en este logro..."
            : "Escribe la observación sobre esta nota específica para el boletín final..."
        }
        value={observacion}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
