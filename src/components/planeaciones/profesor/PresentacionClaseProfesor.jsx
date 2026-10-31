import { useEffect } from "react";
import { createPortal } from "react-dom";
import useAperturaEvidencia from "../../../hooks/planeaciones/useAperturaEvidencia";
import { useImagenProtegida } from "../../../hooks/planeaciones/useImagenProtegida";
import { esEvidenciaPdf } from "../../../utils/planeaciones/evidencias";
import ContenidoEvidencia from "../ContenidoEvidencia";
import TextoConEnlaces from "../TextoConEnlaces";
import VisorPdfPlaneacion from "../VisorPdfPlaneacion";
import { formatearFechaPlan } from "../../../utils/planeaciones/profesor";
import { NOMBRES_CUADROS_ORIGINALES } from "../../../utils/planeaciones/cuadros";

export default function PresentacionClaseProfesor({
  asignacion,
  periodo,
  fecha,
  form,
  imagenesSeleccionadas,
  imagenesGuardadas,
  hayCambios,
  onCerrar,
  cuadros = NOMBRES_CUADROS_ORIGINALES,
}) {
  useEffect(() => {
    const overflowAnteriorBody = document.body.style.overflow;
    const overflowAnteriorHtml = document.documentElement.style.overflow;
    const overscrollAnteriorHtml = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.body.style.overflow = overflowAnteriorBody;
      document.documentElement.style.overflow = overflowAnteriorHtml;
      document.documentElement.style.overscrollBehavior = overscrollAnteriorHtml;
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [onCerrar]);

  const tieneImagen1 = Boolean(imagenesSeleccionadas.imagen1 || imagenesGuardadas.imagen1);
  const tieneImagen2 = Boolean(imagenesSeleccionadas.imagen2 || imagenesGuardadas.imagen2);
  const tieneContexto = tieneTexto(form.unidad) || tieneTexto(form.estandar);
  const tieneLogro = tieneTexto(form.proposito);
  const tieneActividadInicial = tieneTexto(form.clase);
  const tieneActividadEnClase = tieneTexto(form.competencias);
  const tieneDesarrolloCognitivo = tieneTexto(form.dba) || tieneImagen1;
  const tieneActividadCasa = tieneTexto(form.actividad_casa) || tieneImagen2;
  const tieneContenido =
    tieneTexto(form.tema) ||
    tieneContexto ||
    tieneLogro ||
    tieneActividadInicial ||
    tieneActividadEnClase ||
    tieneDesarrolloCognitivo ||
    tieneActividadCasa;

  return createPortal(
    <div
      className="fixed inset-0 isolate z-[9999] overflow-y-auto overscroll-contain bg-slate-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-presentacion-clase"
    >
      <EncabezadoPresentacion hayCambios={hayCambios} onCerrar={onCerrar} />

      <main className="mx-auto max-w-6xl space-y-6 px-3 py-5 sm:px-6 sm:py-8">
        <PortadaPresentacion
          asignacion={asignacion}
          periodo={periodo}
          fecha={fecha}
          tema={form.tema}
        />

        {!tieneContenido && <PresentacionSinContenido />}

        {tieneContexto && (
          <SeccionPresentacion titulo="Contexto pedagógico" tono="violet">
            <div className="grid gap-4 md:grid-cols-2">
              {tieneTexto(form.unidad) && (
                <CampoPresentacion label={cuadros.unidad.nombre} contenido={form.unidad} />
              )}
              {tieneTexto(form.estandar) && (
                <CampoPresentacion
                  label={cuadros.estandar.nombre}
                  contenido={form.estandar}
                />
              )}
            </div>
          </SeccionPresentacion>
        )}

        {tieneLogro && (
          <SeccionPresentacion titulo={cuadros.proposito.nombre} tono="emerald">
            <CampoPresentacion contenido={form.proposito} />
          </SeccionPresentacion>
        )}

        {tieneActividadInicial && (
          <SeccionPresentacion titulo={cuadros.clase.nombre} tono="purple">
            <CampoPresentacion contenido={form.clase} />
          </SeccionPresentacion>
        )}

        {tieneActividadEnClase && (
          <SeccionPresentacion titulo="Actividad en clase" tono="amber">
            <CampoPresentacion contenido={form.competencias} />
          </SeccionPresentacion>
        )}

        {tieneDesarrolloCognitivo && (
          <SeccionPresentacion titulo={cuadros.dba.nombre} tono="orange">
            <div
              className={`grid gap-5 ${
                tieneTexto(form.dba) && tieneImagen1
                  ? "lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]"
                  : ""
              }`}
            >
              {tieneTexto(form.dba) && (
                <CampoPresentacion contenido={form.dba} />
              )}
              {tieneImagen1 && (
                <ImagenPresentacion
                  seleccionada={imagenesSeleccionadas.imagen1}
                  guardada={imagenesGuardadas.imagen1}
                  alt={cuadros.imagen1.nombre}
                />
              )}
            </div>
          </SeccionPresentacion>
        )}

        {tieneActividadCasa && (
          <SeccionPresentacion titulo={cuadros.actividad_casa.nombre} tono="sky">
            <div
              className={`grid gap-5 ${
                tieneTexto(form.actividad_casa) && tieneImagen2
                  ? "lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]"
                  : ""
              }`}
            >
              {tieneTexto(form.actividad_casa) && (
                <CampoPresentacion contenido={form.actividad_casa} />
              )}
              {tieneImagen2 && (
                <ImagenPresentacion
                  seleccionada={imagenesSeleccionadas.imagen2}
                  guardada={imagenesGuardadas.imagen2}
                  alt={cuadros.imagen2.nombre}
                />
              )}
            </div>
          </SeccionPresentacion>
        )}
      </main>
    </div>,
    document.body,
  );
}

function EncabezadoPresentacion({ hayCambios, onCerrar }) {
  return (
    <header className="sticky top-0 z-20 border-b border-violet-100 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3" y="4" width="18" height="13" rx="2" />
              <path
                d="M8 21h8M12 17v4M8 9l3 3 5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h2
              id="titulo-presentacion-clase"
              className="truncate text-base font-black text-slate-950 sm:text-lg"
            >
              Presentación de clase
            </h2>
            <p className="truncate text-xs text-slate-500">
              Vista organizada para consultar y compartir la planeación.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hayCambios && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
              Cambios sin guardar
            </span>
          )}
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                d="m12.5 5-5 5 5 5M8 10h8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Volver a editar
          </button>
        </div>
      </div>
    </header>
  );
}

