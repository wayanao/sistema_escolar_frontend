import { useState } from "react";
import Swal from "sweetalert2";
import { actualizarConfiguracionTipoPago } from "../../services/carteraTiposPagoApi";
import { esAvisoAnioCerrado } from "../../utils/anioLectivo";
import {
    CONFIG_DEFAULT,
    crearConfiguracionDesdeDetalle,
    crearPayloadConfiguracion,
    esRangoMesesValido,
} from "../../utils/carteraTiposPago/tiposPago";

export default function useConfiguracionTipoPago({
    selectedTipoId,
    detalle,
    cargarTiposPagos,
    actualizarDetalle,
}) {
    const [config, setConfig] = useState(CONFIG_DEFAULT);
    const [guardandoConfig, setGuardandoConfig] = useState(false);

    const inicializarConfiguracion = (data) => {
        setConfig(crearConfiguracionDesdeDetalle(data));
    };

    const handleConfigChange = (field, value) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
    };

    const guardarConfiguracion = async () => {
        if (!selectedTipoId) return;
        if (!esRangoMesesValido(config)) {
            Swal.fire(
                "Configuración inválida",
                "El mes final no puede ser anterior al mes inicial.",
                "warning"
            );
            return;
        }
        const estabaActivo = detalle?.activo !== false;
        const quedaraActivo = !!config.activo;
        const seDesactiva = estabaActivo && !quedaraActivo;
        const seReactiva = !estabaActivo && quedaraActivo;

        if (seDesactiva || seReactiva) {
            const result = await Swal.fire({
                title: seReactiva ? "Reactivar concepto" : "Desactivar concepto",
                html: seReactiva
                    ? "El concepto volverá a estar disponible con su configuración anterior.<br/><br/><strong>No se generarán cobros retroactivos automáticamente.</strong>"
                    : "El concepto se ocultará de la operación diaria y no generará nuevos cobros.<br/><br/><strong>Las deudas y pagos ya existentes se conservarán.</strong>",
                icon: seReactiva ? "info" : "warning",
                showCancelButton: true,
                confirmButtonText: seReactiva ? "Reactivar" : "Desactivar",
                cancelButtonText: "Cancelar",
            });
            if (!result.isConfirmed) return;
        }

        setGuardandoConfig(true);
        try {
            const payload = crearPayloadConfiguracion(config);
            await actualizarConfiguracionTipoPago(selectedTipoId, payload);
            actualizarDetalle(payload);
            Swal.fire(
                "Guardado",
                seReactiva
                    ? "Concepto reactivado. Queda disponible sin generar cobros retroactivos."
                    : seDesactiva
                        ? "Concepto desactivado. Las deudas existentes siguen pendientes."
                        : "Configuración actualizada",
                "success"
            );
            await cargarTiposPagos();
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.detail;
            const status = error?.response?.status;
            if (status === 409 && esAvisoAnioCerrado(detail)) {
                // Año lectivo, paso 6.9: el año se cerró con la pantalla abierta.
                Swal.fire("Año cerrado", detail, "warning");
            } else if (status === 409) {
                Swal.fire({
                    icon: "warning",
                    title: "Migración pendiente",
                    html: `${detail}<br/><br/><code>python scripts/apply_tipos_pagos_avanzado_migration.py</code>`,
                });
            } else {
                Swal.fire("Error", detail || "No se pudo guardar la configuración", "error");
            }
        } finally {
            setGuardandoConfig(false);
        }
    };

    return {
        config,
        guardandoConfig,
        inicializarConfiguracion,
        handleConfigChange,
        guardarConfiguracion,
    };
}
