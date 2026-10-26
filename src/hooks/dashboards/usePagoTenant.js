import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import { registrarPagoTenant } from "../../services/dashboardsApi";
import {
    construirPayloadPago,
    fechaIsoDeHoy,
    htmlFormularioPago,
    mensajeErrorPago,
    sugerirProximoPago,
    textoPagoRegistrado,
    validarFechaPago,
} from "../../utils/dashboards/superAdmin";

// Registrar el pago de un colegio mueve su fecha de próximo pago, que es lo que
// lo reactiva. Los campos los pinta SweetAlert, así que se leen del DOM.
const usePagoTenant = (reemplazarTenant) => {
    const [pagandoId, setPagandoId] = useState(null);

    const registrarPago = useCallback(
        async (tenant) => {
            const hoy = fechaIsoDeHoy(new Date());
            const result = await Swal.fire({
                // Texto plano: el nombre del colegio no se interpreta como HTML.
                titleText: `Registrar pago de ${tenant.nombre}`,
                html: htmlFormularioPago(
                    tenant,
                    sugerirProximoPago(tenant.fecha_proximo_pago, hoy),
                ),
                showCancelButton: true,
                confirmButtonText: "Registrar pago",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#059669",
                preConfirm: () => {
                    const fecha = document.getElementById("pago-fecha-proximo")?.value;
                    const mensaje = validarFechaPago(fecha, hoy);
                    if (mensaje) {
                        Swal.showValidationMessage(mensaje);
                        return false;
                    }
                    return construirPayloadPago(
                        fecha,
                        document.getElementById("pago-nota")?.value,
                    );
                },
            });

            if (!result.isConfirmed) return;

            setPagandoId(tenant.id);
            try {
                const actualizado = await registrarPagoTenant(tenant.id, result.value);
                reemplazarTenant(tenant.id, actualizado);
                Swal.fire({
                    icon: actualizado.estado === "activo" ? "success" : "warning",
                    title: "Pago registrado",
                    text: textoPagoRegistrado(actualizado),
                });
            } catch (err) {
                console.error("Error registrando pago", err);
                Swal.fire({
                    icon: "error",
                    title: "No se pudo registrar el pago",
                    text: mensajeErrorPago(err),
                });
            } finally {
                setPagandoId(null);
            }
        },
        [reemplazarTenant],
    );

    return { pagandoId, registrarPago };
};

export default usePagoTenant;
