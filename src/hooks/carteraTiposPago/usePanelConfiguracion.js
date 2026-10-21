import { useState } from "react";
import Swal from "sweetalert2";

// Abre y cierra el panel de configuración de un concepto sin perder cambios
// sin aviso: si la configuración o los cursos tienen algo sin guardar,
// pregunta antes. Recibe lo que devuelven los hooks de consultas,
// configuración y asignación de cursos.
export default function usePanelConfiguracion({ consultas, configuracion, asignacion }) {
    // Pedido de llevar el panel a la vista: { id, vez }. Si hubo que
    // preguntar, llega cuando la ventana terminó de cerrarse (al cerrar,
    // SweetAlert devuelve la pantalla a donde estaba).
    const [panelPorMostrar, setPanelPorMostrar] = useState(null);

    const hayCambiosSinGuardar =
        Boolean(consultas.selectedTipoId) &&
        Boolean(configuracion.configSinGuardar || asignacion.cursosAsignadosDirty);

    // Devuelve { seguir, cerrada }: `cerrada` se cumple cuando la ventana
    // terminó de cerrarse, o al instante si no hizo falta preguntar.
    const confirmarDescarte = async () => {
        if (!hayCambiosSinGuardar) return { seguir: true, cerrada: Promise.resolve() };

        let avisarCierre;
        const cerrada = new Promise((resolve) => {
            avisarCierre = resolve;
        });
        const respuesta = await Swal.fire({
            icon: "warning",
            title: "Hay cambios sin guardar",
            text: `Los cambios de «${consultas.detalle?.nombre ?? "este concepto"}» que no guardaste se van a perder.`,
            showCancelButton: true,
            confirmButtonText: "Descartar cambios",
            cancelButtonText: "Seguir editando",
            confirmButtonColor: "#dc2626",
            didClose: () => avisarCierre(),
        });
        return { seguir: Boolean(respuesta?.isConfirmed), cerrada };
    };

    const configurar = async (tipo) => {
        const { seguir, cerrada } = await confirmarDescarte();
        if (!seguir) return;

        const seleccion = consultas.seleccionarTipo(tipo);
        cerrada.then(() =>
            setPanelPorMostrar((anterior) => ({ id: tipo.id, vez: (anterior?.vez ?? 0) + 1 }))
        );
        try {
            const data = await seleccion;
            configuracion.inicializarConfiguracion(data);
            asignacion.inicializarAsignacion(data);
        } catch (error) {
            // Sin su detalle, el panel mostraría la configuración y los cursos
            // del concepto anterior, y guardar los aplicaría a este: se cierra.
            console.error(error);
            consultas.cerrarDetalle();
            Swal.fire({
                icon: "error",
                title: `No se pudo abrir «${tipo.nombre}»`,
                text: "No se pudo cargar su configuración. Revisa la conexión e inténtalo de nuevo.",
            });
        }
    };

    const cerrar = async () => {
        const { seguir } = await confirmarDescarte();
        if (seguir) consultas.cerrarDetalle();
    };

    return { configurar, cerrar, hayCambiosSinGuardar, panelPorMostrar };
}
