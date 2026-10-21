import { useEffect, useRef } from "react";
import VistaAdministrarTiposPago from "../components/carteraTiposPago/VistaAdministrarTiposPago";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useAsignacionCursosTipoPago from "../hooks/carteraTiposPago/useAsignacionCursosTipoPago";
import useConfiguracionTipoPago from "../hooks/carteraTiposPago/useConfiguracionTipoPago";
import useConsultasTiposPago from "../hooks/carteraTiposPago/useConsultasTiposPago";
import useFormularioTipoPago from "../hooks/carteraTiposPago/useFormularioTipoPago";
import usePanelConfiguracion from "../hooks/carteraTiposPago/usePanelConfiguracion";
import { ESTADO_PREPARACION } from "../utils/anioLectivo";

// Lleva la pantalla hasta un elemento: suave, salvo que el sistema pida menos
// movimiento (igual que Pagos, Nómina, Préstamos y Egresos).
function llevarALaVista(elemento, bloque) {
    if (!elemento) return;
    const reducirMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    elemento.scrollIntoView?.({
        behavior: reducirMovimiento ? "auto" : "smooth",
        block: bloque,
    });
}

function TiposPagosAdmin() {
    const { anioSeleccionado, parametros, permisos } = useAnioLectivo();
    const esPreparacion = anioSeleccionado?.estado === ESTADO_PREPARACION;
    const puedeCrear = permisos.esAnioActivo || esPreparacion;
    const { puedeEditar } = permisos;
    const formularioRef = useRef(null);
    const tituloFormularioRef = useRef(null);
    const listaRef = useRef(null);
    const panelRef = useRef(null);

    const consultas = useConsultasTiposPago({ parametrosAnio: parametros });
    const formulario = useFormularioTipoPago({
        cargarTiposPagos: consultas.cargarTiposPagos,
        anioLectivoIdCreacion: esPreparacion ? anioSeleccionado.id : null,
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
    const panel = usePanelConfiguracion({ consultas, configuracion, asignacion });

    // ✏️ sube al formulario y le pasa el foco a su título, sin abrir el
    // teclado del celular (el título no es un campo).
    const editarConcepto = (tipo) => {
        formulario.handleEdit(tipo);
        llevarALaVista(formularioRef.current, "start");
        tituloFormularioRef.current?.focus({ preventScroll: true });
    };

    // ⚙️ Configurar: el panel aparece debajo de la lista; se baja hasta él.
    useEffect(() => {
        if (panel.panelPorMostrar) llevarALaVista(panelRef.current, "start");
    }, [panel.panelPorMostrar]);

    // Después de guardar un concepto: baja hasta su fila si no se ve.
    useEffect(() => {
        if (!formulario.conceptoPorMostrar) return;
        const fila = listaRef.current?.querySelector(
            `[data-concepto-id="${formulario.conceptoPorMostrar.id}"]`
        );
        llevarALaVista(fila, "nearest");
    }, [formulario.conceptoPorMostrar]);

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
            <div ref={listaRef} className="grid grid-cols-1 gap-6">
                <VistaAdministrarTiposPago
                    {...consultas}
                    {...formulario}
                    {...configuracion}
                    {...asignacion}
                    puedeCrear={puedeCrear}
                    puedeEditar={puedeEditar}
                    seleccionarTipoParaConfigurar={panel.configurar}
                    cerrarDetalle={panel.cerrar}
                    handleEdit={editarConcepto}
                    onReintentarConceptos={consultas.cargarTiposPagos}
                    onReintentarCursos={consultas.cargarCursos}
                    formularioRef={formularioRef}
                    tituloFormularioRef={tituloFormularioRef}
                    panelRef={panelRef}
                />
            </div>
        </div>
    );
}

export default TiposPagosAdmin;
