import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import {
    actualizarEstadoTenant,
    obtenerAuditoriaEstadoTenant,
} from "../../services/dashboardsApi";
import {
    construirPayloadEstado,
    estadoManualDe,
    htmlHistorialTenant,
    requiereMotivoDeEstado,
    textoConfirmacionEstado,
    validarMotivoEstado,
} from "../../utils/dashboards/superAdmin";

// Cambio de estado de un colegio y consulta de su auditoría. Las dos acciones
// giran alrededor del mismo dato, así que comparten hook.
const useEstadoTenant = (reemplazarTenant) => {
    const [savingId, setSavingId] = useState(null);

    const cambiarEstado = useCallback(
        async (tenant, estado) => {
            // Se compara contra el estado manual, no contra el calculado.
            if (estadoManualDe(tenant) === estado) return;

            const requiereMotivo = requiereMotivoDeEstado(estado);
            const result = await Swal.fire({
                icon: requiereMotivo ? "warning" : "question",
                title: `Cambiar a ${estado}`,
                text: textoConfirmacionEstado(tenant, estado),
                input: "textarea",
                inputLabel: requiereMotivo ? "Motivo obligatorio" : "Motivo opcional",
                inputPlaceholder: "Ej. Pago vencido, pago confirmado, solicitud del cliente...",
                inputAttributes: {
                    "aria-label": "Motivo del cambio de estado",
                },
                showCancelButton: true,
                confirmButtonText: "Guardar cambio",
                cancelButtonText: "Cancelar",
                confirmButtonColor: requiereMotivo ? "#dc2626" : "#059669",
                inputValidator: (value) => validarMotivoEstado(estado, value),
            });

            if (!result.isConfirmed) return;

            setSavingId(tenant.id);
            try {
                const actualizado = await actualizarEstadoTenant(
                    tenant.id,
                    construirPayloadEstado(estado, result.value),
                );
                reemplazarTenant(tenant.id, actualizado);
                Swal.fire({
                    icon: "success",
                    title: "Estado actualizado",
                    text: `${tenant.nombre} quedó en ${estado}.`,
                    timer: 1400,
                    showConfirmButton: false,
                });
            } catch (err) {
                console.error("Error actualizando tenant", err);
                Swal.fire({
                    icon: "error",
                    title: "No se pudo actualizar",
                    text: "Revisa tu sesión o intenta nuevamente.",
                });
            } finally {
                setSavingId(null);
            }
        },
        [reemplazarTenant],
    );

    const verHistorial = useCallback(async (tenant) => {
        try {
            const history = (await obtenerAuditoriaEstadoTenant(tenant.id)) || [];

            if (history.length === 0) {
                Swal.fire({
                    icon: "info",
                    title: "Sin historial",
                    text: `${tenant.nombre} todavía no tiene cambios de estado registrados.`,
                });
                return;
            }

            Swal.fire({
                title: `Historial de ${tenant.nombre}`,
                width: 820,
                html: htmlHistorialTenant(history),
                confirmButtonText: "Cerrar",
            });
        } catch (err) {
            console.error("Error cargando historial", err);
            Swal.fire({
                icon: "error",
                title: "No se pudo cargar",
                text: "Intenta nuevamente.",
            });
        }
    }, []);

    return { savingId, cambiarEstado, verHistorial };
};

export default useEstadoTenant;
