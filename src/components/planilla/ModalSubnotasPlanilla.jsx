import { useEffect, useId, useRef, useState } from "react";
import { VALORACIONES_DESARROLLO } from "../../constants/valoracionesDesarrollo";
import { obtenerValoracion } from "../../utils/valoracionesDesarrollo";
import {
    LARGO_MAXIMO_NOMBRE_SUBNOTA,
    MAXIMO_SUBNOTAS_POR_TIPO,
    formatearNotaCalculada,
} from "../../utils/planilla/subnotas";

const TEXTO_ACCION = {
    guardar: "Guardando...",
    crear: "Agregando...",
    renombrar: "Cambiando el nombre...",
    borrar: "Borrando...",
};

function Spinner() {
    return (
        <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700"
            aria-hidden="true"
        />
    );
}

/**
 * Modal de subnotas de un estudiante en un tipo de nota.
 *
 * Ver docs/funcionalidades/SUBNOTAS_PLANILLA.md. Solo presenta: todo lo que
 * se ve y se hace llega por props desde `useComandosSubnotasPlanilla`. Lo único
 * propio es lo efímero de la pantalla: el nombre que se está escribiendo para
 * una subnota nueva, la que se está renombrando y a dónde va el foco.
 *
 * Para calificar rápido: Enter pasa a la subnota de abajo y, en la última,
 * guarda y pasa al estudiante siguiente. Esc cierra (y si hay cambios, el
 * gancho pregunta antes). Mientras algo se guarda, nada se puede tocar.
 */
