import { useState } from "react";
import {
    actualizarProfesor,
    cambiarEstadoProfesor,
    crearProfesor,
} from "../../services/profesoresApi";
import {
    aplicarEstadoProfesor,
    construirPayloadProfesor,
    obtenerMensajeErrorApi,
} from "../../utils/administracionAcademica/profesores";

const FORMULARIO_INICIAL = {
    nombre: "",
    apellido: "",
    documentoIdentidad: "",
    email: "",
    telefono: "",
    password: "",
    sueldo: "",
    estado: "activo",
};

export default function useComandosProfesores({
    estadoFiltro,
    recargar,
    setProfesores,
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

    const guardarProfesor = async () => {
        const {
            nombre,
            apellido,
            documentoIdentidad,
            email,
            telefono,
            password,
            sueldo,
            estado,
        } = formulario;

        if (!nombre || !apellido || !documentoIdentidad || !email || !telefono || (!password && !editId) || !sueldo) {
            window.alert("Completa todos los campos obligatorios");
            return;
        }

        try {
            const payload = construirPayloadProfesor({
                nombre,
                apellido,
                documentoIdentidad,
                email,
                telefono,
                password,
                sueldo,
                estado,
            });

            if (editId) {
                await actualizarProfesor(editId, payload);
            } else {
                await crearProfesor(payload);
            }

            window.alert(editId ? "Profesor actualizado 🔥" : "Profesor creado 🔥");
            limpiarFormulario();
            void recargar();
        } catch (error) {
            console.error("FETCH ERROR:", error);
            window.alert(obtenerMensajeErrorApi(error, "No se pudo guardar el profesor"));
        }
    };

    const iniciarEdicion = (profesor) => {
        setEditId(profesor.id);
        setFormulario({
            nombre: profesor.nombre,
            apellido: profesor.apellido,
            documentoIdentidad: profesor.documento,
            email: profesor.email,
            telefono: profesor.telefono,
            password: "",
            sueldo: profesor.sueldo || 0,
            estado: profesor.estado || "activo",
        });
    };

    const cambiarEstado = async (profesor, nuevoEstado) => {
        const estadoActual = profesor.estado || "activo";
        if (nuevoEstado === estadoActual) return;

        const accion = nuevoEstado === "activo" ? "reactivar" : "desactivar";
        if (!window.confirm(`¿Deseas ${accion} a ${profesor.nombre} ${profesor.apellido}?`)) {
            return;
        }

        try {
            const data = await cambiarEstadoProfesor(profesor.id, nuevoEstado);
            const estadoActualizado = data?.estado || nuevoEstado;

            setProfesores((actuales) =>
                aplicarEstadoProfesor(
                    actuales,
                    profesor.id,
                    estadoActualizado,
                    estadoFiltro,
                )
            );

            if (editId === profesor.id) {
                actualizarCampo("estado", estadoActualizado);
            }
        } catch (error) {
            console.error("Error cambiando estado del profesor:", error);
            window.alert("No se pudo cambiar el estado del profesor");
        }
    };

    return {
        ...formulario,
        editId,
        actualizarCampo,
        guardarProfesor,
        iniciarEdicion,
        cancelarEdicion: limpiarFormulario,
        cambiarEstado,
    };
}
