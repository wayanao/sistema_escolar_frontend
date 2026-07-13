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

function PlanillaMobileCard({ est, columnas, guardarNota, tipoEvaluacion, formatearEtiquetaColumna }) {
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

    return (
        <article className="border-b border-gray-200 last:border-b-0">
            <div className="p-4">
                <div className="mb-4">
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
                                            onBlur={(e) =>
                                                guardarNota(est.estudiante_id, col, e.target.value)
                                            }
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
    const res = await api.get(`/planilla-excel/${asignacionId}/${periodo}`);
    const data = res.data;
    const columnasVisibles = (data.columnas || []).filter((col) => !esColumnaInterna(col));

    setColumnas(columnasVisibles);
    setEstudiantes(normalizarEstudiantesPlanilla(data.data || [], columnasVisibles));
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
            return;
        }

        if (tipoEvaluacion === "numerica") {
            if (Number.isNaN(numero) || numero < 1 || numero > 5) {
                Swal.fire({ icon: 'warning', title: 'Nota inválida', text: 'La nota debe estar entre 1 y 5' });
                return;
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
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Información del Curso</h2>
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
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Tipo</label>
                    <input
                        type="text"
                        placeholder="Ej: Quiz, Taller..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={nuevoTipo}
                        onChange={(e) => setNuevoTipo(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eliminar Tipo</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={tipoEliminar}
                        onChange={(e) => setTipoEliminar(e.target.value)}
                    >
                        <option value="">Seleccionar tipo</option>
                        {columnas.map((col, i) => (
                            <option key={i} value={col} translate="no">
                                {formatearEtiquetaColumna(col)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:gap-4">
                <button
                    type="button"
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors sm:w-auto"
                    onClick={async () => {
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
                        cargarPlanilla();
                    }}
                >
                    Agregar Tipo
                </button>
                <button
                    type="button"
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors sm:w-auto"
                    onClick={async () => {
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

                        await api.delete(`/planilla/tipo?asignacion_id=${asignacionId}&descripcion=${encodeURIComponent(tipoEliminar)}&periodo=${periodo}`);
                        const columnasActualizadas = columnas.filter((col) => col !== tipoEliminar);
                        setColumnas(columnasActualizadas);
                        setEstudiantes((actuales) =>
                            actuales.map((est) => {
                                const notasActualizadas = { ...(est.notas || {}) };
                                delete notasActualizadas[tipoEliminar];

                                return {
                                    ...est,
                                    notas: notasActualizadas,
                                    promedio: calcularPromedioNotas(notasActualizadas, columnasActualizadas),
                                };
                            })
                        );
                        setTipoEliminar("");
                        await cargarPlanilla();
                        Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El tipo de evaluación fue eliminado', timer: 1500, showConfirmButton: false });
                    }}
                >
                    Eliminar Tipo
                </button>
            </div>
        </div>

        {/* Tabla de Notas */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Notas de Estudiantes</h2>
            </div>

            <div className="md:hidden">
                {estudiantes.length > 0 ? (
                    estudiantes.map((est) => (
                        <PlanillaMobileCard
                            key={`${est.estudiante_id}-mobile`}
                            est={est}
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
                <table className="min-w-max w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="sticky left-0 bg-gray-50 z-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            {columnas.map((col) => (
                                <th key={col} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                    <div className="whitespace-nowrap" title={formatearEtiquetaColumna(col)} translate="no">
                                        {formatearEtiquetaColumna(col)}
                                    </div>
                                </th>
                            ))}
                            <th className="md:sticky md:right-0 bg-gray-50 md:z-20 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                Promedio
                            </th>
                        </tr> 
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {estudiantes.map((est) => (
                            <PlanillaRow
                                key={est.estudiante_id}
                                est={est}
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
