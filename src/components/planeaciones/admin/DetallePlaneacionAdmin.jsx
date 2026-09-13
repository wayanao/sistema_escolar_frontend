import { useImagenProtegida } from "../../../hooks/planeaciones/useImagenProtegida";
import TextoConEnlaces from "../TextoConEnlaces";
import {
  formatearFecha,
  formatearTextoVisual,
} from "../../../utils/planeaciones/admin";
import {
  CLASE_CAMPO_PLANEACION_ADMIN,
  EstadoPlaneacionAdminBadge,
  IconoCheck,
  MensajeEstadoPlaneacionAdmin,
  SpinnerPlaneacionAdmin,
} from "./ElementosPlaneacionAdmin";

function DetallePlaneacionAdmin({
  plan,
  observaciones,
  observacion,
  cargando,
  accionRevision,
  mensaje,
  eliminandoImagen,
  onVolver,
  onCambiarObservacion,
  onAprobar,
  onSolicitarAjuste,
  onEliminarImagen,
}) {
  if (cargando) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div
          className="flex items-center gap-3 text-sm font-semibold text-slate-600"
          role="status"
        >
          <SpinnerPlaneacionAdmin /> Cargando planeación...
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {mensaje && (
          <MensajeEstadoPlaneacionAdmin
            tono={mensaje.tono}
            mensaje={mensaje.texto}
          />
        )}
        <button
          type="button"
          onClick={onVolver}
          className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white"
        >
          Volver a planeaciones
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-1 sm:py-3">
      <div className="space-y-5">
        <div>
          <button
            type="button"
            onClick={onVolver}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-violet-200 hover:text-violet-800"
          >
            <IconoAtras /> Volver a la bandeja
          </button>
        </div>

        {mensaje && (
          <MensajeEstadoPlaneacionAdmin
            tono={mensaje.tono}
            mensaje={mensaje.texto}
          />
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <PlanRecibidoDetalle
            plan={plan}
            onEliminarImagen={onEliminarImagen}
            eliminandoImagen={eliminandoImagen}
          />
        </section>

        <FormularioRevision
          plan={plan}
          observacion={observacion}
          accionRevision={accionRevision}
          onCambiarObservacion={onCambiarObservacion}
          onAprobar={onAprobar}
          onSolicitarAjuste={onSolicitarAjuste}
        />

        <HistorialObservaciones
          observaciones={observaciones}
          versionActual={plan.version_revision}
        />
      </div>
    </div>
  );
}

function FormularioRevision({
  plan,
  observacion,
  accionRevision,
  onCambiarObservacion,
  onAprobar,
  onSolicitarAjuste,
}) {
  const comentario = observacion.trim();
  const estaRevisada = plan.estado_revision === "revisado";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSolicitarAjuste();
      }}
      className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm"
    >
      <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 via-white to-emerald-50/60 px-5 py-5 sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">
          Decisión administrativa
        </p>
        <h3 className="mt-1 text-xl font-black text-slate-950">
          Revisión y comentario al profesor
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Usa un solo comentario para reconocer el trabajo o indicar qué debe
          ajustarse. Elige la acción que corresponda al resultado de tu
          revisión.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <label
          htmlFor="comentario-revision"
          className="text-sm font-black text-slate-800"
        >
          Comentario para el profesor
        </label>
        <textarea
          id="comentario-revision"
          value={observacion}
          onChange={(event) => onCambiarObservacion(event.target.value)}
          maxLength={3000}
          rows={4}
          className={`${CLASE_CAMPO_PLANEACION_ADMIN} mt-2 resize-y`}
          placeholder="Ejemplo: Muy buen trabajo, la secuencia está clara y bien organizada."
        />
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            Obligatorio para solicitar un ajuste. Opcional para aprobar; si ya
            está revisada, puedes enviar un nuevo reconocimiento.
          </p>
          <span className="shrink-0 text-xs font-semibold text-slate-500">
            {observacion.length}/3000
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:justify-end lg:flex">
          <button
            type="submit"
            disabled={Boolean(accionRevision) || !comentario}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-black text-rose-800 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {accionRevision === "ajuste" && <SpinnerPlaneacionAdmin />}
            Solicitar ajuste
          </button>
          <button
            type="button"
            onClick={onAprobar}
            disabled={Boolean(accionRevision) || (estaRevisada && !comentario)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {accionRevision === "aprobar" ? (
              <SpinnerPlaneacionAdmin />
            ) : (
              <IconoCheck />
            )}
            {estaRevisada
              ? comentario
                ? "Enviar reconocimiento"
                : "Ya está revisada"
              : "Aprobar planeación"}
          </button>
        </div>
      </div>
    </form>
  );
}

