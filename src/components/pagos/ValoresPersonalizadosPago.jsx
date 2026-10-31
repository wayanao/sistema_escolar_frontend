import CampoPesos from "../CampoPesos";
import { formatearMoneda } from "../../utils/pagos/formatos";

export default function ValoresPersonalizadosPago({
  tiposPagos,
  valoresPersonalizados,
  valorPersonalizadoData,
  guardandoValorPersonalizado,
  onSeleccionarTipo,
  onActualizarCampo,
  onGuardar,
  onQuitar,
}) {
  return (
    <section className="mb-6 rounded-lg border border-purple-100 bg-purple-50/50 p-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Valores personalizados</h3>
          <p className="text-sm text-slate-600">
            Ajusta el valor de un concepto solo para este estudiante.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr] xl:grid-cols-[1fr_0.7fr_1.3fr_auto]">
        <select
          value={valorPersonalizadoData.tipo_pago_id}
          onChange={(event) => onSeleccionarTipo(event.target.value)}
          className="w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        >
          <option value="">Selecciona concepto</option>
          {tiposPagos.map((tipoPago) => (
            <option key={tipoPago.id} value={tipoPago.id}>
              {tipoPago.nombre} - base {formatearMoneda(tipoPago.valor)}
            </option>
          ))}
        </select>

        <CampoPesos
          min={0}
          valor={valorPersonalizadoData.valor}
          onCambiar={(valor) => onActualizarCampo("valor", valor)}
          className="w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          placeholder="Valor personalizado"
        />

        <input
          type="text"
          value={valorPersonalizadoData.motivo}
          onChange={(event) => onActualizarCampo("motivo", event.target.value)}
          className="w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          placeholder="Motivo o acuerdo"
          maxLength={250}
        />

        <button
          type="button"
          onClick={onGuardar}
          disabled={guardandoValorPersonalizado}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
        >
          {guardandoValorPersonalizado ? "Guardando..." : "Guardar valor"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        {valoresPersonalizados.length === 0 ? (
          <p className="rounded-lg border border-dashed border-purple-200 bg-white/70 p-3 text-sm text-slate-500">
            Este estudiante usa los valores normales de su curso.
          </p>
        ) : (
          valoresPersonalizados.map((valorPersonalizado) => (
            <div
              key={valorPersonalizado.id}
              className="flex flex-col gap-3 rounded-lg border border-purple-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{valorPersonalizado.tipo_pago_nombre}</p>
                <p className="text-sm text-slate-600">
                  Personalizado:{" "}
                  <span className="font-semibold text-purple-700">
                    {formatearMoneda(valorPersonalizado.valor)}
                  </span>
                  {" · "}
                  Curso/base:{" "}
                  {formatearMoneda(valorPersonalizado.valor_curso ?? valorPersonalizado.valor_base)}
                </p>
                {valorPersonalizado.motivo && (
                  <p className="text-xs text-slate-500">Motivo: {valorPersonalizado.motivo}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSeleccionarTipo(valorPersonalizado.tipo_pago_id)}
                  className="rounded-lg border border-purple-200 px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onQuitar(valorPersonalizado)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
