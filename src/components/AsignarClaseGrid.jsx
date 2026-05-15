import { useState, useEffect, useMemo } from "react";
import api from "../utils/api";

// Bloques horarios de REFERENCIA (solo guía visual; cada clase puede usar horas libres)
const BLOQUES_HORARIOS = [
    { inicio: "07:00", fin: "08:00" },
    { inicio: "08:00", fin: "09:00" },
    { inicio: "09:00", fin: "10:00" },
    { inicio: "10:00", fin: "11:00" },
    { inicio: "11:00", fin: "12:00" },
    { inicio: "12:00", fin: "13:00" },
    { inicio: "13:00", fin: "14:00" },
    { inicio: "14:00", fin: "15:00" },
    { inicio: "15:00", fin: "16:00" },
    { inicio: "16:00", fin: "17:00" },
    { inicio: "17:00", fin: "18:00" },
];

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Umbrales de jornada (formato HH:MM 24h)
// Mañana: hora_fin <= JORNADA_LIMITE
// Tarde:  hora_inicio >= JORNADA_LIMITE
const JORNADA_LIMITE = "12:00";

const validarJornada = (jornada, hIni, hFin) => {
    if (!jornada || !hIni || !hFin) return null;
    const j = jornada.toLowerCase();
    if (j.includes("mañan") || j.includes("manan")) {
        if (hFin > JORNADA_LIMITE) {
            return `El curso es jornada Mañana: la clase debe terminar antes o a las ${JORNADA_LIMITE}.`;
        }
    } else if (j.includes("tarde")) {
        if (hIni < JORNADA_LIMITE) {
            return `El curso es jornada Tarde: la clase debe comenzar a partir de las ${JORNADA_LIMITE}.`;
        }
    }
    return null;
};

