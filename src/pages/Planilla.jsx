import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import PlanillaRow from "../components/PlanillaRow";
import api from "../utils/api";

function Planilla() {

    const [asignacionId] = useState(
        localStorage.getItem("asignacionId") || ""
    ); 
    const [estudiantes, setEstudiantes] = useState([]);
    const [columnas, setColumnas] = useState([]);
    const [nuevoTipo, setNuevoTipo] = useState("");
    const [tipoEliminar, setTipoEliminar] = useState("");
    const [clases, setClases] = useState([]);
    const [periodo] = useState(
    localStorage.getItem("periodo") || "1"
    );
    const [fecha] = useState(
    localStorage.getItem("fechaAsistencia") || ""
    );
    const [tipoEvaluacion, setTipoEvaluacion] = useState(
        localStorage.getItem("planillaTipoEvaluacion") || "numerica"
    );

    const profesorStorage = localStorage.getItem("profesor");
    const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
    const profesorId = profesor?.id;



    const cargarClases = async () => {

    const res = await api.get(`/mis-clases/${profesorId}`);
    const data = res.data;//

    console.log("CLASES:", data);// revisar respuesta

    setClases(data);
    };

        // 🔥 Cargar planilla
    const cargarPlanilla = async () => {
    const res = await api.get(`/planilla-excel/${asignacionId}/${periodo}`);
    const data = res.data;

    setColumnas(data.columnas);
    setEstudiantes(data.data);
    };

    useEffect(() => {
        if (!profesor) {
        window.location.href = "/login";
        return;
        }

        if (profesorId) {
        cargarClases();
        }

    }, [profesorId]);

    // 🔥 Auto-cargar planilla cuando asignacionId o periodo cambie
    useEffect(() => {
        if (asignacionId && periodo) {
        cargarPlanilla();
        }
    }, [asignacionId, periodo]);


    
            // 🔥 Guardar nota por celda
    const guardarNota = async (estudiante_id, descripcion, valor) => {
    
        if (!valor) return;// si el input quedó vacío, no hacer nada
        if (tipoEvaluacion === "numerica") {
            const numero = parseFloat(valor);
            if (Number.isNaN(numero) || numero < 1 || numero > 5) {
                Swal.fire({ icon: 'warning', title: 'Nota inválida', text: 'La nota debe estar entre 1 y 5' });
                return;
            }
        }
        await api.post(`/planilla/nota`, {// revisar body
                estudiante_id,
                asignacion_id: parseInt(asignacionId),
                nota: tipoEvaluacion === "numerica" ? parseFloat(valor) : null,
                descripcion,
                periodo: parseInt(periodo),
                tipo_evaluacion: tipoEvaluacion,
                valoracion: tipoEvaluacion === "desarrollo" ? valor : null
        });

          // 🔄 recargar datos
        cargarPlanilla();
    };

    const selectedClase = clases.find(c => c.id == asignacionId);   
    return (
    <div className="p-6">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📋 Planilla de Notas
            </h1>
            <p className="text-gray-600">
                Gestiona las calificaciones de tus estudiantes
            </p>
        </div>

        {/* Información del curso */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Curso</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-700">Materia</p>
                    <p className="text-gray-900">{selectedClase ? selectedClase.materia : "No seleccionada"}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-700">Salón</p>
                    <p className="text-gray-900">{selectedClase ? selectedClase.curso : "No seleccionado"}</p>
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
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestión de Tipos de Evaluación</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Tipo</label>
                    <input
                        type="text"
                        placeholder="Ej: Quiz, Taller..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={nuevoTipo}
                        onChange={(e) => setNuevoTipo(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eliminar Tipo</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={tipoEliminar}
                        onChange={(e) => setTipoEliminar(e.target.value)}
                    >
                        <option value="">Seleccionar tipo</option>
                        {columnas.map((col, i) => (
                            <option key={i} value={col}>
                                {col}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex gap-4 mt-4">
                <button
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    onClick={async () => {
                        const tipoLimpio = nuevoTipo.trim();
                        if (!tipoLimpio) return;
                        
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
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
                        setTipoEliminar("");
                        cargarPlanilla();
                        Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El tipo de evaluación fue eliminado', timer: 1500, showConfirmButton: false });
                    }}
                >
                    Eliminar Tipo
                </button>
            </div>
        </div>

        {/* Tabla de Notas */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Notas de Estudiantes</h2>
            </div>
            <div className="w-full overflow-auto">
                <table className="min-w-max w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="sticky left-0 bg-gray-50 z-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            {columnas.map((col) => (
                                <th key={col} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                    <div className="whitespace-nowrap" title={col}>
                                        {col}
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
