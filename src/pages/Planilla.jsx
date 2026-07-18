import { useCallback, useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import PlanillaRow from "../components/PlanillaRow";
import { VALORACIONES_DESARROLLO } from "../constants/valoracionesDesarrollo";
import api from "../utils/api";
import { obtenerPeriodoProfesor } from "../utils/periodoProfesor";

const COLUMNAS_INTERNAS_OCULTAS = new Set(["mas_alto"]);

const formatearEtiquetaColumna = (valor) => {
    const texto = String(valor || "").trim();
    if (!texto) return "";

    const etiquetas = {
        mas_alto: "Más alto",
    };
    const clave = texto.toLowerCase();
    if (etiquetas[clave]) return etiquetas[clave];

    return texto
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (letra) => letra.toUpperCase());
};

const esColumnaInterna = (valor) =>
    COLUMNAS_INTERNAS_OCULTAS.has(String(valor || "").trim().toLowerCase());

const obtenerNotasVisibles = (notas, columnasVisibles) => {
    const columnas = Array.isArray(columnasVisibles) ? columnasVisibles : [];
    if (columnas.length === 0) return {};

    return columnas.reduce((acumulado, col) => {
        if (Object.prototype.hasOwnProperty.call(notas || {}, col)) {
            acumulado[col] = notas[col];
        }
        return acumulado;
    }, {});
};

const calcularPromedioNotas = (notas, columnasVisibles) => {
    const valores = (Array.isArray(columnasVisibles) ? columnasVisibles.map((col) => notas?.[col]) : Object.values(notas || {}))
        .filter((valor) => valor !== null && valor !== undefined && String(valor).trim() !== "")
        .map((valor) => Number(valor))
        .filter((valor) => Number.isFinite(valor));

    if (valores.length === 0) return "";

    const promedio = valores.reduce((total, valor) => total + valor, 0) / valores.length;
    return promedio.toFixed(2);
};

const normalizarNumeroNota = (valor) => Number(String(valor).replace(",", "."));

const normalizarEstudiantesPlanilla = (estudiantes, columnasVisibles) =>
    (estudiantes || []).map((est) => {
        const notasVisibles = obtenerNotasVisibles(est.notas || {}, columnasVisibles);
        return {
            ...est,
            notas: notasVisibles,
            promedio: calcularPromedioNotas(notasVisibles, columnasVisibles),
        };
    });

