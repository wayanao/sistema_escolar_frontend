import { useState, useEffect, useMemo } from "react";
import api from "../utils/api";

function HorariosPorCurso() {
    const [horarios, setHorarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cursoSeleccionado, setCursoSeleccionado] = useState("");
    const [busqueda, setBusqueda] = useState("");

    const cargarHorarios = async () => {
        try {
            const res = await api.get("/hora/horarios-admin");
            setHorarios(res.data);

            if (res.data.length > 0) {
                const cursosUnicos = [...new Set(res.data.map(h => h.curso))];
                if (cursosUnicos.length > 0) {
                    setCursoSeleccionado(cursosUnicos[0]);
                }
            }
        } catch (error) {
            console.error("Error cargando horarios por curso:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarHorarios();
    }, []);

    const formatearHora12 = (hora24) => {
        if (!hora24) return "";
        if (hora24.toLowerCase().includes("am") || hora24.toLowerCase().includes("pm")) return hora24;
        const [horaStr, minutoStr] = hora24.split(":");
        let horaNum = parseInt(horaStr, 10);
        const ampm = horaNum >= 12 ? 'PM' : 'AM';
        horaNum = horaNum % 12 || 12;
        return `${horaNum}:${minutoStr} ${ampm}`;
    };

    const cursosUnicos = useMemo(
        () => [...new Set(horarios.map(h => h.curso))].sort(),
        [horarios]
    );

    const cursosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return cursosUnicos;
        return cursosUnicos.filter(c => c.toLowerCase().includes(q));
    }, [cursosUnicos, busqueda]);

    // Si el curso seleccionado dejó de estar en la lista filtrada, seleccionamos el primero filtrado
    useEffect(() => {
        if (cursosFiltrados.length > 0 && !cursosFiltrados.includes(cursoSeleccionado)) {
            setCursoSeleccionado(cursosFiltrados[0]);
        }
    }, [cursosFiltrados, cursoSeleccionado]);

    if (cargando) {
        return <p className="text-gray-500">Cargando horarios por curso...</p>;
    }

    if (horarios.length === 0) {
        return <p className="text-gray-500 italic">No hay clases asignadas con horario todavía.</p>;
    }

    const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    const horariosDelCurso = horarios.filter(h => h.curso === cursoSeleccionado);

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mt-6 min-h-[500px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">🏫 Horario por Curso</h2>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="w-full md:w-60">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar curso:</label>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Ej: 5A, Primero..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="w-full md:w-60">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Curso:</label>
                        <select
                            value={cursoSeleccionado}
                            onChange={(e) => setCursoSeleccionado(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                        >
                            {cursosFiltrados.length === 0 ? (
                                <option value="">— Sin coincidencias —</option>
                            ) : (
                                cursosFiltrados.map((curso, index) => (
                                    <option key={index} value={curso}>{curso}</option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {cursoSeleccionado && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    {diasSemana.map(dia => {
                        const clasesDelDia = horariosDelCurso
                            .filter(h => h.dia === dia)
                            .sort((a, b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || ""));

                        return (
                            <div key={dia} className="flex flex-col rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm h-full">
                                <div className="bg-blue-600 text-white text-center py-3 font-semibold tracking-wide uppercase text-sm">
                                    {dia}
                                </div>

                                <div className="p-3 flex flex-col gap-3 min-h-[250px] flex-grow">
                                    {clasesDelDia.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 italic text-sm border-2 border-dashed border-gray-200 rounded-lg flex-grow flex items-center justify-center">
                                            Día libre
                                        </div>
                                    ) : (
                                        clasesDelDia.map((clase, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-all">
                                                <div className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1 bg-blue-50 w-max px-2 py-1 rounded-md">
                                                    ⏱️ {formatearHora12(clase.hora_inicio)} - {formatearHora12(clase.hora_fin)}
                                                </div>

                                                <div className="font-semibold text-gray-800 text-[15px] mb-1 leading-tight">
                                                    📚 {clase.materia}
                                                </div>

                                                <div className="text-sm text-gray-600 flex items-center gap-1 font-medium bg-gray-100 px-2 py-1 mt-2 rounded">
                                                    👨‍🏫 {clase.profesor}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default HorariosPorCurso;
