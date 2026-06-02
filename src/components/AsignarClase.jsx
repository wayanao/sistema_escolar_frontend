import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const MANANA_INICIO = "06:30";
const MANANA_FIN = "12:30";
const TARDE_INICIO = "13:00";
const TARDE_FIN = "18:00";

const formatearHora12 = (hora24) => {
    if (!hora24) return "";
    if (hora24.toLowerCase().includes("am") || hora24.toLowerCase().includes("pm")) return hora24;
    const [horaStr, minutoStr] = hora24.split(":");
    let horaNum = parseInt(horaStr, 10);
    const ampm = horaNum >= 12 ? "PM" : "AM";
    horaNum = horaNum % 12 || 12;
    return `${horaNum}:${minutoStr} ${ampm}`;
};

const estaEnRangoInstitucional = (inicio, fin) => {
    if (!inicio || !fin) return false;
    const estaEnManana = inicio >= MANANA_INICIO && fin <= MANANA_FIN;
    const estaEnTarde = inicio >= TARDE_INICIO && fin <= TARDE_FIN;
    return estaEnManana || estaEnTarde;
};

function AsignarClase() {
    const [profesores, setProfesores] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [listaAsignaciones, setListaAsignaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensajeEstado, setMensajeEstado] = useState("");
    const [disponibilidad, setDisponibilidad] = useState(null);
    const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);

    const [cursoId, setCursoId] = useState("");
    const [profesorId, setProfesorId] = useState("");
    const [materiaId, setMateriaId] = useState("");
    const [dia, setDia] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFin, setHoraFin] = useState("");
    const [editandoId, setEditandoId] = useState(null);

    const cargarDatos = async ({ mostrarCarga = true } = {}) => {
        if (mostrarCarga) setCargando(true);
        try {
            const [p, c, m, l] = await Promise.all([
                api.get("/profesores"),
                api.get("/cursos"),
                api.get("/materias"),
                api.get("/asignaciones/lista"),
            ]);

            setProfesores(p.data);
            setCursos(c.data);
            setMaterias(m.data);
            setListaAsignaciones(l.data);

            if (!cursoId && c.data.length > 0) {
                setCursoId(String(c.data[0].id));
            }
        } catch (error) {
            console.error("Error cargando datos de asignación", error);
        } finally {
            if (mostrarCarga) setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const cargarDisponibilidad = async () => {
            if (!profesorId || !dia) {
                setDisponibilidad(null);
                return;
            }

            setCargandoDisponibilidad(true);
            try {
                const params = { dia };
                if (editandoId) params.excluir_asignacion_id = editandoId;
                const res = await api.get(`/profesores/${profesorId}/disponibilidad`, { params });
                setDisponibilidad(res.data);
            } catch (error) {
                console.error("Error cargando disponibilidad del profesor", error);
                setDisponibilidad(null);
            } finally {
                setCargandoDisponibilidad(false);
            }
        };

        cargarDisponibilidad();
    }, [profesorId, dia, editandoId]);

    useEffect(() => {
        if (!mensajeEstado.toLowerCase().includes("correctamente")) return undefined;

        const timer = window.setTimeout(() => {
            setMensajeEstado("");
        }, 3500);

        return () => window.clearTimeout(timer);
    }, [mensajeEstado]);

    const cursoSeleccionado = useMemo(
        () => cursos.find((curso) => String(curso.id) === String(cursoId)),
        [cursos, cursoId],
    );

    const asignacionesCurso = useMemo(() => {
        return listaAsignaciones
            .filter((asig) => String(asig.curso_id) === String(cursoId))
            .sort((a, b) => {
                const diaA = DIAS_SEMANA.indexOf(a.dia);
                const diaB = DIAS_SEMANA.indexOf(b.dia);
                if (diaA !== diaB) return diaA - diaB;
                return (a.hora_inicio || "").localeCompare(b.hora_inicio || "");
            });
    }, [listaAsignaciones, cursoId]);

    const limpiarFormulario = (mantenerCurso = true) => {
        setProfesorId("");
        setMateriaId("");
        setDia("");
        setHoraInicio("");
        setHoraFin("");
        setEditandoId(null);
        setDisponibilidad(null);
        if (!mantenerCurso) setCursoId("");
    };

    const seleccionarCurso = (nuevoCursoId) => {
        setCursoId(nuevoCursoId);
        setMensajeEstado("");
        limpiarFormulario(true);
    };

    const iniciarEdicion = (asig) => {
        setMensajeEstado("");
        setEditandoId(asig.id);
        setCursoId(String(asig.curso_id || ""));
        setProfesorId(String(asig.profesor_id || ""));
        setMateriaId(String(asig.materia_id || ""));
        setDia(asig.dia || "");
        setHoraInicio(asig.hora_inicio || "");
        setHoraFin(asig.hora_fin || "");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const buscarMateriaConOtroProfesor = ({ asignacionIdActual }) => {
        return listaAsignaciones.find((asig) =>
            String(asig.id) !== String(asignacionIdActual || "") &&
            String(asig.curso_id) === String(cursoId) &&
            String(asig.materia_id) === String(materiaId) &&
            String(asig.profesor_id) !== String(profesorId)
        );
    };

    const validarFormulario = () => {
        if (!cursoId || !profesorId || !materiaId || !dia || !horaInicio || !horaFin) {
            return "Completa curso, profesor, materia, día y horas.";
        }
        if (horaInicio >= horaFin) {
            return "La hora de inicio debe ser anterior a la hora de fin.";
        }
        if (!estaEnRangoInstitucional(horaInicio, horaFin)) {
            return `El horario debe estar dentro de ${MANANA_INICIO}-${MANANA_FIN} o ${TARDE_INICIO}-${TARDE_FIN}.`;
        }

        const jornada = (cursoSeleccionado?.jornada || "").toLowerCase();
        if ((jornada.includes("mañan") || jornada.includes("manan")) && horaFin > MANANA_FIN) {
            return `El curso es jornada Mañana: la clase debe terminar antes o a las ${MANANA_FIN}.`;
        }
        if (jornada.includes("tarde") && horaInicio < TARDE_INICIO) {
            return `El curso es jornada Tarde: la clase debe comenzar a partir de las ${TARDE_INICIO}.`;
        }

        const conflictoProfesor = buscarMateriaConOtroProfesor({ asignacionIdActual: editandoId });
        if (conflictoProfesor) {
            return `Esta materia ya está asignada en este curso al profesor ${conflictoProfesor.profesor_nombre || ""}.`;
        }

        return null;
    };

    const actualizarCampo = (setter) => (valor) => {
        setMensajeEstado("");
        setter(valor);
    };

    const asignar = async () => {
        const error = validarFormulario();
        if (error) {
            setMensajeEstado(error);
            return;
        }

        const payload = {
            profesor_id: parseInt(profesorId, 10),
            curso_id: parseInt(cursoId, 10),
            materia_id: parseInt(materiaId, 10),
            dia,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
        };

        setGuardando(true);
        setMensajeEstado("");
        try {
            if (editandoId) {
                await api.put(`/asignaciones/${editandoId}`, payload);
                setMensajeEstado("Asignación actualizada correctamente.");
            } else {
                await api.post("/asignaciones", payload);
                setMensajeEstado("Asignación creada correctamente.");
            }
            limpiarFormulario(true);
            await cargarDatos({ mostrarCarga: false });
        } catch (error) {
            const mensaje = error?.response?.data?.detail || "Ocurrió un error al procesar la asignación.";
            setMensajeEstado(mensaje);
        } finally {
            setGuardando(false);
        }
    };

    const desactivarAsignacion = async (asig) => {
        const ok = window.confirm(
            "¿Desactivar esta asignación? No se borrarán planes de clase, notas, asistencia ni boletines históricos.",
        );
        if (!ok) return;

        setGuardando(true);
        setMensajeEstado("");
        try {
            await api.delete(`/asignaciones/${asig.id}`);
            if (editandoId === asig.id) limpiarFormulario(true);
            setMensajeEstado("Asignación desactivada correctamente.");
            await cargarDatos({ mostrarCarga: false });
        } catch (error) {
            const mensaje = error?.response?.data?.detail || "No se pudo desactivar la asignación.";
            setMensajeEstado(mensaje);
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-500">
                Cargando asignador de clases...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <section className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Curso de trabajo</label>
                        <select
                            value={cursoId}
                            onChange={(e) => seleccionarCurso(e.target.value)}
                            className="w-full lg:max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Seleccionar curso</option>
                            {cursos.map((curso) => (
                                <option key={curso.id} value={curso.id}>
                                    {curso.nombre}{curso.jornada ? ` (${curso.jornada})` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    {cursoSeleccionado && (
                        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            Asignando para <strong>{cursoSeleccionado.nombre}</strong>
                            {cursoSeleccionado.jornada && <span> · Jornada {cursoSeleccionado.jornada}</span>}
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {editandoId ? "Editar asignación" : "Nueva asignación"}
                    </h2>
                    {editandoId && (
                        <button
                            type="button"
                            onClick={() => limpiarFormulario(true)}
                            className="self-start md:self-auto text-sm bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancelar edición
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Profesor</label>
                        <select
                            value={profesorId}
                            onChange={(e) => actualizarCampo(setProfesorId)(e.target.value)}
                            disabled={!cursoId}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                            <option value="">Seleccionar profesor</option>
                            {profesores.map((profesor) => (
                                <option key={profesor.id} value={profesor.id}>
                                    {profesor.nombre} {profesor.apellido}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                        <select
                            value={materiaId}
                            onChange={(e) => actualizarCampo(setMateriaId)(e.target.value)}
                            disabled={!cursoId}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                            <option value="">Seleccionar materia</option>
                            {materias.map((materia) => (
                                <option key={materia.id} value={materia.id}>
                                    {materia.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Día</label>
                        <select
                            value={dia}
                            onChange={(e) => actualizarCampo(setDia)(e.target.value)}
                            disabled={!cursoId}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                            <option value="">Seleccionar día</option>
                            {DIAS_SEMANA.map((diaSemana) => (
                                <option key={diaSemana} value={diaSemana}>{diaSemana}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                        <input
                            type="time"
                            value={horaInicio}
                            onChange={(e) => actualizarCampo(setHoraInicio)(e.target.value)}
                            disabled={!cursoId}
                            min={MANANA_INICIO}
                            max={TARDE_FIN}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                        <input
                            type="time"
                            value={horaFin}
                            onChange={(e) => actualizarCampo(setHoraFin)(e.target.value)}
                            disabled={!cursoId}
                            min={MANANA_INICIO}
                            max={TARDE_FIN}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
                    <DisponibilidadProfesor
                        disponibilidad={disponibilidad}
                        cargando={cargandoDisponibilidad}
                        profesorId={profesorId}
                        dia={dia}
                    />

                    <button
                        type="button"
                        onClick={asignar}
                        disabled={guardando || !cursoId}
                        className={`w-full lg:w-56 text-white py-2.5 px-4 rounded-lg transition-colors font-semibold disabled:opacity-60 ${
                            editandoId ? "bg-blue-700 hover:bg-blue-800" : "bg-orange-600 hover:bg-orange-700"
                        }`}
                    >
                        {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Asignar clase"}
                    </button>
                </div>

                {mensajeEstado && (
                    <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
                        mensajeEstado.toLowerCase().includes("correctamente")
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}>
                        {mensajeEstado}
                    </div>
                )}
            </section>

            <HorarioCurso
                asignaciones={asignacionesCurso}
                cursoSeleccionado={cursoSeleccionado}
                editandoId={editandoId}
                onEditar={iniciarEdicion}
                onDesactivar={desactivarAsignacion}
                guardando={guardando}
            />
        </div>
    );
}

function DisponibilidadProfesor({ disponibilidad, cargando, profesorId, dia }) {
    if (!profesorId || !dia) {
        return (
            <div className="border border-dashed border-gray-300 rounded-lg p-3 text-sm text-gray-500 bg-gray-50">
                Selecciona profesor y día para ver rangos disponibles.
            </div>
        );
    }

    if (cargando) {
        return (
            <div className="border border-gray-200 rounded-lg p-3 text-sm text-gray-500 bg-gray-50">
                Calculando disponibilidad...
            </div>
        );
    }

    if (!disponibilidad) {
        return (
            <div className="border border-red-200 rounded-lg p-3 text-sm text-red-700 bg-red-50">
                No se pudo calcular la disponibilidad.
            </div>
        );
    }

    return (
        <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50">
            <h3 className="text-sm font-semibold text-emerald-900 mb-2">
                Disponibilidad del profesor para {dia}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {disponibilidad.jornadas.map((jornada) => (
                    <div key={jornada.jornada} className="bg-white border border-emerald-100 rounded-lg p-3">
                        <div className="text-xs font-bold text-emerald-800 uppercase mb-2">
                            {jornada.jornada} · {formatearHora12(jornada.inicio)} - {formatearHora12(jornada.fin)}
                        </div>
                        {jornada.rangos.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">Sin rangos libres.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {jornada.rangos.map((rango) => (
                                    <span
                                        key={`${jornada.jornada}-${rango.inicio}-${rango.fin}`}
                                        className="inline-flex rounded-md bg-emerald-100 text-emerald-900 px-2 py-1 text-xs font-semibold"
                                    >
                                        {formatearHora12(rango.inicio)} - {formatearHora12(rango.fin)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function HorarioCurso({ asignaciones, cursoSeleccionado, editandoId, onEditar, onDesactivar, guardando }) {
    if (!cursoSeleccionado) {
        return (
            <section className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 text-gray-500">
                Selecciona un curso para ver sus asignaciones.
            </section>
        );
    }

    return (
        <section className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-5">
                <h2 className="text-xl font-semibold text-gray-900">Horario asignado de {cursoSeleccionado.nombre}</h2>
                <span className="text-sm text-gray-500">{asignaciones.length} asignación(es) activa(s)</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                {DIAS_SEMANA.map((diaSemana) => {
                    const clasesDelDia = asignaciones.filter((asig) => asig.dia === diaSemana);

                    return (
                        <div key={diaSemana} className="flex flex-col rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm h-full">
                            <div className="bg-blue-600 text-white text-center py-3 font-semibold tracking-wide uppercase text-sm">
                                {diaSemana}
                            </div>

                            <div className="p-3 flex flex-col gap-3 min-h-[250px] flex-grow">
                                {clasesDelDia.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 italic text-sm border-2 border-dashed border-gray-200 rounded-lg flex-grow flex items-center justify-center">
                                        Día libre
                                    </div>
                                ) : (
                                    clasesDelDia.map((clase) => (
                                        <div
                                            key={clase.id}
                                            className={`bg-white p-4 rounded-lg shadow-sm border-l-4 hover:shadow-md transition-all ${
                                                editandoId === clase.id ? "border-orange-500 ring-2 ring-orange-100" : "border-blue-500"
                                            }`}
                                        >
                                            <div className="text-xs font-bold text-blue-600 mb-2 bg-blue-50 w-max px-2 py-1 rounded-md">
                                                {formatearHora12(clase.hora_inicio)} - {formatearHora12(clase.hora_fin)}
                                            </div>

                                            <div className="font-semibold text-gray-800 text-[15px] mb-1 leading-tight">
                                                {clase.materia_nombre}
                                            </div>

                                            <div className="text-sm text-gray-600 font-medium bg-gray-100 px-2 py-1 mt-2 rounded">
                                                {clase.profesor_nombre}
                                            </div>

                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => onEditar(clase)}
                                                    className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDesactivar(clase)}
                                                    disabled={guardando}
                                                    className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-60"
                                                >
                                                    Desactivar
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default AsignarClase;
