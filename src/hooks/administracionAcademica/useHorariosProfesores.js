import { useEffect, useMemo, useState } from "react";
import { listarHorariosAdmin } from "../../services/horariosApi";
import {
    obtenerHorariosProfesor,
    obtenerProfesoresUnicosHorario,
} from "../../utils/administracionAcademica/horarios";
import { opcionesConAnio } from "../../utils/anioLectivo";

// `parametrosAnio`: el año que mira el admin (`useAnioLectivo().parametros`).
export default function useHorariosProfesores({ parametrosAnio } = {}) {
    const [horarios, setHorarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [profesorSeleccionado, setProfesorSeleccionado] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const cargarHorarios = async () => {
            try {
                const data = await listarHorariosAdmin(
                    opcionesConAnio({ signal: controller.signal }, parametrosAnio),
                );
                if (controller.signal.aborted) return;

                setHorarios(data);
                const profesores = obtenerProfesoresUnicosHorario(data);
                if (profesores.length > 0) {
                    setProfesorSeleccionado(profesores[0]);
                }
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error("Error cargando horarios:", error);
            } finally {
                if (!controller.signal.aborted) {
                    setCargando(false);
                }
            }
        };

        void cargarHorarios();
        return () => controller.abort();
    }, [parametrosAnio]);

    const profesoresUnicos = useMemo(
        () => obtenerProfesoresUnicosHorario(horarios),
        [horarios],
    );
    const horariosDelProfesor = useMemo(
        () => obtenerHorariosProfesor(horarios, profesorSeleccionado),
        [horarios, profesorSeleccionado],
    );

    return {
        horarios,
        cargando,
        profesorSeleccionado,
        setProfesorSeleccionado,
        profesoresUnicos,
        horariosDelProfesor,
    };
}