function PlanRecibidoDetalle({
  plan,
  onEliminarImagen,
  eliminandoImagen,
}) {
  const tema = String(plan.tema || "").trim();
  const materia = formatearTextoVisual(plan.materia) || "Sin materia";
  const curso = formatearTextoVisual(plan.curso) || "Sin curso";
  const docente = formatearTextoVisual(plan.profesor) || "Docente sin nombre";
  const titulo = tema
    ? formatearTextoVisual(tema)
    : [plan.materia ? materia : "", plan.curso ? curso : ""]
        .filter(Boolean)
        .join(" · ") || "Planeación de clase";
  const inicialesDocente = docente
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toLocaleUpperCase("es-CO");
  const contexto = [
    { titulo: "Unidad", texto: plan.unidad },
    { titulo: "Estándar", texto: plan.estandar },
  ];
  const tieneActividadEnClase = Boolean(String(plan.competencias || "").trim());

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-[0_18px_45px_-34px_rgba(91,33,182,0.65)]">
        <div className="bg-gradient-to-br from-violet-50 via-white to-emerald-50/45 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">
                Detalle del planeador
              </p>
              <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">
                {titulo}
              </h1>
              {!tema && (
                <p className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                  Sin tema registrado
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <EstadoPlaneacionAdminBadge estado={plan.estado_revision} />
                <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-black text-violet-800 shadow-sm">
                  Revisión {plan.version_revision || 1}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:mt-5 lg:max-w-sm lg:justify-end lg:pr-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-700 text-sm font-black text-white shadow-sm">
                {inicialesDocente || "D"}
              </span>
              <div className="min-w-0 lg:text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Docente
                </p>
                <p className="break-words text-sm font-bold text-slate-800">
                  {docente}
                </p>
              </div>
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-violet-100/80 sm:grid-cols-3 xl:grid-cols-6">
          <DatoResumen label="Materia" value={materia} />
          <DatoResumen label="Curso" value={curso} />
          <DatoResumen label="Periodo" value={plan.periodo || 1} />
          <DatoResumen label="Fecha" value={formatearFecha(plan.fecha)} />
          <DatoResumen
            label="Evidencias"
            value={[plan.imagen1, plan.imagen2].filter(Boolean).length}
            destacado
          />
          <DatoResumen
            label="Comentarios de admin"
            value={plan.total_observaciones || 0}
            destacado
          />
        </dl>
      </div>

      <section>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {contexto.map((item) => (
            <DetallePlanBloque key={item.titulo} {...item} />
          ))}
        </div>
      </section>

      <section>
        <DetallePlanBloque
          titulo="Logro"
          texto={plan.proposito}
          color="bg-emerald-500"
        />
      </section>

      <section className="rounded-2xl border border-purple-100 bg-purple-50/55 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-700 text-sm font-black text-white">
            1
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-purple-800">
              Actividad inicial
            </h3>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">
              {plan.clase ? (
                <TextoConEnlaces texto={plan.clase} />
              ) : (
                "Sin información"
              )}
            </p>
          </div>
        </div>
      </section>

      <section>
        <TituloSeccion
          eyebrow="Actividades"
          titulo="Trabajo propuesto para estudiantes"
        />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {tieneActividadEnClase && (
            <DetallePlanBloque
              titulo="Actividad en clase"
              texto={plan.competencias}
              color="bg-amber-500"
            />
          )}
          <DetallePlanBloque
            titulo="Desarrollo cognitivo"
            texto={plan.dba}
            color="bg-orange-500"
          />
          <DetallePlanBloque
            titulo="Actividad en casa"
            texto={plan.actividad_casa}
            color="bg-sky-500"
          />
        </div>
      </section>

      <section className="border-t border-slate-200 pt-5">
        <Evidencias
          plan={plan}
          onEliminarImagen={onEliminarImagen}
          eliminandoImagen={eliminandoImagen}
        />
      </section>
    </div>
  );
}

function HistorialObservaciones({ observaciones, versionActual }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Trazabilidad
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            Historial de comentarios
          </h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {observaciones.length}
        </span>
      </div>
      {observaciones.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          Esta planeación todavía no tiene comentarios de revisión.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {observaciones.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-slate-800">
                    {item.admin || "Administración"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.plan_version === versionActual
                        ? "bg-violet-100 text-violet-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    Versión {item.plan_version}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {new Intl.DateTimeFormat("es-CO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.creada_at))}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {item.observacion}
              </p>
              <p className="mt-3 text-xs font-bold text-slate-500">
                {item.vista_por_profesor_at
                  ? "Vista por el profesor"
                  : "Pendiente de lectura"}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DatoResumen({ label, value, destacado = false }) {
  return (
    <div
      className={`min-w-0 px-4 py-3.5 ${
        destacado ? "bg-violet-50/90" : "bg-white"
      }`}
    >
      <dt
        className={`text-[11px] font-black uppercase tracking-wide ${
          destacado ? "text-violet-700" : "text-slate-500"
        }`}
      >
        {label}
      </dt>
      <dd
        className={`mt-1 break-words font-black leading-5 ${
          destacado
            ? "text-xl text-violet-950"
            : "text-sm text-slate-900"
        }`}
      >
        {value ?? "Sin dato"}
      </dd>
    </div>
  );
}

function TituloSeccion({ eyebrow, titulo }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-base font-black text-slate-950">{titulo}</h3>
    </div>
  );
}

function DetallePlanBloque({ titulo, texto, color }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="flex items-center gap-2 text-base font-black text-violet-800">
        {color && (
          <span
            className={`h-5 w-1 shrink-0 rounded-full ${color}`}
            aria-hidden="true"
          />
        )}
        {titulo}
      </h4>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">
        {texto ? <TextoConEnlaces texto={texto} /> : "Sin información"}
      </p>
    </article>
  );
}

