import { useState } from "react";
import {
    actualizarCurso,
    cambiarEstadoCurso,
    crearCurso,
} from "../../services/cursosApi";
import {
    aplicarEstadoCurso,
    construirPayloadCurso,
    DIRECTOR_GRUPO_SIN_DEFINIR,
    JORNADA_CURSO_INICIAL,
    NIVEL_CURSO_SIN_DEFINIR,
    obtenerMensajeErrorCurso,
} from "../../utils/administracionAcademica/cursos";

const FORMULARIO_INICIAL = {
    nombre: "",
    jornada: JORNADA_CURSO_INICIAL,
    estado: "activo",
    nivel: NIVEL_CURSO_SIN_DEFINIR,
    director_grupo_id: DIRECTOR_GRUPO_SIN_DEFINIR,
};

export default function useComandosCursos({
    estadoFiltro,
    recargar,
    setCursos,
}) {
    const [editId, setEditId] = useState(null);
    const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);

    const actualizarCampo = (campo, valor) => {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
    };

    const limpiarFormulario = () => {
        setEditId(null);
        setFormulario(FORMULARIO_INICIAL);
    };

    const guardarCurso = async () => {
        const { nombre, jornada, estado, nivel, director_grupo_id: directorGrupoId } = formulario;
        if (!nombre) {
            window.alert("Falta nombre");
            return;
        }

        try {
            const payload = construirPayloadCurso({ nombre, jornada, estado, nivel, directorGrupoId });

            if (editId) {
                await actualizarCurso(editId, payload);
            } else {
                await crearCurso(payload);
            }

            window.alert(editId ? "Curso actualizado 🔥" : "Curso creado 🔥");
            limpiarFormulario();
            void recargar();
        } catch (error) {
            console.error(error);
            window.alert(obtenerMensajeErrorCurso(error, "No se pudo guardar el curso"));
        }
    };

    const iniciarEdicion = (curso) => {
        setEditId(curso.id);
        setFormulario({
            nombre: curso.nombre,
            jornada: curso.jornada || JORNADA_CURSO_INICIAL,
            estado: curso.estado || "activo",
            nivel: curso.nivel || NIVEL_CURSO_SIN_DEFINIR,
            director_grupo_id: curso.director_grupo_id || DIRECTOR_GRUPO_SIN_DEFINIR,
        });
    };

    const cambiarEstado = async (curso, nuevoEstado) => {
        const estadoActual = curso.estado || "activo";
        if (nuevoEstado === estadoActual) return;

        const accion = nuevoEstado === "activo" ? "reactivar" : "desactivar";
        if (!window.confirm(`¿Deseas ${accion} el curso ${curso.nombre}?`)) {
            return;
        }

        try {
            const data = await cambiarEstadoCurso(curso.id, nuevoEstado);
            const estadoActualizado = data?.estado || nuevoEstado;

            setCursos((actuales) =>
                aplicarEstadoCurso(
                    actuales,
                    curso.id,
                    estadoActualizado,
                    estadoFiltro,
                )
            );

            if (editId === curso.id) {
                actualizarCampo("estado", estadoActualizado);
            }
        } catch (error) {
            console.error("Error cambiando estado del curso:", error);
            window.alert("No se pudo cambiar el estado del curso");
        }
    };

    return {
        ...formulario,
        editId,
        actualizarCampo,
        guardarCurso,
        iniciarEdicion,
        cancelarEdicion: limpiarFormulario,
        cambiarEstado,
    };
}
