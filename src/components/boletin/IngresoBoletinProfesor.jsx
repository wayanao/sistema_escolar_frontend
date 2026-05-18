import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import api from "../../utils/api";

const VALORACIONES_DESARROLLO = [
    { value: "destacado", label: "Destacado", emoji: "⭐" },
    { value: "logrado", label: "Logrado", emoji: "😀" },
    { value: "proceso", label: "En proceso", emoji: "🙂" },
    { value: "apoyo", label: "Requiere acompañamiento", emoji: "🧩" },
];

function IngresoBoletinProfesor() {
    const [asignacionId, setAsignacionId] = useState(
        localStorage.getItem("asignacionId") || ""
    );
    const [clases, setClases] = useState([]);
    const [periodo, setPeriodo] = useState(1);
    const [estudiantes, setEstudiantes] = useState([]);
    const [cargando, setCargando] = useState(false);

    // Estado local para almacenar lo que el profesor digita
    const [datosBoletin, setDatosBoletin] = useState({});

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

    const cargarAlumnos = async () => {
        if (!asignacionId || !periodo) return;
        localStorage.setItem("asignacionId", asignacionId);
        setCargando(true);
        try {
            // Este endpoint trae los alumnos y sus notas de la planilla como referencia
            const res = await api.get(`/boletines/referencia/${asignacionId}/${periodo}`);
            const dataObtenida = res.data;
            setEstudiantes(dataObtenida);

            // Inicializar el estado de formulario para cada estudiante basado en sus notas
            const estadoInicial = {};
            dataObtenida.forEach((est) => {
                const notasNumericas = est.notas.filter(
                    n => n.tipo_evaluacion !== "desarrollo" && n.valor !== null && n.valor !== undefined
                );
                const definitivaCalc = notasNumericas.length > 0
                    ? (notasNumericas.reduce((sum, n) => sum + n.valor, 0) / notasNumericas.length).toFixed(2)
                    : 0;

                estadoInicial[est.estudiante_id] = {
                    definitiva: definitivaCalc,
                    observaciones: est.notas.map(n => ({
                        nota: n.valor,
                        observacion: n.observacion_guardada || "",
                        referencia: n.tipo_nota,
                        tipo_evaluacion: n.tipo_evaluacion || "numerica",
                        valoracion: n.valoracion || ""
                    }))
                };
            });
            setDatosBoletin(estadoInicial);
        } catch (error) {
            console.error("Error al cargar alumnos", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (asignacionId) cargarAlumnos();
    }, [asignacionId, periodo]);

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
                        onChange={(e) => setPeriodo(e.target.value)}
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

                        return (
                            <div key={est.estudiante_id} className="bg-white p-5 rounded-lg shadow border border-gray-200">
                                <div className="flex flex-col md:flex-row justify-between items-center border-b pb-3 mb-4 gap-4">
                                    <h3 className="text-xl font-bold text-gray-800">🧑‍🎓 {est.nombre}</h3>
                                    <div className="flex items-center gap-3">
                                        {form.observaciones.some(obs => obs.tipo_evaluacion === "desarrollo") ? (
                                            <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded border border-emerald-200">
                                                Desarrollo infantil
                                            </span>
                                        ) : (
                                            <>
                                                <span className="text-sm font-semibold text-gray-600">Definitiva calculada:</span>
                                                <span className="w-20 font-bold p-1 text-lg text-center border border-gray-200 rounded bg-gray-50">
                                                    {Number(form.definitiva || 0).toFixed(1)}
                                                </span>
                                            </>
                                        )}
                                        <button 
                                            onClick={() => guardarBoletinEstudiante(est.estudiante_id)}
                                            className="ml-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                                        >
                                            💾 Guardar Resumen
                                        </button>
                                    </div>
                                </div>

                                {est.notas.length === 0 ? (
                                    <p className="text-gray-500 italic text-sm p-4 bg-gray-50 rounded">Este alumno no tiene notas registradas en esta planilla para usar como referencia.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {est.notas.map((nota, idx) => (
                                            <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate max-w-[120px]" title={nota.tipo_nota}>{nota.tipo_nota}</span>
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
                                        ))}
                                    </div>
                                )}
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
