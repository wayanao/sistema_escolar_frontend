import { useState, useEffect } from "react";
import api from "../utils/api";
import AsignarClaseGrid from "./AsignarClaseGrid";

function AsignarClase() {
    const [vista, setVista] = useState("grilla"); // 'grilla' | 'formulario'
    const [profesores, setProfesores] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [listaAsignaciones, setListaAsignaciones] = useState([]);
    
    // Form fields
    const [profesorId, setProfesorId] = useState("");
    const [cursoId, setCursoId] = useState("");
    const [materiaId, setMateriaId] = useState("");
    const [dia, setDia] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFin, setHoraFin] = useState("");

    // Edit state
    const [editandoId, setEditandoId] = useState(null);

    const formatearHora12 = (hora24) => {
        if (!hora24) return "";
        if (hora24.toLowerCase().includes("am") || hora24.toLowerCase().includes("pm")) return hora24;
        const [horaStr, minutoStr] = hora24.split(":");
        let horaNum = parseInt(horaStr, 10);
        const ampm = horaNum >= 12 ? 'PM' : 'AM';
        horaNum = horaNum % 12 || 12;
        return `${horaNum}:${minutoStr} ${ampm}`;
    };

    const cargarDatos = async () => {
        try {
            const p = await api.get(`/profesores`);
            const c = await api.get(`/cursos`);
            const m = await api.get(`/materias`);
            const l = await api.get(`/asignaciones/lista`);

            setProfesores(p.data);
            setCursos(c.data);
            setMaterias(m.data);
            // Ordenamos la lista para que las asignaciones más recientes o el ID salgan primero si se desea
            setListaAsignaciones(l.data);
        } catch (error) {
            console.error("Error cargando datos de asignación", error);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const limpiarFormulario = () => {
        setProfesorId("");
        setCursoId("");
        setMateriaId("");
        setDia("");
        setHoraInicio("");
        setHoraFin("");
        setEditandoId(null);
    };

    const inciarEdicion = (asig) => {
        setEditandoId(asig.id);
        setProfesorId(asig.profesor_id || "");
        setCursoId(asig.curso_id || "");
        setMateriaId(asig.materia_id || "");
        setDia(asig.dia || "");
        setHoraInicio(asig.hora_inicio || "");
        setHoraFin(asig.hora_fin || "");
        
        // Scroll top to see the form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const asignar = async () => {
        if (!profesorId || !cursoId || !materiaId || !dia || !horaInicio || !horaFin) {
            alert("Completa todo el formulario");
            return;
        }

        const payload = {
            profesor_id: parseInt(profesorId),
            curso_id: parseInt(cursoId),
            materia_id: parseInt(materiaId),
            dia: dia,
            hora_inicio: horaInicio,
            hora_fin: horaFin
        };

        try {
            if (editandoId) {
                await api.put(`/asignaciones/${editandoId}`, payload);
                alert("Asignación actualizada correctamente 🔥");
            } else {
                await api.post(`/asignaciones`, payload);
                alert("Asignación creada correctamente 🔥");
            }
            limpiarFormulario();
            cargarDatos();
        } catch (error) {
            if (error.response && error.response.data && error.response.data.detail) {
                alert(error.response.data.detail);
            } else {
                console.error(error);
                alert("Ocurrió un error al procesar la asignación.");
            }
        }
    };

    return (
        <div className="space-y-4">
            {/* Selector de vista */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 w-max">
                <button
                    onClick={() => setVista("grilla")}
                    className={`px-3 py-1.5 text-sm font-medium rounded ${vista === "grilla" ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                    🧩 Vista grilla
                </button>
                <button
                    onClick={() => setVista("formulario")}
                    className={`px-3 py-1.5 text-sm font-medium rounded ${vista === "formulario" ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                    📝 Vista formulario
                </button>
            </div>

            {vista === "grilla" && <AsignarClaseGrid onChange={cargarDatos} />}

            {vista === "formulario" && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">🔗 {editandoId ? "Editar Asignación" : "Asignar Clase"}</h2>
                {editandoId && (
                    <button 
                        onClick={limpiarFormulario}
                        className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                    >
                        ❌ Cancelar Edición
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">        
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profesor</label>
                    <select
                        value={profesorId}
                        onChange={(e) => setProfesorId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="">Seleccionar Profesor</option>
                        {profesores.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.nombre} {p.apellido}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                    <select
                        value={cursoId}
                        onChange={(e) => setCursoId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="">Seleccionar Curso</option>
                        {cursos.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                    <select
                        value={materiaId}
                        onChange={(e) => setMateriaId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="">Seleccionar Materia</option>
                        {materias.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">        
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Día de la semana</label>
                    <select
                        value={dia}
                        onChange={(e) => setDia(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="">Seleccionar Día</option>
                        <option value="Lunes">Lunes</option>
                        <option value="Martes">Martes</option>
                        <option value="Miércoles">Miércoles</option>
                        <option value="Jueves">Jueves</option>
                        <option value="Viernes">Viernes</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora de inicio</label>
                    <input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora de fin</label>
                    <input
                        type="time"
                        value={horaFin}
                        onChange={(e) => setHoraFin(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
            </div>

            <button
                onClick={asignar}
                className={`w-full text-white py-2 px-4 rounded-lg transition-colors font-semibold ${editandoId ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-600 hover:bg-orange-700'}`}
            >
                {editandoId ? "✅ Guardar Cambios" : "➕ Asignar Clase"}
            </button>

            {listaAsignaciones.length > 0 && (
                <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 Asignaciones Actuales</h3>
                    <div className="overflow-x-auto max-h-60 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Profesor</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Curso</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Materia</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Día/Hora</th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-500">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {listaAsignaciones.map((asig) => (
                                    <tr key={asig.id} className={editandoId === asig.id ? 'bg-purple-50' : 'hover:bg-gray-50'}>
                                        <td className="px-3 py-2 whitespace-nowrap">{asig.profesor_nombre} {asig.profesor_apellido}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{asig.curso_nombre}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{asig.materia_nombre}</td>
                                        <td className="px-3 py-2 whitespace-nowrap tracking-tight">{asig.dia} ({formatearHora12(asig.hora_inicio)} - {formatearHora12(asig.hora_fin)})</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-center">
                                            <button 
                                                onClick={() => inciarEdicion(asig)}
                                                className="text-purple-600 hover:underline font-semibold"
                                            >
                                                ✏️ Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
            )}
        </div>
    );
}

export default AsignarClase;
