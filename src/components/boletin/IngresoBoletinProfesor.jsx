import { useCallback, useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import api from "../../utils/api";
import { guardarPeriodoProfesor, obtenerPeriodoProfesor } from "../../utils/periodoProfesor";

const VALORACIONES_DESARROLLO = [
    { value: "destacado", label: "Destacado", emoji: "⭐" },
    { value: "logrado", label: "Logrado", emoji: "😀" },
    { value: "proceso", label: "En proceso", emoji: "🙂" },
    { value: "apoyo", label: "Requiere acompañamiento", emoji: "🧩" },
];

const COLUMNAS_INTERNAS_OCULTAS = new Set(["mas_alto"]);

const obtenerTipoNota = (nota) => nota?.tipo_nota || nota?.descripcion || nota?.referencia || "";

const esNotaInterna = (nota) =>
    COLUMNAS_INTERNAS_OCULTAS.has(String(obtenerTipoNota(nota)).trim().toLowerCase());

const formatearEtiquetaNota = (valor) =>
    String(valor || "")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (letra) => letra.toUpperCase());

function IngresoBoletinProfesor() {
    const [asignacionId, setAsignacionId] = useState(
        localStorage.getItem("asignacionId") || ""
    );
    const [clases, setClases] = useState([]);
    const [periodo, setPeriodo] = useState(() => obtenerPeriodoProfesor());
    const [estudiantes, setEstudiantes] = useState([]);
    const [cargando, setCargando] = useState(false);

    // Estado local para almacenar lo que el profesor digita
    const [datosBoletin, setDatosBoletin] = useState({});
    const [estadoGuardado, setEstadoGuardado] = useState({});

    const clasesUnicas = useMemo(() => {
        const clasesPorCursoMateria = new Map();

        clases.forEach((clase) => {
            const clave = `${clase.curso}__${clase.materia}`;
            const esAsignacionActual = String(clase.id) === String(asignacionId);

            if (!clasesPorCursoMateria.has(clave) || esAsignacionActual) {
                clasesPorCursoMateria.set(clave, clase);
            }
        });

        return Array.from(clasesPorCursoMateria.values());
    }, [clases, asignacionId]);

    useEffect(() => {
        const cargarClases = async () => {
            try {
                const profe = JSON.parse(localStorage.getItem("profesor"));
                if (!profe) return;
                
                const res = await api.get(`/mis-clases/${profe.id}`);
                setClases(res.data);
            } catch (error) {
                console.error("Error al cargar clases", error);
            }
        };
        cargarClases();
    }, []);

    const cargarAlumnos = useCallback(async () => {
        if (!asignacionId || !periodo) return;
        localStorage.setItem("asignacionId", asignacionId);
        setCargando(true);
        try {
            // Este endpoint trae los alumnos y sus notas de la planilla como referencia
            const res = await api.get(`/boletines/referencia/${asignacionId}/${periodo}`);
            const dataObtenida = Array.isArray(res.data) ? res.data : [];
            const dataVisible = dataObtenida.map((est) => ({
                ...est,
                notas: (est.notas || []).filter((nota) => !esNotaInterna(nota)),
            }));
            setEstudiantes(dataVisible);

            // Inicializar el estado de formulario para cada estudiante basado en sus notas
            const estadoInicial = {};
            dataVisible.forEach((est) => {
                const notasNumericas = (est.notas || []).filter(
                    n => n.tipo_evaluacion !== "desarrollo" && n.valor !== null && n.valor !== undefined
                );
                const definitivaCalc = notasNumericas.length > 0
                    ? (notasNumericas.reduce((sum, n) => sum + n.valor, 0) / notasNumericas.length).toFixed(2)
                    : 0;

                estadoInicial[est.estudiante_id] = {
                    definitiva: definitivaCalc,
                    observaciones: (est.notas || []).map(n => ({
                        nota: n.valor,
                        observacion: n.observacion_guardada || "",
                        referencia: obtenerTipoNota(n),
                        tipo_evaluacion: n.tipo_evaluacion || "numerica",
                        valoracion: n.valoracion || ""
                    }))
                };
            });
            setDatosBoletin(estadoInicial);

            const estadoInicialGuardado = {};
            dataVisible.forEach((est) => {
                const tieneObservacionesGuardadas = (est.notas || []).some((n) =>
                    String(n.observacion_guardada || "").trim().length > 0
                );

                estadoInicialGuardado[est.estudiante_id] = {
                    guardado: tieneObservacionesGuardadas,
                    modificado: false,
                    guardadoEn: null,
                };
            });
            setEstadoGuardado(estadoInicialGuardado);
        } catch (error) {
            console.error("Error al cargar alumnos", error);
        } finally {
            setCargando(false);
        }
    }, [asignacionId, periodo]);

    useEffect(() => {
        if (asignacionId) cargarAlumnos();
    }, [asignacionId, cargarAlumnos]);

    const handlePeriodoChange = (e) => {
        const value = e.target.value;
        setPeriodo(value);
        guardarPeriodoProfesor(value);
    };

    const handleObservacionChange = (estId, index, texto) => {
        setDatosBoletin(prev => {
            const nuevo = { ...prev };
            const estData = { ...nuevo[estId] };
            const nuevasObs = [...estData.observaciones];
            nuevasObs[index] = { ...nuevasObs[index], observacion: texto };
            estData.observaciones = nuevasObs;
            nuevo[estId] = estData;
            return nuevo;
        });

        setEstadoGuardado(prev => ({
            ...prev,
            [estId]: {
                ...(prev[estId] || {}),
                modificado: true,
            }
        }));
    };

    const obtenerEstadoVisual = (estudianteId) => {
        const estado = estadoGuardado[estudianteId] || {};

        if (estado.modificado) {
            return {
                label: "Cambios sin guardar",
                detail: "Hay ediciones pendientes",
                badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
                dotClass: "bg-amber-500",
                buttonText: "Guardar cambios",
            };
        }

        if (estado.guardado) {
            return {
                label: "Guardado",
                detail: estado.guardadoEn ? `Actualizado ${estado.guardadoEn}` : "Informe registrado",
                badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
                dotClass: "bg-emerald-500",
                buttonText: "Actualizar resumen",
            };
        }

        return {
            label: "Pendiente",
            detail: "Aún no se ha guardado",
            badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
            dotClass: "bg-slate-400",
            buttonText: "Guardar resumen",
        };
    };

    const guardarBoletinEstudiante = async (estudiante_id) => {
        const data = datosBoletin[estudiante_id];
        if (!data) return;
        const esDesarrollo = data.observaciones.some(obs => obs.tipo_evaluacion === "desarrollo");

        const payload = {
            estudiante_id: estudiante_id,
            asignacion_id: parseInt(asignacionId),
            periodo: parseInt(periodo),
            definitiva: esDesarrollo ? null : parseFloat(data.definitiva),
            detalles: data.observaciones.map(obs => ({
                nota: obs.tipo_evaluacion === "desarrollo" ? null : parseFloat(obs.nota),
                observacion: obs.observacion,
                tipo_evaluacion: obs.tipo_evaluacion || "numerica",
                valoracion: obs.tipo_evaluacion === "desarrollo" ? obs.valoracion : null
            }))
        };

        try {
            await api.post("/boletines/guardar", payload);
            setEstadoGuardado(prev => ({
                ...prev,
                [estudiante_id]: {
                    guardado: true,
                    modificado: false,
                    guardadoEn: new Date().toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                }
            }));
            Swal.fire({ icon: 'success', title: 'Boletín guardado', text: 'Datos enviados al Admin correctamente.', timer: 2000, showConfirmButton: false });
        } catch (error) {
            Swal.fire("Error", "No se pudo guardar la información del boletín", "error");
            console.error(error);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 Ingreso a Boletín Final</h1>
                <p className="text-gray-600">Completa las observaciones de tus alumnos guiándote de sus notas de la planilla.</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clase (Curso / Materia)</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        value={asignacionId}
                        onChange={(e) => setAsignacionId(e.target.value)}
                    >
                        <option value="">Seleccione una clase...</option>
                        {clasesUnicas.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.curso} - {c.materia}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
                    <select
                        className="p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        value={periodo}
                        onChange={handlePeriodoChange}
                    >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                </div>
            </div>

            {cargando ? (
                <p className="text-gray-500 text-center py-10">Cargando información del curso...</p>
            ) : estudiantes.length > 0 ? (
                <div className="space-y-6">
                    {estudiantes.map((est) => {
                        const form = datosBoletin[est.estudiante_id];
                        if (!form) return null;
                        const estadoVisual = obtenerEstadoVisual(est.estudiante_id);
                        const notasVisibles = est.notas || [];

                        return (
                            <div key={est.estudiante_id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                                <div className="border-b border-gray-200 bg-slate-50/70 px-4 py-4 sm:px-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-xl font-bold text-gray-900">{est.nombre}</h3>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${estadoVisual.badgeClass}`}>
                                                    <span className={`h-2 w-2 rounded-full ${estadoVisual.dotClass}`} aria-hidden="true"></span>
                                                    {estadoVisual.label}
                                                </span>
                                                <span className="text-xs font-medium text-gray-500">{estadoVisual.detail}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
                                            {form.observaciones.some(obs => obs.tipo_evaluacion === "desarrollo") ? (
                                                <span className="inline-flex justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                                                    Desarrollo infantil
                                                </span>
                                            ) : (
                                                <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 sm:justify-start">
                                                    <span className="text-sm font-semibold text-gray-600">Definitiva</span>
                                                    <span className="min-w-14 rounded bg-gray-100 px-2 py-1 text-center text-lg font-bold text-gray-900">
                                                        {Number(form.definitiva || 0).toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                        <button 
                                            onClick={() => guardarBoletinEstudiante(est.estudiante_id)}
                                            className="w-full rounded-md bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 sm:w-auto"
                                        >
                                            {estadoVisual.buttonText}
                                        </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-5">
                                {notasVisibles.length === 0 ? (
                                    <p className="text-gray-500 italic text-sm p-4 bg-gray-50 rounded">Este alumno no tiene notas registradas en esta planilla para usar como referencia.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {notasVisibles.map((nota, idx) => {
                                            const etiquetaNota = formatearEtiquetaNota(obtenerTipoNota(nota));

                                            return (
                                            <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate max-w-[120px]" title={etiquetaNota} translate="no">{etiquetaNota}</span>
                                                    {nota.tipo_evaluacion === "numerica" ? (
                                                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">Nota: {nota.valor}</span>
                                                    ) : (
                                                        <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full">
                                                            {VALORACIONES_DESARROLLO.find(op => op.value === nota.valoracion)?.emoji || "—"}
                                                        </span>
                                                    )}
                                                </div>
                                                {nota.tipo_evaluacion === "desarrollo" && (
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase">Valoración registrada</span>
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                                                            <span>{VALORACIONES_DESARROLLO.find(op => op.value === nota.valoracion)?.emoji || "—"}</span>
                                                        </span>
                                                    </div>
                                                )}
                                                <textarea 
                                                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                                    rows="3"
                                                    placeholder={nota.tipo_evaluacion === "desarrollo" ? "Describe el proceso del niño en este logro..." : "Escribe la observación sobre esta nota específica para el boletín final..."}
                                                    value={form.observaciones[idx].observacion}
                                                    onChange={(e) => handleObservacionChange(est.estudiante_id, idx, e.target.value)}
                                                ></textarea>
                                            </div>
                                            );
                                        })}
                                    </div>
                                )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                asignacionId && <p className="text-gray-500 text-center py-10 bg-white rounded-lg shadow border border-gray-200">No hay estudiantes en este curso o no han cargado información.</p>
            )}
        </div>
    );
}

export default IngresoBoletinProfesor;
