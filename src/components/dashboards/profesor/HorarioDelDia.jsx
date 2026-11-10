import { useState } from "react";
import DibujosJornada from "./DibujosJornada";
import TarjetaClaseHorario from "./TarjetaClaseHorario";
import {
  DIAS_CORTOS,
  ESTADO_SIGUIENTE,
  claveClase,
  diaInicialHorario,
  estadosDeClasesDeHoy,
  jornadaEnCurso,
  resumenDelDia,
  separarPorJornada,
  textoFaltaParaEmpezar,
} from "../../../utils/dashboards/horario";
import { DIAS_SEMANA, JORNADA_ESTILOS } from "../../../utils/dashboards/profesor";

// Cada jornada va en su propio bloque con su barra (pedido del usuario el
// 2026-11-10: «que se diferencien bien»). Las dos barras son pasteles de la
// misma intensidad, «amanecer y atardecer» (el ámbar con gris oscuro «no
// tenía simetría»): durazno la mañana y lavanda la tarde, con letra oscura.
// Así no compiten con los colores de estado de las tarjetas.
const ESTILOS_JORNADA = {
  Mañana: {
    bloque: "bg-orange-50/30",
    barra: "border-b border-orange-200 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-950",
    icono: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  Tarde: {
    bloque: "bg-violet-50/30",
    barra: "border-b border-purple-200 bg-gradient-to-r from-violet-100 to-purple-100 text-purple-950",
    icono: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinejoin="round" />
      </svg>
    ),
  },
};

function EstadoVacio({ titulo, texto }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-700" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round" />
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="m9 16 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="text-base font-bold text-slate-900">{titulo}</p>
      {texto && <p className="max-w-sm text-sm text-slate-600">{texto}</p>}
    </div>
  );
}

/**
 * El horario del panel, un día a la vez (2026-11-10). Al entrar muestra hoy
 * (o el lunes en fin de semana) y marca la clase de «Ahora» y la
 * «Siguiente». Cada clase es una tarjeta desde la que se entra directo a
 * tomar asistencia o a la planilla.
 *
 * El día elegido es estado de la vista; las clases, la hora y qué hacer al
 * entrar llegan por props.
 */