function PlanillaMobileCard({ est, numero, columnas, guardarNota, tipoEvaluacion, formatearEtiquetaColumna }) {
    const nombreCompleto = `${est.apellido || ""} ${est.nombre || ""}`.trim();
    const promedioNumerico = Number(est.promedio);
    const promedioClass = tipoEvaluacion === "desarrollo" || Number.isNaN(promedioNumerico)
        ? "text-gray-500"
        : promedioNumerico >= 3
            ? "text-emerald-600"
            : "text-red-600";
    const promedioMostrado = tipoEvaluacion === "desarrollo"
        ? "—"
        : Number.isNaN(promedioNumerico)
            ? est.promedio
            : promedioNumerico.toFixed(2);
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
        <article className="border-b border-gray-200 last:border-b-0">
            <div className="p-4">
                <div className="mb-4 flex items-start gap-3">
                    <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-purple-200 bg-purple-50 px-2 text-sm font-bold tabular-nums text-purple-700">
                        {numero}
                    </span>
                    <div className="min-w-0">
                        <p
                            className="text-base font-semibold leading-snug text-gray-900 capitalize"
                            title={nombreCompleto}
                            translate="no"
                        >
                            {nombreCompleto}
                        </p>
                        <p className={`mt-1 text-xs font-bold uppercase ${promedioClass}`}>
                            Promedio: {promedioMostrado}
                        </p>
                    </div>
                </div>

                {columnas.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-sm text-gray-500">
                        No hay tipos de evaluación registrados.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {columnas.map((col) => {
                            const etiqueta = formatearEtiquetaColumna(col);

                            return (
                                <div key={`${est.estudiante_id}-${col}-mobile`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <span className="text-sm font-semibold text-gray-800" title={etiqueta} translate="no">
                                            {etiqueta}
                                        </span>
                                        {tipoEvaluacion !== "desarrollo" && (
                                            <span className="text-xs font-medium text-gray-500">
                                                1.0 a 5.0
                                            </span>
                                        )}
                                    </div>

                                    {tipoEvaluacion === "desarrollo" ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {VALORACIONES_DESARROLLO.map((opcion) => {
                                                const activa = est.valoraciones?.[col] === opcion.value;

                                                return (
                                                    <button
                                                        key={opcion.value}
                                                        type="button"
                                                        title={opcion.label}
                                                        aria-label={`${opcion.label} en ${etiqueta}`}
                                                        translate="no"
                                                        onClick={() => guardarNota(est.estudiante_id, col, opcion.value)}
                                                        className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${
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
                                        <input
                                            key={`${est.estudiante_id}-${col}-mobile-input`}
                                            type="number"
                                            min="1"
                                            max="5"
                                            step="0.1"
                                            inputMode="decimal"
                                            defaultValue={
                                                est.notas?.[col] !== null && est.notas?.[col] !== undefined
                                                    ? est.notas[col]
                                                    : ""
                                            }
                                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-center text-base font-semibold text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                                            translate="no"
                                            onBlur={(event) => guardarNotaNumerica(event, col)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </article>
    );
}

function Planilla() {

    const avisoSeleccionRef = useRef(false);
    const [asignacionId] = useState(
        localStorage.getItem("asignacionId") || ""
    ); 
    const [estudiantes, setEstudiantes] = useState([]);
    const [columnas, setColumnas] = useState([]);
    const [nuevoTipo, setNuevoTipo] = useState("");
    const [tipoEliminar, setTipoEliminar] = useState("");
    const [accionTipoEnCurso, setAccionTipoEnCurso] = useState(null);
    const [clases, setClases] = useState([]);
    const [periodo] = useState(() => obtenerPeriodoProfesor());
    const [fecha] = useState(
    localStorage.getItem("fechaAsistencia") || ""
    );
    const [tipoEvaluacion, setTipoEvaluacion] = useState(
        localStorage.getItem("planillaTipoEvaluacion") || "numerica"
    );

    const profesorStorage = localStorage.getItem("profesor");
    const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
    const profesorId = profesor?.id;

    const pedirSeleccionClase = useCallback(() => {
        if (avisoSeleccionRef.current) return;

        avisoSeleccionRef.current = true;
        alert("Selecciona una asignación primero en la página principal");
        window.location.href = "/";
    }, []);



    const cargarClases = useCallback(async () => {
    if (!profesorId) return;

    const res = await api.get(`/mis-clases/${profesorId}`);
    const data = res.data;//

    console.log("CLASES:", data);// revisar respuesta

    setClases(data);
    }, [profesorId]);

        // 🔥 Cargar planilla
    const cargarPlanilla = useCallback(async () => {
    try {
        const res = await api.get(`/planilla-excel/${asignacionId}/${periodo}`);
        const data = res.data;
        const columnasVisibles = (data.columnas || []).filter((col) => !esColumnaInterna(col));

        setColumnas(columnasVisibles);
        setEstudiantes(normalizarEstudiantesPlanilla(data.data || [], columnasVisibles));
    } catch (error) {
        console.error("Error cargando planilla", error);
        if (error.response?.status === 403) {
            localStorage.removeItem("asignacionId");
            alert("La clase seleccionada ya no está disponible. Selecciónala nuevamente.");
            window.location.href = "/";
        }
    }
    }, [asignacionId, periodo]);

    useEffect(() => {
        if (!profesorId) {
        window.location.href = "/login";
        return;
        }

        if (!asignacionId || !periodo) {
        pedirSeleccionClase();
        return;
        }

        if (profesorId) {
        cargarClases();
        }

    }, [asignacionId, periodo, profesorId, cargarClases, pedirSeleccionClase]);

    // 🔥 Auto-cargar planilla cuando asignacionId o periodo cambie
    useEffect(() => {
        if (asignacionId && periodo) {
        cargarPlanilla();
        }
    }, [asignacionId, periodo, cargarPlanilla]);


    
            // 🔥 Guardar nota por celda
    const guardarNota = async (estudiante_id, descripcion, valor) => {
    
        const valorLimpio = String(valor ?? "").trim();
        if (!valorLimpio && tipoEvaluacion !== "numerica") return;

        const numero = normalizarNumeroNota(valorLimpio);
        const actualizarNotaLocal = (notaActualizada) => {
            setEstudiantes((actuales) =>
                actuales.map((est) => {
                    if (Number(est.estudiante_id) !== Number(estudiante_id)) return est;

                    if (tipoEvaluacion === "desarrollo") {
                        return {
                            ...est,
                            valoraciones: {
                                ...(est.valoraciones || {}),
                                [descripcion]: valor,
                            },
                        };
                    }

                    const notasActualizadas = {
                        ...(est.notas || {}),
                    };

                    if (notaActualizada === null) {
                        delete notasActualizadas[descripcion];
                    } else {
                        notasActualizadas[descripcion] = notaActualizada;
                    }

                    return {
                        ...est,
                        notas: notasActualizadas,
                        promedio: calcularPromedioNotas(notasActualizadas, columnas),
                    };
                })
            );
        };

        if (tipoEvaluacion === "numerica" && !valorLimpio) {
            actualizarNotaLocal(null);

            await api.post(`/planilla/nota`, {
                estudiante_id,
                asignacion_id: parseInt(asignacionId),
                nota: null,
                descripcion,
                periodo: parseInt(periodo),
                tipo_evaluacion: tipoEvaluacion,
                valoracion: null
            });

            await cargarPlanilla();
            return true;
        }

        if (tipoEvaluacion === "numerica") {
            if (Number.isNaN(numero) || numero < 1 || numero > 5) {
                await Swal.fire({ icon: 'warning', title: 'Nota inválida', text: 'La nota debe estar entre 1 y 5' });
                return false;
            }
        }

        actualizarNotaLocal(tipoEvaluacion === "numerica" ? numero : valorLimpio);

        await api.post(`/planilla/nota`, {// revisar body
                estudiante_id,
                asignacion_id: parseInt(asignacionId),
                nota: tipoEvaluacion === "numerica" ? numero : null,
                descripcion,
                periodo: parseInt(periodo),
                tipo_evaluacion: tipoEvaluacion,
                valoracion: tipoEvaluacion === "desarrollo" ? valor : null
        });

          // 🔄 recargar datos
        await cargarPlanilla();
        return true;
    };

    const agregarTipoEvaluacion = async () => {
        if (accionTipoEnCurso) return;

        const tipoLimpio = nuevoTipo.trim();
        if (!tipoLimpio) return;
        if (esColumnaInterna(tipoLimpio)) {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'Ese nombre está reservado por el sistema.' });
            return;
        }

        const existe = columnas.some(col => col.trim().toLowerCase() === tipoLimpio.toLowerCase());
        if (existe) {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'El tipo de evaluación ya existe' });
            return;
        }

        setAccionTipoEnCurso("agregar");
        try {
            await api.post(`/planilla/nota`, {
                estudiante_id: estudiantes[0]?.estudiante_id,
                asignacion_id: parseInt(asignacionId),
                nota: null,
                descripcion: tipoLimpio,
                periodo: parseInt(periodo),
                tipo_evaluacion: tipoEvaluacion,
                valoracion: null
            });
            setNuevoTipo("");
            await cargarPlanilla();
            await Swal.fire({
                icon: 'success',
                title: 'Guardado',
                text: `El tipo de evaluación "${formatearEtiquetaColumna(tipoLimpio)}" fue agregado correctamente.`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error agregando tipo de evaluación", error);
            Swal.fire({
                icon: 'error',
                title: 'No se pudo agregar',
                text: 'Intenta nuevamente en un momento.'
            });
        } finally {
            setAccionTipoEnCurso(null);
        }
    };

    const eliminarTipoEvaluacion = async () => {
        if (accionTipoEnCurso) return;
        if (!tipoEliminar) {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'Selecciona un tipo a eliminar' });
            return;
        }

        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción eliminará el tipo de evaluación para todos los estudiantes",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        const tipoAEliminar = tipoEliminar;
        setAccionTipoEnCurso("eliminar");
        try {
            await api.delete(`/planilla/tipo?asignacion_id=${asignacionId}&descripcion=${encodeURIComponent(tipoAEliminar)}&periodo=${periodo}`);
            const columnasActualizadas = columnas.filter((col) => col !== tipoAEliminar);
            setColumnas(columnasActualizadas);
            setEstudiantes((actuales) =>
                actuales.map((est) => {
                    const notasActualizadas = { ...(est.notas || {}) };
                    delete notasActualizadas[tipoAEliminar];

                    return {
                        ...est,
                        notas: notasActualizadas,
                        promedio: calcularPromedioNotas(notasActualizadas, columnasActualizadas),
                    };
                })
            );
            setTipoEliminar("");
            await cargarPlanilla();
            await Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El tipo de evaluación fue eliminado',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error eliminando tipo de evaluación", error);
            Swal.fire({
                icon: 'error',
                title: 'No se pudo eliminar',
                text: 'Intenta nuevamente en un momento.'
            });
        } finally {
            setAccionTipoEnCurso(null);
        }
    };

    const selectedClase = clases.find(c => c.id == asignacionId);   
    return (
    <div className="p-3 sm:p-6">
        <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                📋 Planilla de Notas
            </h1>
            <p className="text-gray-600">
                Gestiona las calificaciones de tus estudiantes
            </p>
        </div>

        {/* Información del curso */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Información Del Curso</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-700">Materia</p>
                    <p className="text-gray-900" translate="no">{selectedClase ? selectedClase.materia : "No seleccionada"}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-700">Salón</p>
                    <p className="text-gray-900" translate="no">{selectedClase ? selectedClase.curso : "No seleccionado"}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-700">Período</p>
                    <p className="text-gray-900">{periodo}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-700">Fecha</p>
                    <p className="text-gray-900">{fecha || "No especificada"}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de calificación</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:w-auto"
                        value={tipoEvaluacion}
                        onChange={(e) => {
                            setTipoEvaluacion(e.target.value);
                            localStorage.setItem("planillaTipoEvaluacion", e.target.value);
                        }}
                    >
                        <option value="numerica">Numérica (1 a 5)</option>
                        <option value="desarrollo">Caritas / Desarrollo infantil</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Gestión de Columnas */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Gestión de Tipos de Evaluación</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Tipo</label>
                    <input
                        type="text"
                        placeholder="Ej: Quiz, Taller..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={nuevoTipo}
                        onChange={(e) => setNuevoTipo(e.target.value)}
                        disabled={Boolean(accionTipoEnCurso)}
                    />
                    <button
                        type="button"
                        disabled={Boolean(accionTipoEnCurso)}
                        aria-busy={accionTipoEnCurso === "agregar"}
                        className="mt-3 flex w-full items-center justify-center gap-2 self-stretch rounded-lg border border-purple-300 bg-white px-3 py-2 text-sm font-semibold text-purple-700 shadow-sm transition-colors hover:border-purple-400 hover:bg-purple-50 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:self-start"
                        onClick={agregarTipoEvaluacion}
                    >
                        {accionTipoEnCurso === "agregar" && (
                            <span
                                className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700"
                                aria-hidden="true"
                            />
                        )}
                        {accionTipoEnCurso !== "agregar" && (
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                            </svg>
                        )}
                        {accionTipoEnCurso === "agregar" ? "Agregando..." : "Agregar Tipo"}
                    </button>
                </div>
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eliminar Tipo</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={tipoEliminar}
                        onChange={(e) => setTipoEliminar(e.target.value)}
                        disabled={Boolean(accionTipoEnCurso)}
                    >
                        <option value="">Seleccionar tipo</option>
                        {columnas.map((col, i) => (
                            <option key={i} value={col} translate="no">
                                {formatearEtiquetaColumna(col)}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        disabled={Boolean(accionTipoEnCurso)}
                        aria-busy={accionTipoEnCurso === "eliminar"}
                        className="mt-3 flex w-full items-center justify-center gap-2 self-stretch rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:border-red-400 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:self-start"
                        onClick={eliminarTipoEvaluacion}
                    >
                        {accionTipoEnCurso === "eliminar" && (
                            <span
                                className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-700"
                                aria-hidden="true"
                            />
                        )}
                        {accionTipoEnCurso !== "eliminar" && (
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 .4 8m5.2 0L15 9m-8.5-3h11M10 6V4.75h4V6m-6.5 0 .7 14h7.6l.7-14" />
                            </svg>
                        )}
                        {accionTipoEnCurso === "eliminar" ? "Eliminando..." : "Eliminar Tipo"}
                    </button>
                </div>
            </div>
        </div>

        {/* Tabla de Notas */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
            <div className="border-b border-gray-200 bg-white p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Notas de Estudiantes</h2>
            </div>

            <div className="md:hidden">
                {estudiantes.length > 0 ? (
                    estudiantes.map((est, index) => (
                        <PlanillaMobileCard
                            key={`${est.estudiante_id}-mobile`}
                            est={est}
                            numero={index + 1}
                            columnas={columnas}
                            guardarNota={guardarNota}
                            tipoEvaluacion={tipoEvaluacion}
                            formatearEtiquetaColumna={formatearEtiquetaColumna}
                        />
                    ))
                ) : (
                    <div className="p-4 text-sm text-gray-500">
                        No hay estudiantes para mostrar.
                    </div>
                )}
            </div>

            <div className="hidden w-full overflow-auto md:block">
                <table className="w-full min-w-max border-separate border-spacing-0">
                    <thead className="shadow-sm">
                        <tr>
                            <th
                                className="sticky left-0 top-0 z-40 w-16 min-w-16 max-w-16 rounded-tl-lg border-b border-r border-b-purple-300 border-r-purple-400 bg-purple-200 px-3 py-4 text-center text-purple-800"
                                title="Número de estudiante"
                            >
                                <svg
                                    className="mx-auto h-6 w-6 drop-shadow-sm"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M10 3.5 8 20.5M16 3.5l-2 17M4.5 9h15M3.5 15h15" />
                                </svg>
                                <span className="sr-only">Número</span>
                            </th>
                            <th className="sticky left-16 top-0 z-30 border-b border-b-gray-200 bg-white px-6 py-4 text-left text-purple-950">
                                <span className="inline-flex min-h-8 items-center gap-3 align-middle">
                                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-400 bg-white/55 text-purple-700 shadow-sm ring-1 ring-purple-300/50">
                                        <svg
                                            className="h-[18px] w-[18px]"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            aria-hidden="true"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0A17.9 17.9 0 0 1 12 21.75 17.9 17.9 0 0 1 4.5 20.1Z" />
                                        </svg>
                                    </span>
                                    <span className="text-base font-bold leading-none text-purple-700">
                                        Estudiante
                                    </span>
                                </span>
                            </th>
                            {columnas.map((col) => (
                                <th
                                    key={col}
                                    className="sticky top-0 z-20 min-w-[120px] border-b border-l border-b-gray-200 border-l-violet-300 bg-white px-4 py-4 text-center align-middle before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-4 before:bg-gradient-to-r before:from-violet-200/70 before:to-transparent before:content-['']"
                                >
                                    <div
                                        className="inline-flex min-h-8 items-center justify-center gap-3 whitespace-nowrap text-purple-950 align-middle"
                                        title={formatearEtiquetaColumna(col)}
                                    >
                                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/55 text-violet-700 shadow-sm ring-1 ring-violet-300/70">
                                            <svg
                                                className="h-[18px] w-[18px]"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                aria-hidden="true"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5.25H6.75A2.25 2.25 0 0 0 4.5 7.5v11.25A2.25 2.25 0 0 0 6.75 21h10.5a2.25 2.25 0 0 0 2.25-2.25V7.5a2.25 2.25 0 0 0-2.25-2.25H15M9 5.25A3 3 0 0 1 12 2.25a3 3 0 0 1 3 3M9 5.25A3 3 0 0 0 12 8.25a3 3 0 0 0 3-3m-6 7.5 2 2 4-4" />
                                            </svg>
                                        </span>
                                        <span
                                            className="text-base font-bold leading-none text-purple-950"
                                            translate="no"
                                        >
                                            {formatearEtiquetaColumna(col)}
                                        </span>
                                    </div>
                                </th>
                            ))}
                            <th className="sticky right-0 top-0 z-30 w-36 rounded-tr-lg border-b border-l border-b-gray-200 border-l-emerald-300 bg-white px-5 py-4 text-emerald-950 before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-4 before:bg-gradient-to-r before:from-emerald-200/70 before:to-transparent before:content-['']">
                                <span className="inline-flex min-h-8 items-center justify-center gap-3">
                                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/55 text-emerald-700 shadow-sm ring-1 ring-emerald-300/70">
                                        <svg
                                            className="h-[18px] w-[18px]"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            aria-hidden="true"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5V12m5 7.5V8m5 11.5V4.5m5 15v-10" />
                                        </svg>
                                    </span>
                                    <span className="text-base font-bold leading-none text-emerald-950">
                                        Promedio
                                    </span>
                                </span>
                            </th>
                        </tr> 
                    </thead>
                    <tbody className="bg-white">
                        {estudiantes.map((est, index) => (
                            <PlanillaRow
                                key={est.estudiante_id}
                                est={est}
                                numero={index + 1}
                                columnas={columnas}
                                guardarNota={guardarNota}
                                tipoEvaluacion={tipoEvaluacion}
                                formatearEtiquetaColumna={formatearEtiquetaColumna}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);
}

export default Planilla;
