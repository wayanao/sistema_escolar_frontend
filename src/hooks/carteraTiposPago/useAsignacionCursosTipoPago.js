import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { actualizarCursosTipoPago } from "../../services/carteraTiposPagoApi";
import { mostrarExito } from "../ventanaExito";
import {
    actualizarValorCursoAsignado,
    agregarCursosFaltantes,
    crearAsignacionCurso,
    crearCursosAsignadosDesdeDetalle,
    crearPayloadCursos,
    obtenerCursosDisponibles,
    quitarCursoAsignado,
    resumirAsignacionCursos,
    toggleCursoAsignado,
} from "../../utils/carteraTiposPago/tiposPago";

export default function useAsignacionCursosTipoPago({
    selectedTipoId,
    detalle,
    cursos,
    cargarTiposPagos,
}) {
    const [cursosAsignados, setCursosAsignados] = useState([]);
    const [cursoAAgregar, setCursoAAgregar] = useState("");
    const [valorCursoAAgregar, setValorCursoAAgregar] = useState("");
    const [guardandoCursos, setGuardandoCursos] = useState(false);
    const [cursosAsignadosDirty, setCursosAsignadosDirty] = useState(false);

    const inicializarAsignacion = (data) => {
        setCursosAsignados(crearCursosAsignadosDesdeDetalle(data));
        setCursosAsignadosDirty(false);
    };

    const cursosDisponibles = useMemo(
        () => obtenerCursosDisponibles(cursos, cursosAsignados),
        [cursos, cursosAsignados]
    );

    const {
        cursosAsignadosActivos,
        totalCursosActivos,
        cursosPendientes,
    } = useMemo(
        () => resumirAsignacionCursos(cursos, cursosAsignados),
        [cursos, cursosAsignados]
    );

    const agregarCursoLocal = () => {
        const cursoId = Number(cursoAAgregar);
        if (!cursoId) return;
        const curso = cursos.find((item) => item.id === cursoId);
        if (!curso) return;
        const valorBase = detalle?.valor ?? 0;
        const asignacion = crearAsignacionCurso(curso, valorCursoAAgregar, valorBase);
        setCursosAsignados((prev) => [...prev, asignacion]);
        setCursosAsignadosDirty(true);
        setCursoAAgregar("");
        setValorCursoAAgregar("");
    };

    const agregarTodosLosCursos = () => {
        const valorBase = detalle?.valor ?? 0;
        setCursosAsignados((prev) => {
            const siguientes = agregarCursosFaltantes(prev, cursos, valorBase);
            if (siguientes.length > prev.length) setCursosAsignadosDirty(true);
            return siguientes;
        });
    };

    const actualizarValorCurso = (cursoId, valor) => {
        setCursosAsignadosDirty(true);
        setCursosAsignados((prev) => actualizarValorCursoAsignado(prev, cursoId, valor));
    };

    const toggleActivoCurso = (cursoId) => {
        setCursosAsignadosDirty(true);
        setCursosAsignados((prev) => toggleCursoAsignado(prev, cursoId));
    };

    const quitarCurso = (cursoId) => {
        setCursosAsignadosDirty(true);
        setCursosAsignados((prev) => quitarCursoAsignado(prev, cursoId));
    };

    const guardarAsignacionCursos = async () => {
        if (!selectedTipoId) return;
        setGuardandoCursos(true);
        try {
            const payload = crearPayloadCursos(cursosAsignados);
            await actualizarCursosTipoPago(selectedTipoId, payload);
            setCursosAsignadosDirty(false);
            mostrarExito({ title: "Guardado", text: "Cursos asignados correctamente" });
            await cargarTiposPagos();
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.detail;
            Swal.fire("Error", detail || "No se pudo guardar la asignación", "error");
        } finally {
            setGuardandoCursos(false);
        }
    };

    return {
        cursosAsignados,
        cursoAAgregar,
        setCursoAAgregar,
        valorCursoAAgregar,
        setValorCursoAAgregar,
        guardandoCursos,
        cursosAsignadosDirty,
        cursosDisponibles,
        cursosAsignadosActivos,
        totalCursosActivos,
        cursosPendientes,
        inicializarAsignacion,
        agregarCursoLocal,
        agregarTodosLosCursos,
        actualizarValorCurso,
        toggleActivoCurso,
        quitarCurso,
        guardarAsignacionCursos,
    };
}
