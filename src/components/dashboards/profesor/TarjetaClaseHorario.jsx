import {
  ESTADO_AHORA,
  ESTADO_SIGUIENTE,
  ESTADO_TERMINADA,
  accionesDeClase,
  duracionClase,
} from "../../../utils/dashboards/horario";
import { formatearHora12 } from "../../../utils/dashboards/profesor";

// Cada estado pinta la tarjeta entera, para que se note de lejos (pedido del
// usuario el 2026-11-10): rojo la que ya se dio, verde la de ahora, morado
// la siguiente y blanco las demás.
const ESTILOS_ESTADO = {
  [ESTADO_AHORA]: {
    texto: "Ahora",
    // `tarjeta-clase-ahora` (src/index.css) la hace latir.
    tarjeta: "tarjeta-clase-ahora border-emerald-400 bg-emerald-100",
    insignia: "bg-emerald-600 text-white",
    punto: "bg-white animate-pulse",
  },
  [ESTADO_SIGUIENTE]: {
    texto: "Siguiente",
    tarjeta: "border-purple-300 bg-purple-100",
    insignia: "bg-purple-600 text-white",
    punto: "bg-white",
  },
  [ESTADO_TERMINADA]: {
    texto: "Ya se dio",
    tarjeta: "border-rose-300 bg-rose-100",
    insignia: "bg-rose-600 text-white",
    punto: "bg-white",
  },
};
const ESTILO_SIN_ESTADO = { tarjeta: "border-slate-200 bg-white" };

// Sin partir el texto: si los dos botones no caben en una fila (tarjeta
// angosta, como en tablet mini), cada uno pasa a su propia fila completa.
const BOTON_LLENO =
  "inline-flex min-h-10 flex-[2_1_auto] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-purple-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-200";
const BOTON_CLARO =
  "inline-flex min-h-10 flex-[1_1_auto] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-sm font-bold text-purple-800 transition hover:border-purple-300 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-100";

function IconoAsistencia() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="m16 11 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoPlanilla() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Una clase del horario del panel. Desde aquí se entra directo a la clase:
 * cada botón la deja elegida y abre la pantalla (lo hace `onEntrar`). Un solo
 * botón lleno por tarjeta; el otro, claro.
 */
function TarjetaClaseHorario({ clase, estado = null, faltaParaEmpezar = "", onTomarAsistencia, onAbrirPlanilla }) {
  const acciones = accionesDeClase(clase);
  const estilo = ESTILOS_ESTADO[estado] || ESTILO_SIN_ESTADO;
  const horario = `${formatearHora12(clase.hora_inicio)} – ${formatearHora12(clase.hora_fin)}`;
  const duracion = duracionClase(clase);

  return (
    <article
      aria-label={`${clase.materia}, curso ${clase.curso}, ${horario}`}
      data-estado={estado || "pendiente"}
      className={`relative flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md ${estilo.tarjeta}`}
    >
      <div className="flex flex-1 flex-col gap-2 px-3.5 py-3">
        <div className="flex flex-wrap-reverse items-end justify-between gap-x-2 gap-y-1">
          <div className="min-w-0">
            <p className="whitespace-nowrap text-sm font-bold tabular-nums text-slate-900">{horario}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {faltaParaEmpezar || duracion}
            </p>
          </div>
          {estilo.texto && (
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${estilo.insignia}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} aria-hidden="true" />
              {estilo.texto}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h4 className="break-words text-base font-bold leading-snug text-slate-950" translate="no">
            {clase.materia}
          </h4>
          <span
            className="mt-1 inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-700"
            translate="no"
          >
            Curso {clase.curso}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-0.5">
          {acciones.asistencia && (
            <button type="button" onClick={() => onTomarAsistencia(clase)} className={BOTON_LLENO}>
              <IconoAsistencia />
              {acciones.textoAsistencia}
            </button>
          )}
          {acciones.planilla && (
            <button
              type="button"
              onClick={() => onAbrirPlanilla(clase)}
              className={acciones.asistencia ? BOTON_CLARO : BOTON_LLENO}
            >
              <IconoPlanilla />
              Planilla
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default TarjetaClaseHorario;
