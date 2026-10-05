import { useState } from "react";
import {
    actualizarMateria,
    cambiarEstadoMateria,
    crearMateria,
} from "../../services/materiasApi";
import {
    aplicarEstadoMateria,
    construirPayloadMateria,
    obtenerAvisoMateriaUsadaEnOtroAnio,
    obtenerMensajeErrorMateria,
} from "../../utils/administracionAcademica/materias";

const FORMULARIO_INICIAL = {
    nombre: "",
    estado: "activo",
};

export default function useComandosMaterias({
    estadoFiltro,
    recargar,
    setMaterias,
}) {
    const [editId, setEditId] = useState(null);
    const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
    const [cambioNombrePendiente, setCambioNombrePendiente] = useState(null);

    const actualizarCampo = (campo, valor) => {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
    };

    const limpiarFormulario = () => {
        setEditId(null);
        setFormulario(FORMULARIO_INICIAL);
        setCambioNombrePendiente(null);
    };

    const completarGuardado = (mensaje) => {
        window.alert(mensaje);
        limpiarFormulario();
        void recargar();
    };

    const guardarMateria = async () => {
        const { nombre, estado } = formulario;
        if (!nombre) {
            window.alert("Falta nombre");
            return;
        }

        const payload = construirPayloadMateria({ nombre, estado });

        try {
            if (editId) {
                await actualizarMateria(editId, payload);
            } else {
                await crearMateria(payload);
            }

            completarGuardado(editId ? "Materia actualizada 🔥" : "Materia creada 🔥");
        } catch (error) {
            const aviso = editId
                ? obtenerAvisoMateriaUsadaEnOtroAnio(error)
                : null;
            if (aviso) {
                setCambioNombrePendiente({
                    materiaId: editId,
                    payload,
                    mensaje: aviso.mensaje,
                });
                return;
            }

            console.error(error);
            window.alert(obtenerMensajeErrorMateria(error, "No se pudo guardar la materia"));
        }
    };

    const confirmarCambioNombre = async () => {
        if (!cambioNombrePendiente) return;

        const { materiaId, payload } = cambioNombrePendiente;
        try {
            await actualizarMateria(materiaId, {
                ...payload,
                confirmar_cambio_nombre: true,
            });
            completarGuardado("Materia actualizada 🔥");
        } catch (error) {
            console.error(error);
            window.alert(obtenerMensajeErrorMateria(error, "No se pudo guardar la materia"));
        }
    };

    const crearMateriaNuevaDesdeAviso = () => {
        if (!cambioNombrePendiente) return;

        setEditId(null);
        setFormulario(cambioNombrePendiente.payload);
        setCambioNombrePendiente(null);
    };

    const iniciarEdicion = (materia) => {
        setCambioNombrePendiente(null);
        setEditId(materia.id);
        setFormulario({
            nombre: materia.nombre,
            estado: materia.estado || "activo",
        });
    };

    const cambiarEstado = async (materia, nuevoEstado) => {
        const estadoActual = materia.estado || "activo";
        if (nuevoEstado === estadoActual) return;

        const accion = nuevoEstado === "activo" ? "reactivar" : "desactivar";
        if (!window.confirm(`¿Deseas ${accion} la materia ${materia.nombre}?`)) {
            return;
        }

        try {
            const data = await cambiarEstadoMateria(materia.id, nuevoEstado);
            const estadoActualizado = data?.estado || nuevoEstado;

            setMaterias((actuales) =>
                aplicarEstadoMateria(
                    actuales,
                    materia.id,
                    estadoActualizado,
                    estadoFiltro,
                )
            );

            if (editId === materia.id) {
                actualizarCampo("estado", estadoActualizado);
            }
        } catch (error) {
            console.error("Error cambiando estado de la materia:", error);
            window.alert("No se pudo cambiar el estado de la materia");
        }
    };

    return {
        ...formulario,
        editId,
        avisoCambioNombre: cambioNombrePendiente
            ? { mensaje: cambioNombrePendiente.mensaje }
            : null,
        actualizarCampo,
        guardarMateria,
        confirmarCambioNombre,
        crearMateriaNuevaDesdeAviso,
        iniciarEdicion,
        cancelarEdicion: limpiarFormulario,
        cambiarEstado,
    };
}