function Evidencias({ plan, onEliminarImagen, eliminandoImagen }) {
  const imagenes = [
    {
      slot: "imagen1",
      path: plan.imagen1,
      label: "Evidencia de desarrollo cognitivo",
    },
    {
      slot: "imagen2",
      path: plan.imagen2,
      label: "Evidencia de actividad en casa",
    },
  ].filter((imagen) => Boolean(imagen.path));

  if (!imagenes.length) {
    return (
      <div>
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
          Evidencias
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          El profesor no adjuntó imágenes en esta planeación.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
        Evidencias enviadas
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {imagenes.map((imagen) => (
          <ImagenPlanCard
            key={imagen.slot}
            imagen={imagen}
            onEliminarImagen={() => onEliminarImagen(plan.id, imagen.slot)}
            eliminando={eliminandoImagen === imagen.slot}
          />
        ))}
      </div>
    </div>
  );
}

function ImagenPlanCard({ imagen, onEliminarImagen, eliminando }) {
  const { url, cargando, error } = useImagenProtegida(imagen.path);
  const abrirImagen = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={abrirImagen}
        disabled={!url}
        className="block h-48 w-full transition hover:opacity-90 disabled:cursor-not-allowed"
      >
        {cargando && (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Cargando imagen...
          </div>
        )}
        {error && !cargando && (
          <div className="flex h-full items-center justify-center px-3 text-sm text-rose-600">
            {error}
          </div>
        )}
        {url && !cargando && (
          <img
            src={url}
            alt={imagen.label}
            className="h-full w-full object-contain"
          />
        )}
      </button>
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-3">
        <div>
          <p className="text-sm font-bold text-slate-800">{imagen.label}</p>
          <button
            type="button"
            onClick={abrirImagen}
            disabled={!url}
            className="text-xs font-bold text-violet-700 disabled:text-slate-400"
          >
            Ver completa
          </button>
        </div>
        <button
          type="button"
          onClick={onEliminarImagen}
          disabled={eliminando}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
        >
          {eliminando && <SpinnerPlaneacionAdmin />} Borrar
        </button>
      </div>
    </div>
  );
}

function IconoAtras() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="M16 10H5M9 6l-4 4 4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default DetallePlaneacionAdmin;
