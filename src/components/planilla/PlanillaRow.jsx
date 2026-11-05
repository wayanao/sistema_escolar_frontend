import { VALORACIONES_DESARROLLO } from "../../constants/valoracionesDesarrollo";
import { claveNota } from "../../utils/planilla/notas";
import { contarCalificadas, subnotasDelTipo } from "../../utils/planilla/subnotas";
import { valoracionDesdePromedio } from "../../utils/valoracionesDesarrollo";
import BotonSubnotasPlanilla from "./BotonSubnotasPlanilla";
import CeldaCalculadaPlanilla from "./CeldaCalculadaPlanilla";

const TITULO_SIN_GUARDAR = "Sin guardar. Vuelve a salir de la celda para reintentar.";

// Sin `onAbrirSubnotas` la fila es la de siempre. Con él, cada celda ofrece sus
// subnotas, y la que ya tiene subnotas calificadas es calculada: muestra el
// promedio y no se escribe a mano (P1 de docs/funcionalidades/SUBNOTAS_PLANILLA.md).
function PlanillaRow({ est, numero, columnas, guardarNota, tipoEvaluacion, formatearEtiquetaColumna, notasSinGuardar, subnotasPorTipo, onAbrirSubnotas }) {
    const conSubnotas = typeof onAbrirSubnotas === "function";
    const nombreCompleto = `${est.apellido || ""} ${est.nombre || ""}`.trim();
    const promedioNumerico = Number(est.promedio);
    const promedioClass = tipoEvaluacion === "desarrollo" || Number.isNaN(promedioNumerico)
        ? "text-gray-900"
        : promedioNumerico >= 3
            ? "text-emerald-600"
            : "text-red-600";
    // En desarrollo el promedio se calcula como numero para poder compararlo,
    // pero la planilla muestra la carita equivalente, nunca el numero.
    const valoracionPromedio = tipoEvaluacion === "desarrollo"
        ? valoracionDesdePromedio(est.promedio === "" ? null : promedioNumerico)
        : null;
    const guardarNotaNumerica = async (event, columna) => {
        const input = event.currentTarget;
        const notaAnterior = est.notas?.[columna];
        const valorAnterior = notaAnterior !== null && notaAnterior !== undefined
            ? String(notaAnterior)
            : "";
        const guardadoExitoso = await guardarNota(est.estudiante_id, columna, input.value);

        if (guardadoExitoso === false) {
            input.value = valorAnterior;
            input.focus();
            input.select();
        }
    };

    return (
        <tr className="hover:bg-gray-50">
            {/* En tablet (de 600 px a xl) las columnas fijas son más angostas y
                el nombre largo baja a dos líneas: así queda espacio para las notas.
                La fila solo se ve en la tabla, desde 600 px. */}
            <td className="sticky left-0 z-20 w-10 min-w-10 max-w-10 border-b border-r border-b-gray-100/70 border-r-purple-300 bg-purple-200 px-1 py-4 text-center xl:w-16 xl:min-w-16 xl:max-w-16 xl:px-3">
                <span className="text-sm font-semibold tabular-nums text-purple-700">
                    {numero}
                </span>
            </td>
            <td className="sticky left-10 z-10 border-b border-r border-b-gray-100/70 border-r-violet-100/50 bg-white px-3 py-4 xl:left-16 xl:truncate xl:px-6">
                <div className="max-w-[150px] break-words text-sm font-medium leading-snug text-gray-900 capitalize xl:max-w-none" title={`${est.apellido} ${est.nombre}`} translate="no">
                    {est.apellido} {est.nombre}
                </div>
            </td>

                {columnas.map((col, index) => {
                    const sinGuardar = Boolean(
                        notasSinGuardar?.[claveNota(est.estudiante_id, col)],
                    );
                    const etiqueta = formatearEtiquetaColumna?.(col) || col;
                    const calificadas = conSubnotas
                        ? contarCalificadas(est, subnotasDelTipo(subnotasPorTipo, col))
                        : 0;
                    const abrirSubnotas = () => onAbrirSubnotas(est.estudiante_id, col);

                    const aMano = tipoEvaluacion === "desarrollo" ? (
                            <div
                                className={`grid grid-cols-2 gap-1 ${
                                    sinGuardar ? "rounded ring-1 ring-red-500" : ""
                                }`}
                                title={sinGuardar ? TITULO_SIN_GUARDAR : undefined}
                            >
                                {VALORACIONES_DESARROLLO.map((opcion) => {
                                    const activa = est.valoraciones?.[col] === opcion.value;
                                    return (
                                        <button
                                            key={opcion.value}
                                            type="button"
                                            title={opcion.label}
                                            aria-label={`${opcion.label} en ${formatearEtiquetaColumna?.(col) || col}`}
                                            translate="no"
                                            onClick={() => guardarNota(est.estudiante_id, col, opcion.value)}
                                            className={`border rounded px-2 py-1 text-lg ${
                                                activa
                                                    ? "border-emerald-500 bg-emerald-50"
                                                    : "border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            {opcion.emoji}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <input
                                key={`${est.estudiante_id}-${col}`}
                                type="number"
                                min="1"
                                max="5"
                                step="0.1"
                                defaultValue={
                                    est.notas[col] !== null && est.notas[col] !== undefined
                                        ? est.notas[col]
                                        : ""
                                }
                                // Sin las flechitas de subir y bajar del navegador: la nota
                                // se escribe.
                                className={`w-full max-w-[56px] px-1 py-1 border rounded text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none xl:max-w-[70px] ${
                                    sinGuardar
                                        ? "border-red-500 bg-red-50"
                                        : "border-gray-300"
                                }`}
                                title={sinGuardar ? TITULO_SIN_GUARDAR : undefined}
                                translate="no"
                                onBlur={(event) => guardarNotaNumerica(event, col)}
                                // La rueda del mouse no cambia la nota: al girarla, el campo suelta el
                                // foco y el navegador ya no la sube ni la baja (la página sigue bajando).
                                // Las flechas del teclado siguen funcionando.
                                onWheel={(event) => event.currentTarget.blur()}
                            />
                        );

                    let contenido = aMano;
                    if (calificadas > 0) {
                        contenido = (
                            <CeldaCalculadaPlanilla
                                est={est}
                                columna={col}
                                etiqueta={etiqueta}
                                nombreEstudiante={nombreCompleto}
                                tipoEvaluacion={tipoEvaluacion}
                                cantidad={calificadas}
                                onAbrir={abrirSubnotas}
                                className="min-h-8"
                            />
                        );
                    } else if (conSubnotas) {
                        contenido = (
                            <div className="flex items-center justify-center gap-1">
                                {aMano}
                                <BotonSubnotasPlanilla
                                    etiqueta={etiqueta}
                                    nombreEstudiante={nombreCompleto}
                                    onAbrir={abrirSubnotas}
                                />
                            </div>
                        );
                    }

                    return (
                    <td
                        key={`${est.estudiante_id}-${col}`}
                        className={`min-w-[88px] border-b border-b-gray-100/70 px-2 py-4 text-center xl:min-w-[100px] ${
                            index < columnas.length - 1
                                ? "border-r border-violet-100/50"
                                : ""
                        }`}
                    >
                        {contenido}
                    </td>
                    );
                })}

            <td className="sticky right-0 z-10 border-b border-l border-b-gray-100/70 border-l-emerald-100/50 bg-white px-2 py-4 text-center xl:px-6">
                <span className={`text-sm font-semibold ${promedioClass}`}>
                    {tipoEvaluacion === "desarrollo" ? (
                        <span
                            className="inline-flex items-center gap-1"
                            title={valoracionPromedio?.label || "Sin calificar"}
                        >
                            <span className="text-lg leading-none">
                                {valoracionPromedio?.emoji || "—"}
                            </span>
                        </span>
                    ) : (
                        est.promedio
                    )}
                </span>
            </td>
        </tr>
    );
}

export default PlanillaRow;
