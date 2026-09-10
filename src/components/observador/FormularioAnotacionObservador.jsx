import { DIMENSIONES_OBSERVADOR } from "../../utils/observador/anotaciones";

/**
 * El formulario de una anotación: los tres campos de siempre y la marca
 * positiva o negativa, que es obligatoria.
 *
 * La corrección de mayúsculas se dispara **al salir del campo** (`onBlur`),
 * jamás en cada tecla: corregir letra por letra hace saltar el cursor y el
 * usuario siente que la pantalla pelea con él.
 *
 * Presentacional: sin hooks propios y sin HTTP.
 */
export default function FormularioAnotacionObservador({
  valores,
  onCambiarTexto,
  onSalirDeCampo,
  onCambiarPositiva,
  onGuardar,
  onCancelar,
  guardando,
  puedeGuardar,
  error,
  periodoTexto,
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

      <fieldset className="space-y-1">
        <legend className="text-sm font-medium text-slate-700">
          ¿Es positiva o negativa?
        </legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="positiva"
              checked={valores.positiva === true}
              onChange={() => onCambiarPositiva(true)}
              disabled={guardando}
            />
            🟢 Positiva
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="positiva"
              checked={valores.positiva === false}
              onChange={() => onCambiarPositiva(false)}
              disabled={guardando}
            />
            🔴 Negativa
          </label>
        </div>
      </fieldset>

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
          className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-slate-300"
        >
          {guardando ? "Guardando..." : "Guardar"}
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
