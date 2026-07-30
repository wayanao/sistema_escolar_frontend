import { ESTADOS_PLANEACION_ADMIN } from "../../../utils/planeaciones/admin";

export const CLASE_CAMPO_PLANEACION_ADMIN =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

export function EstadoPlaneacionAdminBadge({ estado }) {
  const config = ESTADOS_PLANEACION_ADMIN[estado] || ESTADOS_PLANEACION_ADMIN.pendiente;

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${config.className}`}>
      {config.label}
    </span>
  );
}

export function MensajeEstadoPlaneacionAdmin({ tono, mensaje }) {
  const styles =
    tono === "error"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : tono === "exito"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-amber-200 bg-amber-50 text-amber-800";
  const esExito = tono === "exito";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${styles} ${
        esExito ? "mensaje-estado-nuevo" : ""
      }`}
      role={esExito ? "status" : "alert"}
      aria-live={esExito ? "polite" : "assertive"}
    >
      {esExito ? (
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
            <IconoCheck />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Actualización nueva
            </p>
            <p className="mt-0.5 leading-6">{mensaje}</p>
          </div>
        </div>
      ) : (
        mensaje
      )}
    </div>
  );
}

export function SpinnerPlaneacionAdmin({ className = "h-4 w-4 border-2" }) {
  return (
    <span
      className={`${className} animate-spin rounded-full border-current border-r-transparent`}
      aria-hidden="true"
    />
  );
}

export function IconoCheck() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m4 10 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
