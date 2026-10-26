import IconoLanding from "./IconoLanding";
import { formatearNota, nivelNota } from "../../utils/landing/contenido";

const TONO_NOTA = {
  alto: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  basico: "bg-amber-50 text-amber-700 ring-amber-200",
  bajo: "bg-rose-50 text-rose-700 ring-rose-200",
};

// La columna del medio se esconde en pantallas angostas para que la tabla quepa.
const columnaOpcional = (indice) => (indice === 1 ? "hidden sm:table-cell" : "");

// Una ventana que imita la planilla del sistema, con datos inventados, y tres
// tarjetas que flotan alrededor. Para un lector de pantalla es una sola imagen
// con su descripción.
function VentanaProducto({ planilla }) {
  return (
    <div
      role="img"
      aria-label="Ejemplo de la planilla de notas de Auligo, con datos inventados"
      className="relative mx-auto w-full max-w-xl lg:max-w-none"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-purple-600/40 via-violet-500/20 to-lime-300/20 blur-2xl" />

      <div className="relative transition-transform duration-700 ease-out [transform:perspective(1600px)_rotateY(-9deg)_rotateX(5deg)] hover:[transform:perspective(1600px)_rotateY(0deg)_rotateX(0deg)] motion-reduce:transition-none">
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-2 shadow-[0_40px_120px_rgba(8,3,20,0.6)] backdrop-blur-xl">
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-lime-300/80" />
            <div className="ml-3 flex-1 truncate rounded-md bg-white/10 px-3 py-1 text-[11px] font-medium text-purple-100/80">
              auligo · Planilla · {planilla.curso}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 text-slate-800 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-purple-600">
                  Planilla · Periodo 2
                </p>
                <p className="mt-0.5 text-base font-black text-slate-900">{planilla.curso}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-lime-100 px-2.5 py-1 text-[11px] font-bold text-lime-800 ring-1 ring-lime-300">
                <IconoLanding nombre="check" className="h-3.5 w-3.5" />
                Guardado
              </span>
            </div>

            <table className="mt-4 w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10.5px] uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-bold">Estudiante</th>
                  {planilla.actividades.map((actividad, indice) => (
                    <th
                      key={actividad.nombre}
                      className={`pb-2 text-center font-bold ${columnaOpcional(indice)}`}
                    >
                      {actividad.nombre}{" "}
                      <span className="text-slate-300">{actividad.porcentaje}%</span>
                    </th>
                  ))}
                  <th className="pb-2 text-center font-bold text-purple-600">Def.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {planilla.filas.map((fila) => (
                  <tr key={fila.estudiante}>
                    <td className="py-2 pr-2 font-semibold text-slate-700">{fila.estudiante}</td>
                    {fila.notas.map((nota, indice) => (
                      <td
                        key={planilla.actividades[indice].nombre}
                        className={`py-2 text-center tabular-nums text-slate-500 ${columnaOpcional(indice)}`}
                      >
                        {formatearNota(nota)}
                      </td>
                    ))}
                    <td className="py-2 text-center">
                      <span
                        className={`inline-flex min-w-[2.6rem] justify-center rounded-md px-1.5 py-0.5 font-bold tabular-nums ring-1 ${TONO_NOTA[nivelNota(fila.definitiva)]}`}
                      >
                        {formatearNota(fila.definitiva)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="landing-flotar absolute -left-4 -top-7 hidden items-center gap-3 rounded-2xl border border-white/60 bg-white/90 p-3 pr-4 shadow-[0_18px_40px_rgba(10,4,25,0.35)] backdrop-blur sm:flex lg:-left-10">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-300 text-slate-950">
          <IconoLanding nombre="check" className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-slate-500">Boletines del periodo</p>
          <p className="text-sm font-black text-slate-900">32 de 32 listos</p>
        </div>
      </div>

      <div className="landing-flotar absolute -bottom-8 -right-3 hidden w-48 rounded-2xl border border-white/60 bg-white/90 p-3.5 shadow-[0_18px_40px_rgba(10,4,25,0.35)] backdrop-blur [animation-delay:-2s] sm:block lg:-right-8">
        <p className="text-[11px] font-semibold text-slate-500">Asistencia de hoy</p>
        <div className="mt-1 flex items-end gap-2">
          <p className="text-2xl font-black leading-none text-slate-900">96%</p>
          <div className="mb-1 h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-purple-500 to-lime-400" />
          </div>
        </div>
      </div>

      <div className="landing-flotar absolute -bottom-10 left-8 hidden items-end gap-3 rounded-2xl border border-white/60 bg-white/90 p-3.5 shadow-[0_18px_40px_rgba(10,4,25,0.35)] backdrop-blur [animation-delay:-4s] lg:flex">
        <div>
          <p className="text-[11px] font-semibold text-slate-500">Cartera</p>
          <p className="text-sm font-black text-slate-900">Al día</p>
        </div>
        <div className="flex h-9 items-end gap-1">
          {[40, 65, 50, 85, 100].map((alto) => (
            <span
              key={alto}
              className="w-2 rounded-sm bg-gradient-to-t from-purple-600 to-purple-300"
              style={{ height: `${alto}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default VentanaProducto;
