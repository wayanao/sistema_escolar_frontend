import React from "react";
import EstadoCuentaPersonal from "../components/nominaEgresosPrestamos/EstadoCuentaPersonal";
import HistorialNomina from "../components/nominaEgresosPrestamos/HistorialNomina";
import ModalPagoNomina from "../components/nominaEgresosPrestamos/ModalPagoNomina";
import useConsultasNomina from "../hooks/nominaEgresosPrestamos/useConsultasNomina";
import usePagoNomina from "../hooks/nominaEgresosPrestamos/usePagoNomina";

const NominaAdmin = () => {
    const {
        empleados,
        historialMostrado,
        hayBusqueda,
        searchHistorial,
        setSearchHistorial,
        loading,
        error,
        cargarDatos,
    } = useConsultasNomina();

    const {
        modalAbierto,
        empleadoSeleccionado,
        formulario,
        totalNeto,
        abrirPago,
        cerrarPago,
        cambiarCampo,
        registrarPago,
    } = usePagoNomina({ cargarDatos });

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Nómina</h1>
            {error && <p className="text-red-600 mb-4 bg-red-50 p-2 rounded">{error}</p>}

            <EstadoCuentaPersonal
                empleados={empleados}
                cargando={loading}
                onPagar={abrirPago}
            />

            <HistorialNomina
                pagos={historialMostrado}
                cargando={loading}
                hayBusqueda={hayBusqueda}
                busqueda={searchHistorial}
                onCambiarBusqueda={setSearchHistorial}
            />

            {modalAbierto && empleadoSeleccionado && (
                <ModalPagoNomina
                    empleado={empleadoSeleccionado}
                    formulario={formulario}
                    totalNeto={totalNeto}
                    onCambiarCampo={cambiarCampo}
                    onCerrar={cerrarPago}
                    onEnviar={registrarPago}
                />
            )}
        </div>
    );
};

export default NominaAdmin;
