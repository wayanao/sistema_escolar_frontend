import { useState } from "react";
import ValoresPagoMatriculaView from "../anioLectivo/ValoresPagoMatriculaView";

const ID_PANEL = "valores-personalizados-panel";

// Se configura de vez en cuando (una beca, un acuerdo), no en cada cobro: por
// eso empieza cerrado y la barra solo dice si el estudiante tiene alguno. Al
// abrirlo se ve el recuadro "Valores de pago" de matricular, sin cambios: una
// fila por concepto que se le cobra, con el precio de su curso y lo que paga.
// Qué está abierto es estado de la vista, no del pago.
export default function ValoresPersonalizadosPago({
  anio,
  estudianteNombre,
  valoresPersonalizados,
  filas,
  borradores,
  cargando,
  guardandoTipoId,
  mensaje,
  error,
  onAbrir,
  onCambiarBorrador,
  onGuardar,
  onVolverAlPrecio,
}) {
  const [abierto, setAbierto] = useState(false);
  const cantidad = valoresPersonalizados.length;
  const resumen = cantidad === 0
    ? "Usa los valores normales de su curso"
    : `${cantidad} ${cantidad === 1 ? "concepto" : "conceptos"} con valor personalizado`;

  const alternar = () => {
    if (!abierto) onAbrir();
    setAbierto(!abierto);
  };

  return (
    <section className="mb-6 rounded-lg border border-purple-100 bg-purple-50/50">
      <h3>
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={ID_PANEL}
          onClick={alternar}
          className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left hover:bg-purple-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          <span className="min-w-0">
            <span className="block text-base font-semibold text-slate-900">
              Valores personalizados
            </span>
            <span
              className={`block text-sm ${
                cantidad > 0 ? "font-semibold text-purple-700" : "text-slate-600"
              }`}
            >
              {resumen}
            </span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-sm text-purple-700">
            {abierto ? "▲" : "▼"}
          </span>
        </button>
      </h3>

      {abierto && (
        <div id={ID_PANEL} className="border-t border-purple-100 p-3 sm:p-4">
          <ValoresPagoMatriculaView
            anio={anio || "este año"}
            estudianteNombre={estudianteNombre}
            filas={filas}
            borradores={borradores}
            cargando={cargando}
            guardandoTipoId={guardandoTipoId}
            mensaje={mensaje}
            error={error}
            onCambiarBorrador={onCambiarBorrador}
            onGuardar={onGuardar}
            onVolverAlPrecio={onVolverAlPrecio}
            onCerrar={() => setAbierto(false)}
          />
        </div>
      )}
    </section>
  );
}
