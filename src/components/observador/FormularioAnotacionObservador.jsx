import { DIMENSIONES_OBSERVADOR } from "../../utils/observador/anotaciones";

/**
 * El formulario de una anotación: los tres campos de siempre.
 *
 * La marca de positiva o negativa se quitó el 2026-09-09, a petición del
 * usuario. No se pide, no se muestra y no se guarda.
 *
 * La corrección de mayúsculas se dispara **al salir del campo** (`onBlur`),
 * jamás en cada tecla: corregir letra por letra hace saltar el cursor y el
 * usuario siente que la pantalla pelea con él.
 *
 * En una anotación nueva (`onCambiarPeriodo`) se elige el período en que se
 * guarda; arranca en el período de trabajo (2026-11-10). Al corregir, no.
 *
 * Presentacional: sin hooks propios y sin HTTP.
 */
export default function FormularioAnotacionObservador({
  valores,
  onCambiarTexto,
  onSalirDeCampo,
  onGuardar,
  onCancelar,
  guardando,
  puedeGuardar,
  error,
  periodoTexto,
  periodo = null,
  onCambiarPeriodo,
  titulo,
}) {
  return (
    <form
      className="space-y-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onGuardar();
      }}
    >
      <h3 className="text-sm font-bold text-slate-800">{titulo}</h3>

      {DIMENSIONES_OBSERVADOR.map(({ campo, titulo: etiqueta }) => (
        <label key={campo} className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            {etiqueta}
          </span>
          <textarea
            rows={2}
            value={valores[campo]}
            onChange={(event) => onCambiarTexto(campo, event.target.value)}
            onBlur={() => onSalirDeCampo(campo)}
            disabled={guardando}
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
          />
        </label>
      ))}

      {onCambiarPeriodo && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Período de esta anotación</span>
          <select
            value={String(periodo ?? "")}
            onChange={(event) => onCambiarPeriodo(event.target.value)}
            disabled={guardando}
            className="w-full max-w-xs rounded-lg border border-purple-200 bg-purple-50/60 p-2 text-sm font-semibold text-purple-950"
          >
            <option value="1">Período 1</option>
            <option value="2">Período 2</option>
            <option value="3">Período 3</option>
            <option value="4">Período 4</option>
          </select>
        </label>
      )}

      {periodoTexto && (
        <p className="text-xs text-slate-500">{periodoTexto}</p>
      )}

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={guardando || !puedeGuardar}
          className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:bg-slate-300"
        >
          {/* La espera va en la tarjeta que sale al oprimirlo (una sola
              espera, 2026-11-07); mientras guarda, el botón solo se bloquea. */}
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={guardando}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
