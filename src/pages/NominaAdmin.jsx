import React, { useRef } from "react";
import EstadoCuentaPersonal from "../components/nominaEgresosPrestamos/EstadoCuentaPersonal";
import HistorialNomina from "../components/nominaEgresosPrestamos/HistorialNomina";
import ModalPagoNomina from "../components/nominaEgresosPrestamos/ModalPagoNomina";
import useConsultasNomina from "../hooks/nominaEgresosPrestamos/useConsultasNomina";
import usePagoNomina from "../hooks/nominaEgresosPrestamos/usePagoNomina";

// Lleva la pantalla hasta una sección: suave, salvo que el sistema pida menos
// movimiento (igual que Pagos).
function bajarHasta(seccion) {
    if (!seccion) return;
    const reducirMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    seccion.scrollIntoView?.({
        behavior: reducirMovimiento ? "auto" : "smooth",
        block: "start",
    });
}

const NominaAdmin = () => {
    const historialRef = useRef(null);

    const {
        empleados,
        historialMostrado,
        hayBusqueda,
        searchHistorial,
        setSearchHistorial,
        mostrarHistorialDe,
        loading,
        actualizando,
        error,
        cargarDatos,
    } = useConsultasNomina();

    // Cuando no se sabe si un pago quedó: buscar a la persona en el historial y
    // bajar hasta él, para revisarlo antes de reintentar.
    const revisarHistorialDe = (empleado) => {
        mostrarHistorialDe(empleado);
        bajarHasta(historialRef.current);
    };

    const {
        modalAbierto,
        empleadoSeleccionado,
        formulario,
        totalNeto,
        problemas,
        registrando,
        pagosRegistrados,
        ultimoPagadoId,
        abrirPago,
        cerrarPago,
        cambiarCampo,
        registrarPago,
    } = usePagoNomina({ cargarDatos, revisarHistorialDe });

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Nómina</h1>
            {error && (
                <div
                    role="alert"
                    className="text-red-600 mb-4 bg-red-50 p-2 rounded flex flex-wrap items-center justify-between gap-2"
                >
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={cargarDatos}
                        disabled={loading || actualizando}
                        className="rounded border border-red-300 bg-white px-3 py-1 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-50"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            <EstadoCuentaPersonal
                empleados={empleados}
                cargando={loading}
                actualizando={actualizando}
                pagosRegistrados={pagosRegistrados}
                ultimoPagadoId={ultimoPagadoId}
                onPagar={abrirPago}
            />

            <div ref={historialRef} className="scroll-mt-4">
                <HistorialNomina
                    pagos={historialMostrado}
                    cargando={loading}
                    hayBusqueda={hayBusqueda}
                    busqueda={searchHistorial}
                    onCambiarBusqueda={setSearchHistorial}
                />
            </div>

            {modalAbierto && empleadoSeleccionado && (
                <ModalPagoNomina
                    empleado={empleadoSeleccionado}
                    formulario={formulario}
                    totalNeto={totalNeto}
                    problemas={problemas}
                    registrando={registrando}
                    onCambiarCampo={cambiarCampo}
                    onCerrar={cerrarPago}
                    onEnviar={registrarPago}
                />
            )}
        </div>
    );
};

export default NominaAdmin;
