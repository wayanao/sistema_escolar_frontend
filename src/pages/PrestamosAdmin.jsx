import React from "react";
import FormularioPrestamo from "../components/nominaEgresosPrestamos/FormularioPrestamo";
import HistorialPrestamos from "../components/nominaEgresosPrestamos/HistorialPrestamos";
import useComandosPrestamos from "../hooks/nominaEgresosPrestamos/useComandosPrestamos";
import usePrestamos from "../hooks/nominaEgresosPrestamos/usePrestamos";

const PrestamosAdmin = () => {
    const {
        prestamos,
        totalPendiente,
        profesores,
        loadingProfesores,
        loadingPrestamos,
        historialConsultado,
        error,
        profesorFiltro,
        mostrarHistorialDe,
        limpiarFiltro,
        buscarHistorial,
        recargarHistorial,
    } = usePrestamos();

    const { formulario, cambiarCampo, crear, saldarPrestamo } = useComandosPrestamos({
        profesores,
        mostrarHistorialDe,
        recargarHistorial,
    });

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Préstamos a Profesores o Trabajadores</h1>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <FormularioPrestamo
                formulario={formulario}
                profesores={profesores}
                cargandoProfesores={loadingProfesores}
                onCambiarCampo={cambiarCampo}
                onEnviar={crear}
            />

            <HistorialPrestamos
                prestamos={prestamos}
                profesores={profesores}
                cargando={loadingPrestamos}
                cargandoProfesores={loadingProfesores}
                historialConsultado={historialConsultado}
                total={totalPendiente}
                profesorFiltro={profesorFiltro}
                onCambiarFiltro={mostrarHistorialDe}
                onBuscar={buscarHistorial}
                onLimpiar={limpiarFiltro}
                onSaldar={saldarPrestamo}
            />
        </div>
    );
};

export default PrestamosAdmin;