function PortadaPresentacion({ asignacion, periodo, fecha, tema }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-violet-800 to-indigo-700 px-5 py-8 text-white shadow-xl shadow-violet-200/60 sm:px-9 sm:py-10">
      <span
        className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[36px] border-white/5"
        aria-hidden="true"
      ></span>
      <span
        className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-fuchsia-400/10 blur-2xl"
        aria-hidden="true"
      ></span>
      <div className="relative max-w-4xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">
          {asignacion.materia}
        </p>
        <h1 className="mt-3 whitespace-pre-wrap break-words text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
          {tieneTexto(tema) ? tema : "Clase sin tema registrado"}
        </h1>
        <div className="mt-6 flex flex-wrap gap-2">
          <DatoEncabezadoPresentacion label="Curso" value={asignacion.curso} />
          <DatoEncabezadoPresentacion
            label="Jornada"
            value={asignacion.jornada || "Sin definir"}
          />
          <DatoEncabezadoPresentacion
            label="Periodo"
            value={periodo || "Sin definir"}
          />
          <DatoEncabezadoPresentacion
            label="Fecha"
            value={formatearFechaPlan(fecha)}
          />
        </div>
      </div>
    </section>
  );
}

function PresentacionSinContenido() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
      <span
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h2 className="mt-4 text-lg font-black text-slate-900">
        La guía todavía no tiene contenido
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Vuelve a editar y agrega la información que deseas presentar.
      </p>
    </section>
  );
}

function DatoEncabezadoPresentacion({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
      <span className="text-violet-200">{label}:</span>
      <span className="text-white">{value}</span>
    </span>
  );
}

function SeccionPresentacion({ titulo, tono, children }) {
  const tonos = {
    violet: { borde: "border-violet-200", acento: "bg-violet-600" },
    emerald: { borde: "border-emerald-200", acento: "bg-emerald-500" },
    purple: { borde: "border-purple-200", acento: "bg-purple-600" },
    orange: { borde: "border-orange-200", acento: "bg-orange-500" },
    sky: { borde: "border-sky-200", acento: "bg-sky-500" },
    amber: { borde: "border-amber-200", acento: "bg-amber-500" },
  };
  const tonoActual = tonos[tono] || tonos.violet;

  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${tonoActual.borde}`}
    >
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
        <span
          className={`h-7 w-1 shrink-0 rounded-full ${tonoActual.acento}`}
          aria-hidden="true"
        ></span>
        <h2 className="text-lg font-black text-slate-950 sm:text-xl">
          {titulo}
        </h2>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function CampoPresentacion({ label, contenido }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
      {label && (
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-violet-700">
          {label}
        </p>
      )}
      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 sm:text-base">
        <TextoConEnlaces texto={contenido} />
      </p>
    </article>
  );
}

function ImagenPresentacion({ seleccionada, guardada, alt }) {
  const {
    url: urlGuardada,
    cargando,
    error,
  } = useImagenProtegida(seleccionada ? "" : guardada);
  const url = seleccionada?.url || urlGuardada;
  const esPdf = seleccionada ? Boolean(seleccionada.esPdf) : esEvidenciaPdf(guardada);
  const nombre = seleccionada?.nombre || alt;
  const { abrir, cerrar, visorAbierto } = useAperturaEvidencia({ url, esPdf });

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={abrir}
        disabled={!url}
        className="flex min-h-64 w-full items-center justify-center bg-white transition hover:bg-slate-50 disabled:cursor-default"
        aria-label={
          esPdf ? `Abrir documento: ${alt}` : `Ver imagen completa: ${alt}`
        }
      >
        {cargando && (
          <span className="flex min-h-64 items-center justify-center gap-2 text-sm font-semibold text-slate-500">
            <SpinnerPresentacion /> Cargando evidencia...
          </span>
        )}
        {error && !cargando && (
          <span className="flex min-h-64 items-center justify-center px-5 text-sm font-semibold text-rose-700">
            {error}
          </span>
        )}
        {url && !cargando && (
          <ContenidoEvidencia
            url={url}
            esPdf={esPdf}
            alt={alt}
            nombre={nombre}
            claseImagen="max-h-[32rem] min-h-64 w-full object-contain p-2"
          />
        )}
      </button>
      {visorAbierto && (
        <VisorPdfPlaneacion url={url} nombre={nombre} onCerrar={cerrar} />
      )}
      <div className="flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">{alt}</p>
          {seleccionada?.nombre && (
            <p className="truncate text-xs text-slate-500">
              {seleccionada.nombre}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={abrir}
          disabled={!url}
          className="w-fit text-xs font-bold text-violet-700 hover:text-violet-900 disabled:text-slate-400"
        >
          {esPdf ? "Abrir documento" : "Ver imagen completa"}
        </button>
      </div>
    </article>
  );
}

function SpinnerPresentacion() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      aria-hidden="true"
    />
  );
}

function tieneTexto(value) {
  return Boolean(String(value || "").trim());
}
