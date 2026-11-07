import Swal from "sweetalert2";
import { anularVenta as anularVentaRemota } from "../../services/inventarioVentasApi";
import { mostrarExito } from "../ventanaExito";
import {
    construirPayloadAnulacion,
    mensajeErrorAnulacion,
    MOTIVO_ANULACION_MAX,
    puedeAnularVenta,
    validarMotivoAnulacion,
} from "../../utils/inventarioVentas/ventas";

const useAnulacionVenta = (cargarDatos) => {
    const anularVenta = async (venta) => {
        if (!puedeAnularVenta(venta)) return;

        const result = await Swal.fire({
            title: `Anular venta #${venta.id}`,
            text: "La venta quedará como anulada, se devolverá el stock y se anularán los pagos asociados.",
            input: "textarea",
            inputLabel: "Motivo de anulación",
            inputPlaceholder: "Ej: Error en productos cargados",
            inputAttributes: {
                maxlength: MOTIVO_ANULACION_MAX,
            },
            showCancelButton: true,
            confirmButtonText: "Anular venta",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#dc2626",
            inputValidator: validarMotivoAnulacion,
        });

        if (!result.isConfirmed) return;

        try {
            await anularVentaRemota(venta.id, construirPayloadAnulacion(result.value));
            mostrarExito({
                title: "Venta anulada",
                text: "El stock, la cartera y los pagos asociados fueron actualizados.",
            });
            cargarDatos();
        } catch (error) {
            console.error("Error anulando venta:", error);
            Swal.fire("Error", mensajeErrorAnulacion(error), "error");
        }
    };

    return { anularVenta };
};

export default useAnulacionVenta;
