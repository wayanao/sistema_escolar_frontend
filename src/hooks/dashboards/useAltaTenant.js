import { useCallback } from "react";
import Swal from "sweetalert2";
import { crearTenant } from "../../services/dashboardsApi";
import { mostrarExito } from "../ventanaExito";
import {
    fechaIsoDeHoy,
    htmlFormularioTenant,
    mensajeErrorCrearTenant,
    normalizarPayloadTenant,
    validarTenantNuevo,
} from "../../utils/dashboards/superAdmin";

// Los campos los pinta SweetAlert, así que la lectura toca el DOM y no puede
// vivir en las utilidades puras.
const leerCamposTenant = () => ({
    nombre: document.getElementById("tenant-nombre")?.value,
    codigo: document.getElementById("tenant-codigo")?.value,
    admin_nombre: document.getElementById("tenant-admin-nombre")?.value,
    admin_email: document.getElementById("tenant-admin-email")?.value,
    admin_password: document.getElementById("tenant-admin-password")?.value,
    fecha_inicio: document.getElementById("tenant-fecha-inicio")?.value,
    fecha_proximo_pago: document.getElementById("tenant-fecha-pago")?.value,
    dias_gracia: document.getElementById("tenant-dias-gracia")?.value,
    notas: document.getElementById("tenant-notas")?.value,
});

const useAltaTenant = (agregarTenant) => {
    const crearColegio = useCallback(async () => {
        const hoy = fechaIsoDeHoy(new Date());
        const result = await Swal.fire({
            title: "Crear colegio",
            width: 720,
            html: htmlFormularioTenant(hoy),
            showCancelButton: true,
            confirmButtonText: "Crear colegio",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#059669",
            preConfirm: () => {
                const payload = normalizarPayloadTenant(leerCamposTenant());
                const mensajeInvalido = validarTenantNuevo(payload);

                if (mensajeInvalido) {
                    Swal.showValidationMessage(mensajeInvalido);
                    return false;
                }

                return payload;
            },
        });

        if (!result.isConfirmed) return;

        try {
            const creado = await crearTenant(result.value);
            agregarTenant(creado);
            mostrarExito({
                title: "Colegio creado",
                text: `${creado.nombre} ya puede iniciar sesion.`,
            });
        } catch (err) {
            console.error("Error creando colegio", err);
            Swal.fire({
                icon: "error",
                title: "No se pudo crear",
                text: mensajeErrorCrearTenant(err),
            });
        }
    }, [agregarTenant]);

    return { crearColegio };
};

export default useAltaTenant;