function ModalSubnotasPlanilla({
    estudiante,
    tipo,
    tipoEvaluacion,
    subnotas,
    borrador,
    invalidas = [],
    vistaPrevia,
    hayCambios,
    notaAMano,
    quedaraVacia,
    limiteAlcanzado,
    posicion,
    total,
    hayAnterior,
    haySiguiente,
    accionEnCurso,
    formatearEtiquetaColumna = (valor) => valor,
    onCambiarCalificacion,
    onGuardar,
    onSiguiente,
    onAnterior,
    onCerrar,
    onCrearSubnota,
    onRenombrarSubnota,
    onBorrarSubnota,
}) {
    const idTitulo = useId();
    const idNueva = useId();
    const dialogoRef = useRef(null);
    const camposRef = useRef(new Map());
    const [nuevoNombre, setNuevoNombre] = useState("");
    const [editando, setEditando] = useState(null);

    const ocupado = Boolean(accionEnCurso);
    const desarrollo = tipoEvaluacion === "desarrollo";
    const etiqueta = formatearEtiquetaColumna(tipo);
    const nombreEstudiante = `${estudiante?.apellido || ""} ${estudiante?.nombre || ""}`.trim();
    const estudianteId = estudiante?.estudiante_id;
    const invalidasSet = new Set(invalidas.map(String));
    const notaEscrita = desarrollo
        ? obtenerValoracion(estudiante?.valoraciones?.[tipo])?.label
        : formatearNotaCalculada(estudiante?.notas?.[tipo]);

    // Al abrir, el foco vuelve a donde estaba al cerrar (la celda).
    useEffect(() => {
        const anterior = document.activeElement;
        return () => {
            if (anterior && typeof anterior.focus === "function") anterior.focus();
        };
    }, []);

    // Con cada estudiante, el foco entra en su primera subnota; sin subnotas,
    // en el diálogo.
    useEffect(() => {
        const primero = subnotas[0] && camposRef.current.get(String(subnotas[0].id));
        (primero || dialogoRef.current)?.focus();
        // Solo al cambiar de estudiante: escribir o agregar una subnota no debe
        // mover el foco.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estudianteId]);

    const registrarCampo = (clave) => (elemento) => {
        if (elemento) camposRef.current.set(clave, elemento);
        else camposRef.current.delete(clave);
    };

    const alPulsarEnterEnCampo = (evento, indice) => {
        if (evento.key !== "Enter") return;
        evento.preventDefault();
        const siguiente = subnotas[indice + 1];
        if (siguiente) {
            camposRef.current.get(String(siguiente.id))?.focus();
        } else if (haySiguiente) {
            onSiguiente();
        } else {
            onGuardar();
        }
    };

    const alPulsarTecla = (evento) => {
        if (evento.key === "Escape" && !ocupado) {
            evento.stopPropagation();
            onCerrar();
        }
    };

    const agregar = async (evento) => {
        evento.preventDefault();
        const creada = await onCrearSubnota(nuevoNombre);
        if (creada) setNuevoNombre("");
    };

    const guardarNombre = async () => {
        if (!editando) return;
        const cambiado = await onRenombrarSubnota(editando.id, editando.nombre);
        if (cambiado) setEditando(null);
    };

    const alPulsarTeclaEnNombre = (evento) => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            guardarNombre();
        } else if (evento.key === "Escape") {
            evento.stopPropagation();
            setEditando(null);
        }
    };

    // Un clic en el fondo, fuera del diálogo, cierra igual que la X.
    const alPulsarFondo = (evento) => {
        if (evento.target === evento.currentTarget && !ocupado) onCerrar();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 sm:items-center sm:p-4"
            onClick={alPulsarFondo}
            data-testid="fondo-modal-subnotas"
        >
            <div
                ref={dialogoRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={idTitulo}
                aria-busy={ocupado}
                tabIndex={-1}
                onKeyDown={alPulsarTecla}
                className="flex h-full w-full flex-col bg-white shadow-xl focus:outline-none sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-lg"
            >
                <div className="flex shrink-0 items-start justify-between gap-3 bg-purple-700 px-5 py-4 text-white sm:rounded-t-lg">
                    <div className="min-w-0">
                        <h3 id={idTitulo} className="truncate text-lg font-bold capitalize" translate="no">
                            {nombreEstudiante} · {etiqueta}
                        </h3>
                        <p className="text-sm text-purple-100">
                            Estudiante {posicion} de {total}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCerrar}
                        disabled={ocupado}
                        aria-label="Cerrar"
                        className="shrink-0 text-white hover:text-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <fieldset disabled={ocupado} className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                        {notaAMano && (
                            <p role="note" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                Nota escrita a mano: <strong translate="no">{notaEscrita}</strong>. Al guardar
                                subnotas se reemplaza por su promedio.
                            </p>
                        )}
                        {quedaraVacia && (
                            <p role="note" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                Sin subnotas calificadas, la celda queda vacía para escribirla a mano.
                            </p>
                        )}

                        {subnotas.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-sm text-gray-600">
                                Este tipo de nota todavía no tiene subnotas. Agrega la primera abajo:
                                aparecerá para todo el curso.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {subnotas.map((subnota, indice) => {
                                    const clave = String(subnota.id);
                                    const valor = borrador?.[clave] ?? "";
                                    const invalida = invalidasSet.has(clave);
                                    const enEdicion = editando && String(editando.id) === clave;
                                    const idCampo = `${idTitulo}-subnota-${clave}`;

                                    return (
                                        <li key={clave} className="rounded-lg border border-gray-200 p-3">
                                            <div className="mb-2 flex items-center justify-between gap-2">
                                                {enEdicion ? (
                                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={editando.nombre}
                                                            maxLength={LARGO_MAXIMO_NOMBRE_SUBNOTA}
                                                            onChange={(e) => setEditando({ id: subnota.id, nombre: e.target.value })}
                                                            onKeyDown={alPulsarTeclaEnNombre}
                                                            aria-label={`Nuevo nombre de ${subnota.nombre}`}
                                                            className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                                                            autoFocus
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={guardarNombre}
                                                            className="rounded border border-purple-300 px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                                                        >
                                                            Guardar nombre
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditando(null)}
                                                            className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <label
                                                            htmlFor={desarrollo ? undefined : idCampo}
                                                            className="truncate text-sm font-semibold text-gray-800"
                                                            translate="no"
                                                        >
                                                            {subnota.nombre}
                                                        </label>
                                                        <div className="flex shrink-0 items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditando({ id: subnota.id, nombre: subnota.nombre })}
                                                                aria-label={`Renombrar ${subnota.nombre}`}
                                                                title="Renombrar"
                                                                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                                            >
                                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.86 4.49 2.65 2.65M4.5 19.5l3.6-.8 10.4-10.4a1.87 1.87 0 0 0-2.65-2.65L5.45 16.05 4.5 19.5Z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => onBorrarSubnota(subnota.id)}
                                                                aria-label={`Borrar ${subnota.nombre}`}
                                                                title="Borrar"
                                                                className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                                                            >
                                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 .4 8m5.2 0L15 9m-8.5-3h11M10 6V4.75h4V6m-6.5 0 .7 14h7.6l.7-14" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {desarrollo ? (
                                                <div
                                                    role="group"
                                                    aria-label={`Valoración de ${subnota.nombre}`}
                                                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                                                >
                                                    {VALORACIONES_DESARROLLO.map((opcion, posicionCarita) => {
                                                        const activa = valor === opcion.value;
                                                        return (
                                                            <button
                                                                key={opcion.value}
                                                                ref={posicionCarita === 0 ? registrarCampo(clave) : undefined}
                                                                type="button"
                                                                aria-pressed={activa}
                                                                aria-label={`${opcion.label} en ${subnota.nombre}`}
                                                                title={activa ? "Pulsa otra vez para dejarla vacía" : opcion.label}
                                                                translate="no"
                                                                onClick={() => onCambiarCalificacion(subnota.id, activa ? "" : opcion.value)}
                                                                className={`flex min-h-10 items-center justify-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold ${
                                                                    activa
                                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                                                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                                                                }`}
                                                            >
                                                                <span className="text-base" aria-hidden="true">{opcion.emoji}</span>
                                                                <span className="truncate">{opcion.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        id={idCampo}
                                                        ref={registrarCampo(clave)}
                                                        type="text"
                                                        inputMode="decimal"
                                                        autoComplete="off"
                                                        value={valor}
                                                        placeholder="1.0 a 5.0"
                                                        aria-invalid={invalida}
                                                        aria-describedby={invalida ? `${idCampo}-error` : undefined}
                                                        onChange={(e) => onCambiarCalificacion(subnota.id, e.target.value)}
                                                        onKeyDown={(e) => alPulsarEnterEnCampo(e, indice)}
                                                        translate="no"
                                                        className={`h-10 w-full rounded-lg border px-3 text-center text-base font-semibold text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500 ${
                                                            invalida ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
                                                        }`}
                                                    />
                                                    {invalida && (
                                                        <p id={`${idCampo}-error`} className="mt-1 text-xs font-semibold text-red-600">
                                                            Debe ser un número entre 1 y 5.
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        <form onSubmit={agregar} className="rounded-lg border border-dashed border-violet-300 p-3">
                            <label htmlFor={idNueva} className="mb-1 block text-sm font-medium text-gray-700">
                                Nueva subnota (para todo el curso)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id={idNueva}
                                    type="text"
                                    value={nuevoNombre}
                                    maxLength={LARGO_MAXIMO_NOMBRE_SUBNOTA}
                                    placeholder="Ej: Taller 1, Quiz..."
                                    disabled={limiteAlcanzado}
                                    onChange={(e) => setNuevoNombre(e.target.value)}
                                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                                />
                                <button
                                    type="submit"
                                    disabled={limiteAlcanzado || !nuevoNombre.trim()}
                                    className="rounded-lg border border-purple-300 bg-white px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Agregar
                                </button>
                            </div>
                            {limiteAlcanzado && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Ya tiene el máximo de {MAXIMO_SUBNOTAS_POR_TIPO} subnotas.
                                </p>
                            )}
                        </form>
                    </div>

                    <div className="shrink-0 border-t border-gray-200 px-5 py-3">
                        {accionEnCurso && accionEnCurso !== "guardar" && (
                            <p className="mb-2 inline-flex items-center gap-2 text-sm text-purple-700" role="status">
                                <Spinner />
                                {TEXTO_ACCION[accionEnCurso]}
                            </p>
                        )}
                        <p className="mb-3 text-sm text-gray-700" aria-live="polite">
                            Promedio:{" "}
                            <strong className="text-base text-gray-900" translate="no">
                                {desarrollo
                                    ? vistaPrevia?.valoracion
                                        ? `${vistaPrevia.valoracion.emoji} ${vistaPrevia.valoracion.label}`
                                        : "—"
                                    : vistaPrevia
                                        ? formatearNotaCalculada(vistaPrevia.nota)
                                        : "—"}
                            </strong>{" "}
                            <span className="text-gray-500">→ pasa a la celda</span>
                        </p>
                        <div className="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={onAnterior}
                                disabled={!hayAnterior}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                ← Anterior
                            </button>
                            <button
                                type="button"
                                onClick={onGuardar}
                                disabled={!hayCambios}
                                className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {accionEnCurso === "guardar" && <Spinner />}
                                {accionEnCurso === "guardar" ? TEXTO_ACCION.guardar : "Guardar"}
                            </button>
                            <button
                                type="button"
                                onClick={onSiguiente}
                                disabled={!haySiguiente}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>
                </fieldset>
            </div>
        </div>
    );
}

export default ModalSubnotasPlanilla;
