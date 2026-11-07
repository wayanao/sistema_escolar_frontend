import { useState } from "react";
import Swal from "sweetalert2";
import {
    actualizarEstadoProductoInventario,
    actualizarProductoInventario,
    crearProductoInventario,
} from "../../services/inventarioVentasApi";
import { mostrarExito } from "../ventanaExito";
import {
    accionCambioEstado,
    construirPayloadProducto,
    esRespuestaExitosa,
    estadoDeProducto,
    estadoLabel,
    formularioDesdeProducto,
    formularioProductoCompleto,
    FORMULARIO_PRODUCTO_INICIAL,
} from "../../utils/inventarioVentas/inventario";

const useFormularioProducto = ({ cargarInventario, aplicarEstadoLocal }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(FORMULARIO_PRODUCTO_INICIAL);

    const cambiarCampoFormulario = (campo, valor) => {
        setFormData((actual) => ({ ...actual, [campo]: valor }));
    };

    const limpiarFormulario = () => {
        setFormData(FORMULARIO_PRODUCTO_INICIAL);
        setShowForm(false);
        setEditingId(null);
    };

    const alternarFormulario = () => {
        setShowForm(!showForm);
        if (showForm) {
            limpiarFormulario();
        }
    };

    const editarProducto = (prod) => {
        setFormData(formularioDesdeProducto(prod));
        setEditingId(prod.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formularioProductoCompleto(formData)) {
            Swal.fire("Atención", "Todos los campos son obligatorios", "warning");
            return;
        }

        try {
            const isEditing = editingId !== null;

            const payload = construirPayloadProducto(formData);

            const res = isEditing
                ? await actualizarProductoInventario(editingId, payload)
                : await crearProductoInventario(payload);

            if (esRespuestaExitosa(res.status)) {
                mostrarExito({ title: "Éxito", text: isEditing ? "Producto actualizado" : "Producto creado" });
                limpiarFormulario();
                cargarInventario();
            } else {
                Swal.fire("Error", "Ocurrió un error", "error");
            }
        } catch (error) {
            console.error("Error:", error);
            Swal.fire("Error", "No se pudo guardar", "error");
        }
    };

    const cambiarEstadoProducto = async (producto, nuevoEstado) => {
        const estadoActual = estadoDeProducto(producto);
        if (nuevoEstado === estadoActual) return;

        const accion = accionCambioEstado(nuevoEstado);
        const result = await Swal.fire({
            title: `¿Deseas ${accion} este producto?`,
            text: "No se borrará el historial de ventas.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: `Sí, ${accion}`,
            cancelButtonText: "Cancelar"
        });

        if (result.isConfirmed) {
            try {
                const res = await actualizarEstadoProductoInventario(producto.id, nuevoEstado);
                if (esRespuestaExitosa(res.status)) {
                    const estadoActualizado = res.data?.estado || nuevoEstado;
                    aplicarEstadoLocal(producto.id, estadoActualizado);
                    if (editingId === producto.id) {
                        setFormData((actual) => ({ ...actual, estado: estadoActualizado }));
                    }
                    mostrarExito({
                        title: "Listo",
                        text: `Producto ${estadoLabel(estadoActualizado).toLowerCase()}`,
                    });
                }
            } catch {
                Swal.fire("Error", "No se pudo cambiar el estado del producto", "error");
            }
        }
    };

    return {
        showForm,
        editingId,
        formData,
        cambiarCampoFormulario,
        alternarFormulario,
        editarProducto,
        handleSubmit,
        cambiarEstadoProducto,
    };
};

export default useFormularioProducto;
