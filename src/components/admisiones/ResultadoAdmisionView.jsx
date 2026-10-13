import { RESULTADOS, etiquetaResultado } from "../../utils/admisiones/admisiones";
import SpinnerView from "../anioLectivo/SpinnerView";
import { claseCampo } from "./CamposAdmision";

// El resultado de la entrevista (paso E4). "No aprobado" exige el motivo; el
// backend lo vuelve a exigir. La ayuda recuerda la regla de no discriminación
// (Corte Constitucional, T-510 de 1994). Solo presenta.
export default function ResultadoAdmisionView({
  resultado,
  errores,
  deshabilitado,
  guardando,
  onCambiar,
  onGuardar,
}) {
  const errorMotivo = errores.motivo_resultado;

  return (
    <section className="rounded-lg border border-gray-200 p-4">
      <fieldset disabled={deshabilitado}>
        <legend className="text-lg font-medium text-gray-900">Resultado de la entrevista</legend>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          {RESULTADOS.map((valor) => (
            <label key={valor} className="flex items-center gap-2 text-gray-800">
              <input
                type="radio"
                name="resultado-admision"
                value={valor}
                checked={resultado.resultado === valor}
                onChange={() => onCambiar("resultado", valor)}
                className="h-4 w-4"
              />
              {etiquetaResultado(valor)}
            </label>
          ))}
        </div>

        <label htmlFor="admision-motivo_resultado" className="mt-4 mb-1 block text-sm font-medium text-gray-700">
          Motivo de la decisión
        </label>
        <textarea
          id="admision-motivo_resultado"
          rows={3}
          value={resultado.motivo_resultado}
          onChange={(evento) => onCambiar("motivo_resultado", evento.target.value)}
          aria-invalid={errorMotivo ? true : undefined}
          aria-describedby="admision-motivo_resultado-ayuda"
          className={claseCampo}
        />
        <p id="admision-motivo_resultado-ayuda" className="mt-1 text-sm text-gray-600">
          Obligatorio si no se aprueba. Escribe un motivo objetivo (por ejemplo, cupo o
          requisitos académicos): la admisión no puede negarse por religión, origen o
          composición de la familia.
        </p>
        {errorMotivo && <p className="mt-1 text-sm text-red-700">{errorMotivo}</p>}
      </fieldset>

      {!deshabilitado && (
        <button
          type="button"
          onClick={onGuardar}
          disabled={guardando}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-700 px-4 py-2 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {guardando && <SpinnerView />}
          {guardando ? "Guardando resultado..." : "Guardar resultado"}
        </button>
      )}
    </section>
  );
}