const formatearHora12 = (h24) => {
    if (!h24) return "";
    const [hStr, mStr] = h24.split(":");
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${mStr} ${ampm}`;
};

// Devuelve true si dos rangos HH:MM se solapan
const seSolapan = (aIni, aFin, bIni, bFin) => aIni < bFin && aFin > bIni;

function AsignarClaseGrid({ onChange }) {
    const [profesores, setProfesores] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);

    // Filtro principal: por curso, profesor o vista de disponibilidad
    const [filtroTipo, setFiltroTipo] = useState("curso"); // 'curso' | 'profesor' | 'disponibilidad'
    const [filtroValorId, setFiltroValorId] = useState("");
    const [busqueda, setBusqueda] = useState("");

    // Estado adicional para modo Disponibilidad
    const [diaDisponibilidad, setDiaDisponibilidad] = useState("Lunes");
    const [busquedaProfDisp, setBusquedaProfDisp] = useState("");
    const [cursoParaAsignarDisp, setCursoParaAsignarDisp] = useState("");

    // Modal
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalData, setModalData] = useState(null); // { dia, asignacion? }
    const [form, setForm] = useState({
        profesor_id: "",
        curso_id: "",
        materia_id: "",
        hora_inicio: "",
        hora_fin: "",
    });
    const [guardando, setGuardando] = useState(false);
    const [errorModal, setErrorModal] = useState("");

    const cargarDatos = async () => {
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
            setAsignaciones(l.data);

            // Selección inicial
            if (!filtroValorId) {
                if (filtroTipo === "curso" && c.data.length > 0) setFiltroValorId(String(c.data[0].id));
                if (filtroTipo === "profesor" && p.data.length > 0) setFiltroValorId(String(p.data[0].id));
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    useEffect(() => {
        cargarDatos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cuando se cambia tipo de filtro, resetear valor
    useEffect(() => {
        setBusqueda("");
        if (filtroTipo === "curso" && cursos.length > 0) {
            setFiltroValorId(String(cursos[0].id));
        } else if (filtroTipo === "profesor" && profesores.length > 0) {
            setFiltroValorId(String(profesores[0].id));
        } else {
            setFiltroValorId("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtroTipo]);

    // Pre-seleccionar primer curso para "asignar desde disponibilidad"
    useEffect(() => {
        if (filtroTipo === "disponibilidad" && !cursoParaAsignarDisp && cursos.length > 0) {
            setCursoParaAsignarDisp(String(cursos[0].id));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtroTipo, cursos]);

    // Lista para el selector según el filtro
    const opcionesFiltro = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        const lista = filtroTipo === "curso"
            ? cursos.map(c => ({ id: c.id, label: c.nombre }))
            : profesores.map(p => ({ id: p.id, label: `${p.nombre} ${p.apellido}` }));
        if (!q) return lista;
        return lista.filter(x => x.label.toLowerCase().includes(q));
    }, [filtroTipo, cursos, profesores, busqueda]);

    // Asignaciones visibles en la grilla
    const asignacionesVisibles = useMemo(() => {
        if (!filtroValorId) return [];
        const id = parseInt(filtroValorId, 10);
        return asignaciones.filter(a =>
            filtroTipo === "curso" ? a.curso_id === id : a.profesor_id === id
        );
    }, [asignaciones, filtroTipo, filtroValorId]);

    // Encuentra asignación que ocupa una celda (día + bloque)
    const buscarAsignacionEnCelda = (dia, bloque) => {
        return asignacionesVisibles.find(a =>
            a.dia === dia &&
            a.hora_inicio &&
            a.hora_fin &&
            seSolapan(a.hora_inicio, a.hora_fin, bloque.inicio, bloque.fin)
        );
    };

    // Abrir modal en celda vacía
    const abrirModalNuevo = (dia, bloque) => {
        setErrorModal("");
        setModalData({ dia, asignacion: null });
        // Pre-cargar el lado que ya está filtrado; las horas del bloque sirven como sugerencia inicial
        if (filtroTipo === "curso") {
            setForm({
                profesor_id: "",
                curso_id: filtroValorId,
                materia_id: "",
                hora_inicio: bloque.inicio,
                hora_fin: bloque.fin,
            });
        } else {
            setForm({
                profesor_id: filtroValorId,
                curso_id: "",
                materia_id: "",
                hora_inicio: bloque.inicio,
                hora_fin: bloque.fin,
            });
        }
        setModalAbierto(true);
    };

    // Abrir modal sobre asignación existente
    const abrirModalEditar = (asig) => {
        setErrorModal("");
        setModalData({ dia: asig.dia, asignacion: asig });
        setForm({
            profesor_id: String(asig.profesor_id),
            curso_id: String(asig.curso_id),
            materia_id: String(asig.materia_id),
            hora_inicio: asig.hora_inicio || "",
            hora_fin: asig.hora_fin || "",
        });
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setModalData(null);
        setForm({ profesor_id: "", curso_id: "", materia_id: "", hora_inicio: "", hora_fin: "" });
        setErrorModal("");
    };

    const guardar = async () => {
        if (!form.profesor_id || !form.curso_id || !form.materia_id) {
            setErrorModal("Completa profesor y materia.");
            return;
        }
        if (!form.hora_inicio || !form.hora_fin) {
            setErrorModal("Define la hora de inicio y fin.");
            return;
        }
        if (form.hora_inicio >= form.hora_fin) {
            setErrorModal("La hora de inicio debe ser anterior a la hora de fin.");
            return;
        }

        // Validación de jornada (frontend) según el curso seleccionado
        const cursoSel = cursos.find(c => String(c.id) === String(form.curso_id));
        const errJornada = validarJornada(cursoSel?.jornada, form.hora_inicio, form.hora_fin);
        if (errJornada) {
            setErrorModal(errJornada);
            return;
        }

        const payload = {
            profesor_id: parseInt(form.profesor_id, 10),
            curso_id: parseInt(form.curso_id, 10),
            materia_id: parseInt(form.materia_id, 10),
            dia: modalData.dia,
            hora_inicio: form.hora_inicio,
            hora_fin: form.hora_fin,
        };
        setGuardando(true);
        try {
            if (modalData.asignacion) {
                await api.put(`/asignaciones/${modalData.asignacion.id}`, payload);
            } else {
                await api.post(`/asignaciones`, payload);
            }
            await cargarDatos();
            if (onChange) onChange();
            cerrarModal();
        } catch (error) {
            const msg = error?.response?.data?.detail || "No se pudo guardar la asignación.";
            setErrorModal(msg);
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = async () => {
        if (!modalData?.asignacion) return;
        if (!window.confirm("¿Eliminar esta asignación? También se eliminarán sus notas.")) return;
        setGuardando(true);
        try {
            await api.delete(`/asignaciones/${modalData.asignacion.id}`);
            await cargarDatos();
            if (onChange) onChange();
            cerrarModal();
        } catch (error) {
            const msg = error?.response?.data?.detail || "No se pudo eliminar.";
            setErrorModal(msg);
        } finally {
            setGuardando(false);
        }
    };

    const tituloFiltro = filtroTipo === "curso" ? "Curso" : "Profesor";

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            {/* Encabezado: título e instrucciones SIEMPRE arriba */}
            <div className="mb-5 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">🧩 Asignar por grilla</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Click en una celda vacía para asignar (las horas son <strong>solo guía</strong>: puedes ajustar 3:15, 3:30, etc.). Click en una existente para editar / eliminar. Usa <strong>🟩 Disponibilidad</strong> para ver qué profesores tienen huecos.
                </p>
            </div>

            {/* Tabs / vista */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vista</label>
                <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden flex-wrap">
                    <button
                        type="button"
                        onClick={() => setFiltroTipo("curso")}
                        className={`px-3 py-2 text-sm font-medium ${filtroTipo === "curso" ? "bg-orange-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                    >
                        🏫 Por curso
                    </button>
                    <button
                        type="button"
                        onClick={() => setFiltroTipo("profesor")}
                        className={`px-3 py-2 text-sm font-medium border-l border-gray-300 ${filtroTipo === "profesor" ? "bg-purple-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                    >
                        👨‍🏫 Por profesor
                    </button>
                    <button
                        type="button"
                        onClick={() => setFiltroTipo("disponibilidad")}
                        className={`px-3 py-2 text-sm font-medium border-l border-gray-300 ${filtroTipo === "disponibilidad" ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                    >
                        🟩 Disponibilidad
                    </button>
                </div>
            </div>

            {/* Controles de búsqueda según la vista */}
            {filtroTipo !== "disponibilidad" ? (
                <div className="flex flex-col md:flex-row gap-3 mb-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder={filtroTipo === "curso" ? "Ej: 5A" : "Ej: María"}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{tituloFiltro}</label>
                        <select
                            value={filtroValorId}
                            onChange={(e) => setFiltroValorId(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 min-w-[200px]"
                        >
                            {opcionesFiltro.length === 0 ? (
                                <option value="">— Sin coincidencias —</option>
                            ) : (
                                opcionesFiltro.map(o => (
                                    <option key={o.id} value={o.id}>{o.label}</option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-3 mb-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Día</label>
                        <select
                            value={diaDisponibilidad}
                            onChange={(e) => setDiaDisponibilidad(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                            {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar profesor</label>
                        <input
                            type="text"
                            value={busquedaProfDisp}
                            onChange={(e) => setBusquedaProfDisp(e.target.value)}
                            placeholder="Ej: María"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Asignar al curso</label>
                        <select
                            value={cursoParaAsignarDisp}
                            onChange={(e) => setCursoParaAsignarDisp(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 min-w-[200px]"
                        >
                            <option value="">— Sin curso (solo ver) —</option>
                            {cursos.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre}{c.jornada ? ` (${c.jornada})` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Grilla principal (curso / profesor) */}
            {filtroTipo !== "disponibilidad" && (
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 text-sm">
                        <thead>
                            <tr>
                                <th className="bg-gray-100 border border-gray-200 px-3 py-2 text-left w-32">Hora</th>
                                {DIAS.map(d => (
                                    <th key={d} className="bg-gray-100 border border-gray-200 px-3 py-2 text-center">
                                        {d}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {BLOQUES_HORARIOS.map((bloque, idx) => (
                                <tr key={idx}>
                                    <td className="border border-gray-200 px-3 py-2 bg-gray-50 font-semibold text-gray-700 whitespace-nowrap">
                                        {formatearHora12(bloque.inicio)}<br />
                                        <span className="text-xs text-gray-500">a {formatearHora12(bloque.fin)}</span>
                                    </td>
                                    {DIAS.map(dia => {
                                        const asig = buscarAsignacionEnCelda(dia, bloque);
                                        if (asig) {
                                            const esExactoBloque = asig.hora_inicio === bloque.inicio && asig.hora_fin === bloque.fin;
                                            return (
                                                <td
                                                    key={dia}
                                                    onClick={() => abrirModalEditar(asig)}
                                                    className={`border border-gray-200 align-top p-2 cursor-pointer transition-colors ${
                                                        filtroTipo === "curso"
                                                            ? "bg-blue-50 hover:bg-blue-100"
                                                            : "bg-purple-50 hover:bg-purple-100"
                                                    }`}
                                                    title="Click para editar / eliminar"
                                                >
                                                    <div className={`rounded p-2 border-l-4 ${filtroTipo === "curso" ? "border-blue-500 bg-white" : "border-purple-500 bg-white"}`}>
                                                        <div className="font-semibold text-gray-800 text-[13px] leading-tight">
                                                            📚 {asig.materia_nombre}
                                                        </div>
                                                        <div className="text-[12px] text-gray-600 mt-1">
                                                            {filtroTipo === "curso"
                                                                ? `👨‍🏫 ${asig.profesor_nombre}`
                                                                : `🏫 ${asig.curso_nombre}`}
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 mt-1">
                                                            {formatearHora12(asig.hora_inicio)} - {formatearHora12(asig.hora_fin)}
                                                            {!esExactoBloque && <span className="ml-1 text-orange-500">*</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        }
                                        return (
                                            <td
                                                key={dia}
                                                onClick={() => filtroValorId && abrirModalNuevo(dia, bloque)}
                                                className={`border border-gray-200 align-middle p-2 text-center cursor-pointer transition-colors ${
                                                    filtroValorId ? "hover:bg-orange-50 text-gray-300 hover:text-orange-500" : "text-gray-200"
                                                }`}
                                                title={filtroValorId ? "Click para asignar" : ""}
                                            >
                                                ＋
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-xs text-gray-400 mt-2">* La clase no coincide exactamente con el bloque horario predefinido.</p>
                </div>
            )}

            {/* Vista Disponibilidad: profesores × bloques (de un día) */}
            {filtroTipo === "disponibilidad" && (() => {
                const cursoSelDisp = cursos.find(c => String(c.id) === String(cursoParaAsignarDisp));
                const jornadaCursoDisp = (cursoSelDisp?.jornada || "").toLowerCase();
                const profsFiltrados = profesores
                    .filter(p => {
                        const q = busquedaProfDisp.trim().toLowerCase();
                        if (!q) return true;
                        return `${p.nombre} ${p.apellido}`.toLowerCase().includes(q);
                    });

                // Devuelve la asignación de un profesor en un bloque (en el día seleccionado)
                const asigProfBloque = (profesorId, bloque) => asignaciones.find(a =>
                    a.profesor_id === profesorId &&
                    a.dia === diaDisponibilidad &&
                    a.hora_inicio && a.hora_fin &&
                    seSolapan(a.hora_inicio, a.hora_fin, bloque.inicio, bloque.fin)
                );

                const fueraDeJornada = (bloque) => {
                    if (!jornadaCursoDisp) return false;
                    if (jornadaCursoDisp.includes("mañan") || jornadaCursoDisp.includes("manan")) {
                        return bloque.fin > JORNADA_LIMITE;
                    }
                    if (jornadaCursoDisp.includes("tarde")) {
                        return bloque.inicio < JORNADA_LIMITE;
                    }
                    return false;
                };

                const abrirAsignarDisponibilidad = (profesor, bloque) => {
                    if (!cursoParaAsignarDisp) {
                        alert("Selecciona primero un curso en 'Asignar al curso' para poder asignar.");
                        return;
                    }
                    setErrorModal("");
                    setModalData({ dia: diaDisponibilidad, asignacion: null });
                    setForm({
                        profesor_id: String(profesor.id),
                        curso_id: cursoParaAsignarDisp,
                        materia_id: "",
                        hora_inicio: bloque.inicio,
                        hora_fin: bloque.fin,
                    });
                    setModalAbierto(true);
                };

                return (
                    <div className="overflow-x-auto">
                        <div className="flex flex-wrap gap-3 mb-3 text-xs">
                            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300"></span> Libre</span>
                            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-300"></span> Ocupado</span>
                            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-gray-200 border border-gray-300"></span> Fuera de jornada</span>
                            {cursoSelDisp && (
                                <span className="ml-auto text-gray-600">
                                    Curso destino: <strong>{cursoSelDisp.nombre}</strong>
                                    {cursoSelDisp.jornada && <span className="ml-1">({cursoSelDisp.jornada})</span>}
                                </span>
                            )}
                        </div>

                        <table className="min-w-full border border-gray-200 text-xs">
                            <thead>
                                <tr>
                                    <th className="bg-gray-100 border border-gray-200 px-2 py-2 text-left sticky left-0 z-10 min-w-[180px]">
                                        Profesor — {diaDisponibilidad}
                                    </th>
                                    {BLOQUES_HORARIOS.map((b, i) => (
                                        <th key={i} className="bg-gray-100 border border-gray-200 px-2 py-2 text-center whitespace-nowrap">
                                            {formatearHora12(b.inicio)}
                                            <div className="text-[10px] text-gray-500 font-normal">a {formatearHora12(b.fin)}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {profsFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={BLOQUES_HORARIOS.length + 1} className="text-center text-gray-400 py-6 italic">
                                            Sin profesores que coincidan.
                                        </td>
                                    </tr>
                                ) : (
                                    profsFiltrados.map(prof => {
                                        // Calcular horas semanales asignadas
                                        let totalMin = 0;
                                        asignaciones.forEach(a => {
                                            if (a.profesor_id === prof.id && a.hora_inicio && a.hora_fin) {
                                                const [hi, mi] = a.hora_inicio.split(":").map(Number);
                                                const [hf, mf] = a.hora_fin.split(":").map(Number);
                                                totalMin += (hf * 60 + mf) - (hi * 60 + mi);
                                            }
                                        });
                                        const totalHrs = Math.round((totalMin / 60) * 10) / 10;

                                        return (
                                            <tr key={prof.id}>
                                                <td className="border border-gray-200 px-2 py-2 bg-white sticky left-0 z-10 font-medium text-gray-800">
                                                    👨‍🏫 {prof.nombre} {prof.apellido}
                                                    <div className="text-[10px] text-gray-500 font-normal">{totalHrs}h / semana</div>
                                                </td>
                                                {BLOQUES_HORARIOS.map((bloque, i) => {
                                                    const asig = asigProfBloque(prof.id, bloque);
                                                    const off = fueraDeJornada(bloque);
                                                    if (asig) {
                                                        return (
                                                            <td
                                                                key={i}
                                                                onClick={() => abrirModalEditar(asig)}
                                                                title={`Ocupado: ${asig.materia_nombre} - ${asig.curso_nombre}`}
                                                                className="border border-gray-200 p-1 text-center bg-red-100 hover:bg-red-200 cursor-pointer transition-colors"
                                                            >
                                                                <div className="text-[10px] font-semibold text-red-800 leading-tight truncate max-w-[90px]">
                                                                    {asig.materia_nombre}
                                                                </div>
                                                                <div className="text-[10px] text-red-600 truncate max-w-[90px]">
                                                                    {asig.curso_nombre}
                                                                </div>
                                                            </td>
                                                        );
                                                    }
                                                    if (off) {
                                                        return (
                                                            <td
                                                                key={i}
                                                                className="border border-gray-200 p-1 text-center bg-gray-200 text-gray-400"
                                                                title="Fuera de la jornada del curso seleccionado"
                                                            >
                                                                —
                                                            </td>
                                                        );
                                                    }
                                                    return (
                                                        <td
                                                            key={i}
                                                            onClick={() => abrirAsignarDisponibilidad(prof, bloque)}
                                                            title={cursoParaAsignarDisp ? "Click para asignar aquí" : "Selecciona un curso destino para poder asignar"}
                                                            className={`border border-gray-200 p-1 text-center bg-green-100 transition-colors ${cursoParaAsignarDisp ? "hover:bg-green-200 cursor-pointer" : "cursor-default opacity-80"}`}
                                                        >
                                                            <span className="text-green-700 font-semibold">+</span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                        <p className="text-xs text-gray-400 mt-2">
                            💡 Tip: selecciona el curso destino arriba para habilitar la asignación con un click en celdas verdes.
                        </p>
                    </div>
                );
            })()}

            {/* Modal */}
            {modalAbierto && modalData && (() => {
                const cursoSel = cursos.find(c => String(c.id) === String(form.curso_id));
                const jornadaCurso = cursoSel?.jornada;
                return (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {modalData.asignacion ? "✏️ Editar asignación" : "➕ Nueva asignación"}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    📅 {modalData.dia}
                                    {cursoSel && (
                                        <> · 🏫 {cursoSel.nombre}
                                            {jornadaCurso && (
                                                <span className={`ml-1 px-2 py-0.5 text-xs font-semibold rounded-full ${jornadaCurso.toLowerCase().includes("tarde") ? "bg-orange-100 text-orange-800" : "bg-purple-100 text-purple-900"}`}>
                                                    {jornadaCurso}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </p>
                            </div>
                            <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profesor</label>
                                <select
                                    value={form.profesor_id}
                                    onChange={(e) => setForm({ ...form, profesor_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Seleccionar profesor</option>
                                    {profesores.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Selector de curso solo cuando NO está preseleccionado por el filtro */}
                            {filtroTipo !== "curso" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                                    <select
                                        value={form.curso_id}
                                        onChange={(e) => setForm({ ...form, curso_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Seleccionar curso</option>
                                        {cursos.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nombre}{c.jornada ? ` (${c.jornada})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                                <select
                                    value={form.materia_id}
                                    onChange={(e) => setForm({ ...form, materia_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Seleccionar materia</option>
                                    {materias.map(m => (
                                        <option key={m.id} value={m.id}>{m.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                                    <input
                                        type="time"
                                        step="300"
                                        value={form.hora_inicio}
                                        onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                                    <input
                                        type="time"
                                        step="300"
                                        value={form.hora_fin}
                                        onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {jornadaCurso && (
                                <p className="text-xs text-gray-500">
                                    {jornadaCurso.toLowerCase().includes("tarde")
                                        ? `⏰ Jornada Tarde: horas a partir de ${JORNADA_LIMITE}.`
                                        : `⏰ Jornada Mañana: horas hasta ${JORNADA_LIMITE}.`}
                                </p>
                            )}

                            {errorModal && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-2">
                                    {errorModal}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between mt-6 gap-2">
                            <div>
                                {modalData.asignacion && (
                                    <button
                                        onClick={eliminar}
                                        disabled={guardando}
                                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                                    >
                                        🗑️ Eliminar
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={cerrarModal}
                                    disabled={guardando}
                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardar}
                                    disabled={guardando}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-semibold disabled:opacity-50"
                                >
                                    {guardando ? "Guardando..." : (modalData.asignacion ? "✅ Guardar" : "➕ Crear")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })()}
        </div>
    );
}

export default AsignarClaseGrid;
