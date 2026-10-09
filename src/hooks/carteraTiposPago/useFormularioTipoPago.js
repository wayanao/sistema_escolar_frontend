import { useState } from "react";
import Swal from "sweetalert2";
import {
    actualizarTipoPago,
    crearTipoPago,
} from "../../services/carteraTiposPagoApi";
import { esAvisoAnioCerrado } from "../../utils/anioLectivo";
import { crearPayloadTipoPago } from "../../utils/carteraTiposPago/tiposPago";

export default function useFormularioTipoPago({
    cargarTiposPagos,
    anioLectivoIdCreacion = null,
}) {
    const [nuevoTipoPago, setNuevoTipoPago] = useState("");
    const [valorTipoPago, setValorTipoPago] = useState("");
    const [editingTipoId, setEditingTipoId] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!nuevoTipoPago.trim()) return;

        try {
            const isEditing = editingTipoId !== null;
            const payloadBase = crearPayloadTipoPago(nuevoTipoPago, valorTipoPago);
            const payload = !isEditing && anioLectivoIdCreacion
                ? { ...payloadBase, anio_lectivo_id: anioLectivoIdCreacion }
                : payloadBase;
            const response = isEditing
                ? await actualizarTipoPago(editingTipoId, payload)
                : await crearTipoPago(payload);

            if (response.status >= 200 && response.status < 300) {
                Swal.fire(
                    "Éxito",
                    isEditing ? "Tipo de pago actualizado" : "Tipo de pago creado",
                    "success"
                );
                setNuevoTipoPago("");
                setValorTipoPago("");
                setEditingTipoId(null);
                cargarTiposPagos();
            } else {
                Swal.fire("Error", "Error al guardar o ya existe", "error");
            }
        } catch (error) {
            const detail = error?.response?.data?.detail;
            const status = error?.response?.status;
            if (status === 409 && esAvisoAnioCerrado(detail)) {
                // Año lectivo, paso 6.9: el año se cerró con la pantalla abierta.
                Swal.fire("Año cerrado", detail, "warning");
            } else if (status === 409) {
                Swal.fire(
                    "Concepto duplicado",
                    detail || "Ya existe un tipo de pago con ese nombre.",
                    "warning"
                );
            } else {
                Swal.fire("Error", detail || "No se pudo guardar el tipo de pago", "error");
            }
        }
    };

    const handleEdit = (tipoPago) => {
        setEditingTipoId(tipoPago.id);
        setNuevoTipoPago(tipoPago.nombre);
        setValorTipoPago(tipoPago.valor);
    };

    const cancelarEdicion = () => {
        setEditingTipoId(null);
        setNuevoTipoPago("");
        setValorTipoPago("");
    };

    return {
        nuevoTipoPago,
        setNuevoTipoPago,
        valorTipoPago,
        setValorTipoPago,
        editingTipoId,
        handleSubmit,
        handleEdit,
        cancelarEdicion,
    };
}
