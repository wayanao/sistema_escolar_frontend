import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";

const ordenarPorBoletin = (items) =>
    [...items].sort((a, b) => {
        const ordenA = Number(a.orden_boletin ?? 100);
        const ordenB = Number(b.orden_boletin ?? 100);
        if (ordenA !== ordenB) return ordenA - ordenB;
        return String(a.materia_nombre || "").localeCompare(String(b.materia_nombre || ""));
    });

function OrdenBoletin() {
    const [cursos, setCursos] = useState([]);
    const [cursoId, setCursoId] = useState("");
    const [materias, setMaterias] = useState([]);
    const [cargandoCursos, setCargandoCursos] = useState(true);
    const [cargandoOrden, setCargandoOrden] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState("");

    const cursoSeleccionado = useMemo(
        () => cursos.find((curso) => String(curso.id) === String(cursoId)),
        [cursos, cursoId],
    );

    useEffect(() => {
        const cargarCursos = async () => {
            setCargandoCursos(true);
            try {
                const res = await api.get("/cursos");
                const data = Array.isArray(res.data) ? res.data : [];
                setCursos(data);
                if (!cursoId && data.length > 0) {
                    setCursoId(String(data[0].id));
                }
            } catch (error) {
                console.error("Error cargando cursos", error);
                setMensaje("No se pudieron cargar los cursos.");
            } finally {
                setCargandoCursos(false);
            }
        };

        cargarCursos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const cargarOrden = async () => {
            if (!cursoId) {
                setMaterias([]);
                return;
            }

            setCargandoOrden(true);
            setMensaje("");
            try {
                const res = await api.get(`/cursos/${cursoId}/orden-boletin`);
                const data = Array.isArray(res.data?.items) ? res.data.items : [];
                setMaterias(ordenarPorBoletin(data));
            } catch (error) {
                console.error("Error cargando orden del boletín", error);
                setMaterias([]);
                setMensaje(error?.response?.data?.detail || "No se pudo cargar el orden del boletín.");
            } finally {
                setCargandoOrden(false);
            }
        };

        cargarOrden();
    }, [cursoId]);

    const moverMateria = (index, delta) => {
        const destino = index + delta;
        if (destino < 0 || destino >= materias.length) return;

        setMaterias((actuales) => {
            const copia = [...actuales];
            const [item] = copia.splice(index, 1);
            copia.splice(destino, 0, item);
            return copia;
        });
        setMensaje("");
    };

    const moverAPosicion = (index, posicion) => {
        const destino = Number(posicion) - 1;
        if (Number.isNaN(destino) || destino < 0 || destino >= materias.length || destino === index) return;

        setMaterias((actuales) => {
            const copia = [...actuales];
            const [item] = copia.splice(index, 1);
            copia.splice(destino, 0, item);
            return copia;
        });
        setMensaje("");
    };

    const ordenarAlfabetico = () => {
        setMaterias((actuales) =>
            [...actuales].sort((a, b) =>
                String(a.materia_nombre || "").localeCompare(String(b.materia_nombre || "")),
            ),
        );
        setMensaje("");
    };

    const guardarOrden = async () => {
        if (!cursoId || materias.length === 0) return;

        setGuardando(true);
        setMensaje("");
        try {
            const payload = {
                materias: materias.map((materia) => ({ materia_id: materia.materia_id })),
            };
            const res = await api.put(`/cursos/${cursoId}/orden-boletin`, payload);
            const data = Array.isArray(res.data?.items) ? res.data.items : materias;
            setMaterias(ordenarPorBoletin(data));
            setMensaje("Orden guardado correctamente.");
        } catch (error) {
            console.error("Error guardando orden del boletín", error);
            setMensaje(error?.response?.data?.detail || "No se pudo guardar el orden.");
        } finally {
            setGuardando(false);
        }
    };

    if (cargandoCursos) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm font-medium text-gray-500 shadow-sm">
                Cargando cursos...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">Curso</label>
                        <select
                            value={cursoId}
                            onChange={(event) => setCursoId(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 lg:max-w-md"
                        >
                            <option value="">Seleccionar curso</option>
                            {cursos.map((curso) => (
                                <option key={curso.id} value={curso.id}>
                                    {curso.nombre}{curso.jornada ? ` (${curso.jornada})` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={ordenarAlfabetico}
                            disabled={guardando || materias.length === 0}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                        >
                            A-Z
                        </button>
                        <button
                            type="button"
                            onClick={guardarOrden}
                            disabled={guardando || materias.length === 0}
                            className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:opacity-60"
                        >
                            {guardando ? "Guardando..." : "Guardar orden"}
                        </button>
                    </div>
                </div>

                {cursoSeleccionado && (
                    <div className="mt-4 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-900">
                        {cursoSeleccionado.nombre}{cursoSeleccionado.jornada ? ` · ${cursoSeleccionado.jornada}` : ""}
                    </div>
                )}
            </section>

            {mensaje && (
                <div
                    className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                        mensaje.toLowerCase().includes("correctamente")
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                    {mensaje}
                </div>
            )}

            <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <h2 className="text-lg font-bold text-gray-900">Materias del boletín</h2>
                    <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                        {materias.length}
                    </span>
                </div>

                {cargandoOrden ? (
                    <div className="p-6 text-sm font-medium text-gray-500">Cargando materias...</div>
                ) : materias.length === 0 ? (
                    <div className="p-6 text-sm font-medium text-gray-500">
                        No hay materias asignadas para este curso.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {materias.map((materia, index) => (
                            <article
                                key={`${materia.curso_id}-${materia.materia_id}`}
                                className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-5"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white">
                                        {index + 1}
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={materias.length}
                                        value={index + 1}
                                        onChange={(event) => moverAPosicion(index, event.target.value)}
                                        className="h-10 w-20 rounded-lg border border-gray-300 px-2 text-center text-sm font-bold text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                                        aria-label={`Posición de ${materia.materia_nombre}`}
                                    />
                                </div>

                                <div className="min-w-0">
                                    <h3 className="truncate text-sm font-black uppercase tracking-wide text-gray-900" translate="no">
                                        {materia.materia_nombre}
                                    </h3>
                                    <p className="mt-1 truncate text-xs font-medium text-gray-500" translate="no">
                                        {materia.profesor_nombre || "Sin profesor"} · {materia.horarios} horario(s)
                                    </p>
                                </div>

                                <div className="flex gap-2 sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => moverMateria(index, -1)}
                                        disabled={index === 0 || guardando}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg font-black text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
                                        title="Subir"
                                        aria-label={`Subir ${materia.materia_nombre}`}
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moverMateria(index, 1)}
                                        disabled={index === materias.length - 1 || guardando}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg font-black text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
                                        title="Bajar"
                                        aria-label={`Bajar ${materia.materia_nombre}`}
                                    >
                                        ↓
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default OrdenBoletin;
