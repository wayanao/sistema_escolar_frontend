import { useCallback, useEffect, useMemo, useState } from "react";
import {
    actualizarAsignacion,
    crearAsignacion,
    desactivarAsignacion as desactivarAsignacionApi,
} from "../../services/asignacionesApi";
import {
    construirPayloadAsignacion,
    obtenerAsignacionesCurso,
    validarAsignacion,
} from "../../utils/administracionAcademica/asignaciones";

export default function useComandosAsignaciones({
    cursos,
    listaAsignaciones,
    recargar,
}) {
    const [cursoId, setCursoId] = useState("");
    const [profesorId, setProfesorId] = useState("");
    const [materiaId, setMateriaId] = useState("");
    const [dia, setDia] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFin, setHoraFin] = useState("");
    const [editandoId, setEditandoId] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [mensajeEstado, setMensajeEstado] = useState("");

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

    const asignacionesCurso = useMemo(
        () => obtenerAsignacionesCurso(listaAsignaciones, cursoId),
        [listaAsignaciones, cursoId],
    );

    const limpiarFormulario = useCallback((mantenerCurso = true) => {
        setProfesorId("");
        setMateriaId("");
        setDia("");
        setHoraInicio("");
        setHoraFin("");
        setEditandoId(null);
        if (!mantenerCurso) setCursoId("");
    }, []);

    const seleccionarCurso = useCallback((nuevoCursoId) => {
        setCursoId(nuevoCursoId);
        setMensajeEstado("");
        limpiarFormulario(true);
    }, [limpiarFormulario]);

    const cancelarEdicion = useCallback(() => {
        limpiarFormulario(true);
    }, [limpiarFormulario]);

    const iniciarEdicion = useCallback((asignacion) => {
        setMensajeEstado("");
        setEditandoId(asignacion.id);
        setCursoId(String(asignacion.curso_id || ""));
        setProfesorId(String(asignacion.profesor_id || ""));
        setMateriaId(String(asignacion.materia_id || ""));
        setDia(asignacion.dia || "");
        setHoraInicio(asignacion.hora_inicio || "");
        setHoraFin(asignacion.hora_fin || "");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const actualizarCampo = useCallback((campo, valor) => {
        setMensajeEstado("");
        if (campo === "profesorId") setProfesorId(valor);
        if (campo === "materiaId") setMateriaId(valor);
        if (campo === "dia") setDia(valor);
        if (campo === "horaInicio") setHoraInicio(valor);
        if (campo === "horaFin") setHoraFin(valor);
    }, []);

    const guardarAsignacion = useCallback(async () => {
        const error = validarAsignacion({
            cursoId,
            profesorId,
            materiaId,
            dia,
            horaInicio,
            horaFin,
            cursoSeleccionado,
            listaAsignaciones,
            editandoId,
        });
        if (error) {
            setMensajeEstado(error);
            return;
        }

        const payload = construirPayloadAsignacion({
            profesorId,
            cursoId,
            materiaId,
            dia,
            horaInicio,
            horaFin,
        });

        setGuardando(true);
        setMensajeEstado("");
        try {
            if (editandoId) {
                await actualizarAsignacion(editandoId, payload);
                setMensajeEstado("Asignación actualizada correctamente.");
            } else {
                await crearAsignacion(payload);
                setMensajeEstado("Asignación creada correctamente.");
            }
            limpiarFormulario(true);
            await recargar({ mostrarCarga: false });
        } catch (error) {
            const mensaje = error?.response?.data?.detail
                || "Ocurrió un error al procesar la asignación.";
            setMensajeEstado(mensaje);
        } finally {
            setGuardando(false);
        }
    }, [
        cursoId,
        profesorId,
        materiaId,
        dia,
        horaInicio,
        horaFin,
        cursoSeleccionado,
        listaAsignaciones,
        editandoId,
        limpiarFormulario,
        recargar,
    ]);

    const desactivarAsignacion = useCallback(async (asignacion) => {
        const ok = window.confirm(
            "¿Desactivar esta asignación? No se borrarán planes de clase, notas, asistencia ni boletines históricos.",
        );
        if (!ok) return;

        setGuardando(true);
        setMensajeEstado("");
        try {
            await desactivarAsignacionApi(asignacion.id);
            if (editandoId === asignacion.id) limpiarFormulario(true);
            setMensajeEstado("Asignación desactivada correctamente.");
            await recargar({ mostrarCarga: false });
        } catch (error) {
            const mensaje = error?.response?.data?.detail
                || "No se pudo desactivar la asignación.";
            setMensajeEstado(mensaje);
        } finally {
            setGuardando(false);
        }
    }, [editandoId, limpiarFormulario, recargar]);

    return {
        cursoId,
        profesorId,
        materiaId,
        dia,
        horaInicio,
        horaFin,
        editandoId,
        guardando,
        mensajeEstado,
        cursoSeleccionado,
        asignacionesCurso,
        seleccionarCurso,
        actualizarCampo,
        iniciarEdicion,
        cancelarEdicion,
        guardarAsignacion,
        desactivarAsignacion,
    };
}
