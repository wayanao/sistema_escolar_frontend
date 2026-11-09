import { useState } from "react";
import { EtiquetaCampoTrabajo } from "../SelectorClaseTrabajo";
import { esFechaAsistenciaValida } from "../../utils/asistencia/profesor";

const formatoDia = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function formatearDia(valor) {
  const fecha = new Date(`${valor}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? valor : formatoDia.format(fecha);
}

/**
 * Fecha de la asistencia. Siempre arranca en hoy (lo decide la página); el
 * profesor la cambia solo si va a registrar otro día, y entonces se le avisa
 * con claridad que no es hoy.
 *
 * Al escribir la fecha a mano el campo pasa por fechas a medio escribir: el
 * texto se guarda aparte y solo se avisa a la página cuando es una fecha
 * completa y no futura. Al salir del campo vuelve a la fecha vigente.
 */
function CampoFechaAsistencia({ id = "asistencia-fecha", value, hoy, onChange }) {
  // Lo escrito a medias, o `null` si el campo muestra la fecha vigente. Se
  // borra cada vez que la fecha vigente cambia.
  const [borrador, setBorrador] = useState(null);
  const [fechaVista, setFechaVista] = useState(value);
  if (fechaVista !== value) {
    setFechaVista(value);
    setBorrador(null);
  }
  const texto = borrador ?? value;
  const esHoy = value === hoy;

  return (
    <div>
      <EtiquetaCampoTrabajo htmlFor={id} tono="sky" icono="calendario">
        Fecha
      </EtiquetaCampoTrabajo>
      <input
        id={id}
        type="date"
        value={texto}
        max={hoy}
        onChange={(e) => {
          const nuevo = e.target.value;
          setBorrador(nuevo);
          if (nuevo !== value && esFechaAsistenciaValida(nuevo, hoy)) onChange(nuevo);
        }}
        onBlur={() => setBorrador(null)}
        className="min-h-12 w-full rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-3 text-base font-semibold text-sky-950 shadow-sm outline-none transition hover:border-sky-300 hover:bg-sky-50 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 sm:px-4"
      />
      {esHoy ? (
        <p className="mt-2 text-sm font-semibold text-emerald-700">Es la fecha de hoy.</p>
      ) : (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          <p>
            <strong className="font-bold">No es hoy.</strong> Vas a registrar la asistencia del{" "}
            {formatearDia(value)}.
          </p>
          <button
            type="button"
            onClick={() => onChange(hoy)}
            className="mt-1.5 font-bold text-amber-900 underline underline-offset-2 hover:text-amber-700"
          >
            Volver a hoy
          </button>
        </div>
      )}
    </div>
  );
}

export default CampoFechaAsistencia;
