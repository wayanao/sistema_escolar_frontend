import { useEffect, useRef, useState } from "react";
import { MENSAJE_FALTAN_PORCENTAJES, SUMA_COMPLETA } from "../../utils/planilla/porcentajes";

/**
 * Los porcentajes por tipo de nota, encima de la tabla de la planilla.
 *
 * Parte B de `docs/funcionalidades/SUBNOTAS_PLANILLA.md` (PB9). Una pastilla
 * por tipo con su porcentaje ("Quiz · 40 %") o "+ %" si no tiene; al pulsarla
 * se escribe ahí mismo: Enter guarda y Esc cancela. Está fuera de la tabla
 * para que sirva igual en celular, donde no hay columnas. Debajo, la suma y el
 * aviso mientras los porcentajes no están completos; sin ningún porcentaje no
 * hay suma ni aviso.
 *
 * Solo presenta: quien guarda es `onGuardar(tipo, texto)`, que responde
 * `true` si quedó guardado.
 */
function PorcentajesPlanilla({
    columnas,
    porcentajesPorTipo,
    suma,
    activos,
    tipoGuardando,
    formatearEtiquetaColumna,
    onGuardar,
}) {
    const [editando, setEditando] = useState(null);
    const [texto, setTexto] = useState("");
    const campoRef = useRef(null);

    useEffect(() => {
        if (editando) campoRef.current?.focus();
    }, [editando]);

    if (!columnas || columnas.length === 0) return null;

    const hayPorcentajes = Object.keys(porcentajesPorTipo || {}).length > 0;
    const ocupado = tipoGuardando !== null && tipoGuardando !== undefined;

    const abrir = (tipo) => {
        const actual = porcentajesPorTipo?.[tipo];
        setTexto(actual === undefined ? "" : String(actual));
        setEditando(tipo);
    };

    const cerrar = () => {
        setEditando(null);
        setTexto("");
    };

    const guardar = async (tipo) => {
        const guardado = await onGuardar(tipo, texto);
        if (guardado) cerrar();
    };

    return (
        <section className="mb-4 rounded-lg border border-violet-200 bg-white p-4 shadow-sm">
            <div
                role="group"
                aria-label="Porcentajes por tipo de nota"
                className="flex flex-wrap items-center gap-2"
            >
                <span className="mr-1 text-sm font-semibold text-gray-700">
                    Porcentajes{hayPorcentajes ? "" : " (opcional)"}:
                </span>
                {columnas.map((tipo) => {
                    const etiqueta = formatearEtiquetaColumna(tipo);
                    const porcentaje = porcentajesPorTipo?.[tipo];
                    const tiene = porcentaje !== undefined;

                    if (editando === tipo) {
                        return (
                            <span key={tipo} className="inline-flex items-center gap-1 rounded-full border border-violet-400 bg-violet-50 px-2 py-1">
                                <span className="text-sm text-violet-900" translate="no">{etiqueta}</span>
                                <input
                                    ref={campoRef}
                                    type="text"
                                    inputMode="numeric"
                                    aria-label={`Porcentaje de ${etiqueta}`}
                                    className="w-14 rounded border border-violet-300 px-1 py-0.5 text-center text-sm"
                                    value={texto}
                                    disabled={ocupado}
                                    onChange={(evento) => setTexto(evento.target.value)}
                                    onKeyDown={(evento) => {
                                        if (evento.key === "Enter") {
                                            evento.preventDefault();
                                            void guardar(tipo);
                                        } else if (evento.key === "Escape") {
                                            evento.preventDefault();
                                            cerrar();
                                        }
                                    }}
                                />
                                <span className="text-sm text-violet-900">%</span>
                                <button
                                    type="button"
                                    aria-label={`Guardar el porcentaje de ${etiqueta}`}
                                    className="rounded px-1 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                    disabled={ocupado}
                                    onClick={() => void guardar(tipo)}
                                >
                                    ✓
                                </button>
                                <button
                                    type="button"
                                    aria-label="Cancelar"
                                    className="rounded px-1 text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                                    disabled={ocupado}
                                    onClick={cerrar}
                                >
                                    ✕
                                </button>
                            </span>
                        );
                    }

                    return (
                        <button
                            key={tipo}
                            type="button"
                            aria-label={tiene
                                ? `Cambiar el porcentaje de ${etiqueta}: ${porcentaje} %`
                                : `Poner porcentaje a ${etiqueta}`}
                            aria-busy={tipoGuardando === tipo}
                            disabled={ocupado}
                            className={`rounded-full border px-3 py-1 text-sm transition-colors disabled:cursor-wait disabled:opacity-60 ${tiene
                                ? "border-violet-300 bg-violet-50 font-semibold text-violet-900 hover:bg-violet-100"
                                : "border-dashed border-gray-300 bg-white text-gray-500 hover:border-violet-300 hover:text-violet-700"}`}
                            onClick={() => abrir(tipo)}
                        >
                            <span translate="no">{etiqueta}</span>
                            {tiene ? ` · ${porcentaje} %` : " · + %"}
                        </button>
                    );
                })}
            </div>

            {hayPorcentajes && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <p className="font-semibold text-gray-800">
                        Porcentajes: {suma} % de {SUMA_COMPLETA} %
                    </p>
                    <p
                        role="status"
                        className={activos ? "text-emerald-700" : "text-amber-700"}
                    >
                        {activos
                            ? "Porcentajes completos: el promedio es ponderado."
                            : MENSAJE_FALTAN_PORCENTAJES}
                    </p>
                </div>
            )}
        </section>
    );
}

export default PorcentajesPlanilla;
