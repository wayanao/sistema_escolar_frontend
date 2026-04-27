import { useState, useEffect } from "react";
import api from "../utils/api";

function HorariosProfesores() {
    const [horarios, setHorarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [profesorSeleccionado, setProfesorSeleccionado] = useState("");

    const cargarHorarios = async () => {
        try {
            const res = await api.get("/hora/horarios-admin");
            setHorarios(res.data);
            
            // Seleccionar al primer profesor si hay datos
            if (res.data.length > 0) {
                const profesoresUnicos = [...new Set(res.data.map(h => h.profesor))];
                if (profesoresUnicos.length > 0) {
                    setProfesorSeleccionado(profesoresUnicos[0]);
                }
            }
        } catch (error) {
            console.error("Error cargando horarios:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarHorarios();
    }, []);

    if (cargando) {
        return <p className="text-gray-500">Cargando horarios...</p>;
    }

    if (horarios.length === 0) {
        return <p className="text-gray-500 italic">No hay clases asignadas con horario todavía.</p>;
    }

    const profesoresUnicos = [...new Set(horarios.map(h => h.profesor))];
    const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

    const horariosDelProfesor = horarios.filter(h => h.profesor === profesorSeleccionado);

    const formatearHora12 = (hora24) => {
        if (!hora24) return "";
        // Si ya viene con AM/PM (probablemente no, pero por si acaso)
        if (hora24.toLowerCase().includes("am") || hora24.toLowerCase().includes("pm")) return hora24;
        
        const [horaStr, minutoStr] = hora24.split(":");
        let horaNum = parseInt(horaStr, 10);
        const ampm = horaNum >= 12 ? 'PM' : 'AM';
        horaNum = horaNum % 12 || 12; // Convierte 0 a 12 para medianoche
        return `${horaNum}:${minutoStr} ${ampm}`;
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mt-6 min-h-[500px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">📅 Calendario Semanal</h2>
                
                <div className="w-full md:w-72">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ver horario del profesor:</label>
                    <select
                        value={profesorSeleccionado}
                        onChange={(e) => setProfesorSeleccionado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                    >
                        {profesoresUnicos.map((prof, index) => (
                            <option key={index} value={prof}>{prof}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grilla o Tablero del Calendario */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                {diasSemana.map(dia => {
                    const clasesDelDia = horariosDelProfesor.filter(h => h.dia === dia);
                    
                    return (
                        <div key={dia} className="flex flex-col rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm h-full">
                            {/* Cabecera del Día */}
                            <div className="bg-purple-600 text-white text-center py-3 font-semibold tracking-wide uppercase text-sm">
                                {dia}
                            </div>
                            
                            {/* Bloques de horario en este día */}
                            <div className="p-3 flex flex-col gap-3 min-h-[250px] flex-grow">
                                {clasesDelDia.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 italic text-sm border-2 border-dashed border-gray-200 rounded-lg flex-grow flex items-center justify-center">
                                        Día libre
                                    </div>
                                ) : (
                                    clasesDelDia.map((clase, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-all relative">
                                            <div className="text-xs font-bold text-orange-600 mb-2 flex items-center gap-1 bg-orange-50 w-max px-2 py-1 rounded-md">
                                                ⏱️ {formatearHora12(clase.hora_inicio)} - {formatearHora12(clase.hora_fin)}
                                            </div>

                                            <div className="font-semibold text-gray-800 text-[15px] mb-1 leading-tight">
                                                📚 {clase.materia}
                                            </div>
                                            
                                            <div className="text-sm text-gray-600 flex items-center gap-1 font-medium bg-gray-100 px-2 py-1 mt-2 rounded">
                                                🏫 Curso: {clase.curso}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default HorariosProfesores;