import Swal from "sweetalert2";
import VistaAdministrarTiposPago from "../components/carteraTiposPago/VistaAdministrarTiposPago";
import useAsignacionCursosTipoPago from "../hooks/carteraTiposPago/useAsignacionCursosTipoPago";
import useConfiguracionTipoPago from "../hooks/carteraTiposPago/useConfiguracionTipoPago";
import useConsultasTiposPago from "../hooks/carteraTiposPago/useConsultasTiposPago";
import useFormularioTipoPago from "../hooks/carteraTiposPago/useFormularioTipoPago";

function TiposPagosAdmin() {
    const consultas = useConsultasTiposPago();
    const formulario = useFormularioTipoPago({
        cargarTiposPagos: consultas.cargarTiposPagos,
    });
    const configuracion = useConfiguracionTipoPago({
        selectedTipoId: consultas.selectedTipoId,
        detalle: consultas.detalle,
        cargarTiposPagos: consultas.cargarTiposPagos,
        actualizarDetalle: consultas.actualizarDetalle,
    });
    const asignacion = useAsignacionCursosTipoPago({
        selectedTipoId: consultas.selectedTipoId,
        detalle: consultas.detalle,
        cursos: consultas.cursos,
        cargarTiposPagos: consultas.cargarTiposPagos,
    });

    const seleccionarTipoParaConfigurar = async (tipo) => {
        try {
            const data = await consultas.seleccionarTipo(tipo);
            configuracion.inicializarConfiguracion(data);
            asignacion.inicializarAsignacion(data);
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo cargar el detalle del tipo de pago", "error");
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    ⚙️ Tipos de Pago y Cobros Administrativos
                </h1>
                <p className="text-gray-600">
                    Administra los conceptos de recaudo para la institución (ej: Certificados, Derechos de Grado, Matrícula).
                </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <VistaAdministrarTiposPago
                    {...consultas}
                    {...formulario}
                    {...configuracion}
                    {...asignacion}
                    seleccionarTipoParaConfigurar={seleccionarTipoParaConfigurar}
                />
            </div>
        </div>
    );
}

export default TiposPagosAdmin;
