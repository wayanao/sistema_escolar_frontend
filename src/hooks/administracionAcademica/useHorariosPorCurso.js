import { useEffect, useMemo, useState } from "react";
import { listarHorariosAdmin } from "../../services/horariosApi";
import {
    filtrarCursosHorario,
    obtenerCursosUnicosHorario,
    obtenerHorariosCurso,
} from "../../utils/administracionAcademica/horarios";

export default function useHorariosPorCurso() {
    const [horarios, setHorarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cursoSeleccionado, setCursoSeleccionado] = useState("");
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const cargarHorarios = async () => {
            try {
                const data = await listarHorariosAdmin({ signal: controller.signal });
                if (controller.signal.aborted) return;

                setHorarios(data);
                const cursos = obtenerCursosUnicosHorario(data);
                if (cursos.length > 0) {
                    setCursoSeleccionado(cursos[0]);
                }
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error("Error cargando horarios por curso:", error);
            } finally {
                if (!controller.signal.aborted) {
                    setCargando(false);
                }
            }
        };

        void cargarHorarios();
        return () => controller.abort();
    }, []);

    const cursosUnicos = useMemo(
        () => obtenerCursosUnicosHorario(horarios, { ordenar: true }),
        [horarios],
    );
    const cursosFiltrados = useMemo(
        () => filtrarCursosHorario(cursosUnicos, busqueda),
        [cursosUnicos, busqueda],
    );

    useEffect(() => {
        if (cursosFiltrados.length > 0 && !cursosFiltrados.includes(cursoSeleccionado)) {
            setCursoSeleccionado(cursosFiltrados[0]);
        }
    }, [cursosFiltrados, cursoSeleccionado]);

    const horariosDelCurso = useMemo(
        () => obtenerHorariosCurso(horarios, cursoSeleccionado),
        [horarios, cursoSeleccionado],
    );

    return {
        horarios,
        cargando,
        cursoSeleccionado,
        setCursoSeleccionado,
        busqueda,
        setBusqueda,
        cursosFiltrados,
        horariosDelCurso,
    };
}