function HorarioDelDia({
  loadingClases,
  errorClases = "",
  clasesPorDia,
  hayDosJornadas,
  hoy,
  minutosAhora,
  onTomarAsistencia,
  onAbrirPlanilla,
}) {
  const [diaElegido, setDiaElegido] = useState(() => diaInicialHorario(hoy));
  const esHoy = diaElegido === hoy;
  const hoyNoHayColegio = !DIAS_SEMANA.includes(hoy);
  const clasesDelDia = clasesPorDia[diaElegido] || [];
  const estados = esHoy ? estadosDeClasesDeHoy(clasesDelDia, minutosAhora) : [];
  const totalSemana = DIAS_SEMANA.reduce((total, dia) => total + (clasesPorDia[dia]?.length || 0), 0);
  // Hoy, la jornada que va a esta hora sale de primera.
  const jornadaActual = esHoy ? jornadaEnCurso(minutosAhora) : "";
  const grupos = separarPorJornada(clasesDelDia, hayDosJornadas, jornadaActual);

  const titulo = esHoy ? "Tus clases de hoy" : `Tus clases del ${diaElegido.toLowerCase()}`;
  const resumen = resumenDelDia(clasesDelDia);

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="horario-titulo">
      <div className="px-4 pb-4 pt-5 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-700">Tu horario</p>
            <h2 id="horario-titulo" className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
              {titulo}
            </h2>
            {!loadingClases && !errorClases && (
              <p className="mt-0.5 text-sm text-slate-600">{resumen || "Sin clases este día"}</p>
            )}
          </div>
          {!loadingClases && !errorClases && totalSemana > 0 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {totalSemana} {totalSemana === 1 ? "clase" : "clases"} en la semana
            </span>
          )}
        </div>

        <div role="tablist" aria-label="Día del horario" className="mt-4 grid grid-cols-5 gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {DIAS_SEMANA.map((dia) => {
            const activo = dia === diaElegido;
            const cantidad = clasesPorDia[dia]?.length || 0;
            const esElDeHoy = dia === hoy;
            return (
              <button
                key={dia}
                type="button"
                role="tab"
                id={`horario-pestana-${dia}`}
                aria-selected={activo}
                aria-controls="horario-panel"
                aria-label={`${dia}${esElDeHoy ? ", hoy" : ""}: ${cantidad} ${cantidad === 1 ? "clase" : "clases"}`}
                onClick={() => setDiaElegido(dia)}
                className={`relative flex min-h-14 flex-col items-center justify-center rounded-xl border px-1 py-1.5 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-200 ${
                  activo
                    ? "border-purple-600 bg-purple-600 text-white shadow-md"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-800"
                }`}
              >
                <span className="text-sm font-bold sm:hidden">{DIAS_CORTOS[dia]}</span>
                <span className="hidden text-sm font-bold sm:inline">{dia}</span>
                <span className={`mt-0.5 text-[11px] font-semibold ${activo ? "text-purple-100" : "text-slate-500"}`}>
                  {esElDeHoy ? "Hoy" : cantidad ? `${cantidad} ${cantidad === 1 ? "clase" : "clases"}` : "—"}
                </span>
                {esElDeHoy && (
                  <span className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${activo ? "bg-white" : "bg-purple-600"}`} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        {hoyNoHayColegio && diaElegido === DIAS_SEMANA[0] && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Hoy es {hoy.toLowerCase()}: no hay clases. Te mostramos el horario del lunes.
          </p>
        )}
      </div>

      <div id="horario-panel" role="tabpanel" aria-labelledby={`horario-pestana-${diaElegido}`} className="border-t border-slate-100 bg-slate-50/70 p-3 sm:p-4">
        {loadingClases ? (
          <EstadoVacio titulo="Cargando tu horario…" />
        ) : errorClases ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-sm font-semibold text-red-700">
            {errorClases}
          </p>
        ) : totalSemana === 0 ? (
          <EstadoVacio
            titulo="No tienes clases con horario asignado todavía."
            texto="Cuando coordinación te asigne el horario, aquí verás tus clases de cada día."
          />
        ) : clasesDelDia.length === 0 ? (
          <EstadoVacio
            titulo={`No tienes clases el ${diaElegido.toLowerCase()}`}
            texto="Elige otro día arriba para ver sus clases."
          />
        ) : (
          <div className="space-y-4">
            {grupos.map((grupo) => (
              <section
                key={grupo.jornada || "dia"}
                aria-label={grupo.jornada ? `Jornada ${grupo.jornada.toLowerCase()}` : undefined}
                className={grupo.jornada ? `overflow-hidden rounded-2xl border border-slate-200 shadow-sm ${ESTILOS_JORNADA[grupo.jornada]?.bloque || "bg-white"}` : ""}
              >
                {grupo.jornada && (
                  <div className={`relative min-h-16 overflow-hidden xl:min-h-20 ${ESTILOS_JORNADA[grupo.jornada]?.barra || "bg-slate-600 text-white"}`}>
                    <DibujosJornada jornada={grupo.jornada} />
                    {/* El texto deja libre la derecha, donde van los dibujos. */}
                    <div className="relative flex min-h-16 flex-wrap items-center gap-x-3 gap-y-1 py-2.5 pl-4 pr-32 xl:min-h-20 xl:pr-96">
                      <span className="flex items-center gap-2">
                        {ESTILOS_JORNADA[grupo.jornada]?.icono}
                        <h3 className="text-base font-bold">Jornada {grupo.jornada.toLowerCase()}</h3>
                      </span>
                      {grupo.jornada === jornadaActual && (
                        <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">En curso</span>
                      )}
                      <span className="text-sm font-medium opacity-90">
                        {JORNADA_ESTILOS[grupo.jornada]?.rango} · {grupo.clases.length} {grupo.clases.length === 1 ? "clase" : "clases"}
                      </span>
                    </div>
                  </div>
                )}
                <div className={`grid grid-cols-1 gap-2.5 min-[600px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ${grupo.jornada ? "p-3" : ""}`}>
                  {grupo.clases.map((clase) => {
                    const estado = esHoy ? estados[clasesDelDia.indexOf(clase)] : null;
                    return (
                      <TarjetaClaseHorario
                        key={claveClase(clase)}
                        clase={clase}
                        estado={estado}
                        faltaParaEmpezar={estado === ESTADO_SIGUIENTE ? textoFaltaParaEmpezar(clase, minutosAhora) : ""}
                        onTomarAsistencia={onTomarAsistencia}
                        onAbrirPlanilla={onAbrirPlanilla}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default HorarioDelDia;
