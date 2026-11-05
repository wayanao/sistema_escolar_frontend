import { useRef, useState } from "react";
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
    anioLectivoIdCreacion = null,
}) {
    const [editId, setEditId] = useState(null);
    const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
    // Un solo guardado a la vez: con doble clic se creaba el mismo curso dos veces
    // (pedido del usuario, 2026-11-05). El ref frena el segundo clic aunque el
    // botón todavía no se haya desactivado; `guardando` lo desactiva y muestra
    // "Guardando...".
    const [guardando, setGuardando] = useState(false);
    const enCursoRef = useRef(false);

    const actualizarCampo = (campo, valor) => {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
    };

    const limpiarFormulario = () => {
        setEditId(null);
        setFormulario(FORMULARIO_INICIAL);
    };

    const guardarCurso = async () => {
        if (enCursoRef.current) return;
        const { nombre, jornada, estado, nivel, director_grupo_id: directorGrupoId } = formulario;
        if (!nombre) {
            window.alert("Falta nombre");
            return;
        }

        enCursoRef.current = true;
        setGuardando(true);
        try {
            const payload = construirPayloadCurso({ nombre, jornada, estado, nivel, directorGrupoId });

            if (editId) {
                await actualizarCurso(editId, payload);
            } else {
                await crearCurso(
                    anioLectivoIdCreacion
                        ? { ...payload, anio_lectivo_id: anioLectivoIdCreacion }
                        : payload
                );
            }

            window.alert(editId ? "Curso actualizado 🔥" : "Curso creado 🔥");
            limpiarFormulario();
            void recargar();
        } catch (error) {
            console.error(error);
            window.alert(obtenerMensajeErrorCurso(error, "No se pudo guardar el curso"));
        } finally {
            enCursoRef.current = false;
            setGuardando(false);
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
            // El mensaje del backend tal cual, como al guardar: por ejemplo,
            // el 409 de un año lectivo cerrado.
            window.alert(obtenerMensajeErrorCurso(error, "No se pudo cambiar el estado del curso"));
        }
    };

    return {
        ...formulario,
        editId,
        guardando,
        actualizarCampo,
        guardarCurso,
        iniciarEdicion,
        cancelarEdicion: limpiarFormulario,
        cambiarEstado,
    };
}
