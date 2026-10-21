import { useRef, useState } from "react";
import Swal from "sweetalert2";
import {
    actualizarTipoPago,
    crearTipoPago,
} from "../../services/carteraTiposPagoApi";
import { esAvisoAnioCerrado } from "../../utils/anioLectivo";
import { crearPayloadTipoPago } from "../../utils/carteraTiposPago/tiposPago";

// Un concepto nuevo queda en Borrador: el aviso dice qué falta para que cobre.
const mensajeExitoConcepto = (nombre, editando) =>
    editando
        ? `«${nombre}» quedó actualizado.`
        : `«${nombre}» quedó como Borrador. Para que genere cobros, ábrelo con ⚙️ Configurar y asígnale cursos.`;

export default function useFormularioTipoPago({
    cargarTiposPagos,
    anioLectivoIdCreacion = null,
}) {
    const [nuevoTipoPago, setNuevoTipoPago] = useState("");
    const [valorTipoPago, setValorTipoPago] = useState("");
    const [editingTipoId, setEditingTipoId] = useState(null);
    const [guardandoConcepto, setGuardandoConcepto] = useState(false);
    // Fila que se pinta en verde después de guardar.
    const [conceptoResaltadoId, setConceptoResaltadoId] = useState(null);
    // Pedido de llevar esa fila a la vista: { id, vez }. Llega cuando la lista
    // ya se recargó y la ventana de aviso terminó de cerrarse (al cerrar,
    // SweetAlert devuelve la pantalla a donde estaba).
    const [conceptoPorMostrar, setConceptoPorMostrar] = useState(null);
    // Un segundo clic llega antes de que el botón se pinte bloqueado; esta
    // marca lo frena en el acto. Antes, el segundo clic avisaba «Concepto
    // duplicado» justo después de crearlo.
    const enCurso = useRef(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (enCurso.current || !nuevoTipoPago.trim()) return;

        enCurso.current = true;
        setGuardandoConcepto(true);
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
                const conceptoId = isEditing ? editingTipoId : (response.data?.id ?? null);
                let avisarCierre;
                const avisoCerrado = new Promise((resolve) => {
                    avisarCierre = resolve;
                });
                Swal.fire({
                    icon: "success",
                    title: isEditing ? "Concepto actualizado" : "Concepto creado",
                    text: mensajeExitoConcepto(payloadBase.nombre, isEditing),
                    didClose: () => avisarCierre(),
                });
                setNuevoTipoPago("");
                setValorTipoPago("");
                setEditingTipoId(null);
                setConceptoResaltadoId(conceptoId);
                const recarga = cargarTiposPagos();
                Promise.all([recarga, avisoCerrado]).then(() => {
                    if (conceptoId) {
                        setConceptoPorMostrar((anterior) => ({
                            id: conceptoId,
                            vez: (anterior?.vez ?? 0) + 1,
                        }));
                    }
                });
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
        } finally {
            enCurso.current = false;
            setGuardandoConcepto(false);
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
        guardandoConcepto,
        conceptoResaltadoId,
        conceptoPorMostrar,
        handleSubmit,
        handleEdit,
        cancelarEdicion,
    };
}
