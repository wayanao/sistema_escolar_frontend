import {
  ESTADOS_FILTRABLES,
  ESTADOS_PLANEACION_ADMIN,
} from "../../../utils/planeaciones/admin";
import { CLASE_CAMPO_PLANEACION_ADMIN } from "./ElementosPlaneacionAdmin";

function FiltrosPlaneacionesAdmin({
  profesores,
  profesorId,
  estado,
  conteoPendientes,
  conteoVistos,
  onCambiarProfesor,
  onCambiarEstado,
}) {
  const conteos = { pendiente: conteoPendientes, visto: conteoVistos };
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-end">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Profesor</span>
          <select
            value={profesorId}
            onChange={(event) => onCambiarProfesor(event.target.value)}
            className={`${CLASE_CAMPO_PLANEACION_ADMIN} mt-2 min-h-11`}
          >
            <option value="">Todos los profesores</option>
            {profesores.map((profesor) => (
              <option key={profesor.id} value={profesor.id}>
                {profesor.nombre} {profesor.apellido}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="min-w-0">
          <legend className="text-sm font-bold text-slate-700">Estado de revisión</legend>
          <div className="mt-2 flex min-h-11 flex-wrap items-center gap-2 px-1">
            {ESTADOS_FILTRABLES.map((value) => (
              <FiltroEstado
                key={value}
                value={value}
                actual={estado}
                onChange={onCambiarEstado}
                label={ESTADOS_PLANEACION_ADMIN[value].label}
                count={conteos[value] ?? null}
                tonoContador={value === "visto" ? "sky" : "rose"}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
}

function FiltroEstado({
  value,
  actual,
  onChange,
  label,
  count = null,
  tonoContador = "rose",
}) {
  const mostrarContador = Number.isFinite(count) && count > 0;
  const colorContador =
    tonoContador === "sky" ? "bg-sky-600" : "bg-rose-600";

  return (
    <button
      type="button"
      onClick={() => onChange(actual === value ? "" : value)}
      aria-pressed={actual === value}
      aria-label={Number.isFinite(count) ? `${label}: ${count} planeaciones` : label}
      className={`relative rounded-full border px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 ${
        actual === value
          ? "border-violet-300 bg-violet-100 text-violet-900"
          : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-800"
      }`}
    >
      {label}
      {mostrarContador && (
        <span
          className={`absolute -right-2.5 -top-2.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-black leading-none text-white shadow-sm ${colorContador}`}
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

export default FiltrosPlaneacionesAdmin;
