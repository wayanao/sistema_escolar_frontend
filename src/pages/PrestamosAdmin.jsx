import React, { useEffect, useRef } from "react";
import FormularioPrestamo from "../components/nominaEgresosPrestamos/FormularioPrestamo";
import HistorialPrestamos from "../components/nominaEgresosPrestamos/HistorialPrestamos";
import useComandosPrestamos from "../hooks/nominaEgresosPrestamos/useComandosPrestamos";
import usePrestamos from "../hooks/nominaEgresosPrestamos/usePrestamos";

// Lleva la pantalla hasta un elemento: suave, salvo que el sistema pida menos
// movimiento (igual que Pagos y Nómina).
function llevarALaVista(elemento, bloque) {
    if (!elemento) return;
    const reducirMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    elemento.scrollIntoView?.({
        behavior: reducirMovimiento ? "auto" : "smooth",
        block: bloque,
    });
}

const PrestamosAdmin = () => {
    const historialRef = useRef(null);

    const {
        prestamos,
        totalPendiente,
        profesores,
        loadingProfesores,
        loadingPrestamos,
        actualizando,
        historialConsultado,
        error,
        profesorFiltro,
        mostrarHistorialDe,
        limpiarFiltro,
        buscarHistorial,
        recargarHistorial,
        reintentar,
    } = usePrestamos();

    const {
        formulario,
        cambiarCampo,
        crear,
        saldarPrestamo,
        registrando,
        saldandoId,
        prestamoResaltadoId,
        prestamoPorMostrar,
    } = useComandosPrestamos({
        profesores,
        mostrarHistorialDe,
        recargarHistorial,
        irAlHistorial: () => llevarALaVista(historialRef.current, "start"),
    });

    // Después de registrar: baja hasta el préstamo nuevo, que ya está en la
    // tabla. Si ya se ve, no mueve nada.
    useEffect(() => {
        if (!prestamoPorMostrar) return;
        const fila = historialRef.current?.querySelector(
            `[data-prestamo-id="${prestamoPorMostrar.id}"]`
        );
        llevarALaVista(fila, "nearest");
    }, [prestamoPorMostrar]);

    const ocupado = registrando || saldandoId !== null;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Préstamos a Profesores o Trabajadores</h1>

            {error && (
                <div role="alert" className="text-red-500 mb-4 flex flex-wrap items-center gap-3">
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={reintentar}
                        disabled={loadingProfesores || loadingPrestamos || actualizando}
                        className="rounded border border-red-300 bg-white px-3 py-1 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            <FormularioPrestamo
                formulario={formulario}
                profesores={profesores}
                cargandoProfesores={loadingProfesores}
                registrando={registrando}
                bloqueado={ocupado}
                onCambiarCampo={cambiarCampo}
                onEnviar={crear}
            />

            <div ref={historialRef} className="scroll-mt-4">
                <HistorialPrestamos
                    prestamos={prestamos}
                    profesores={profesores}
                    cargando={loadingPrestamos}
                    cargandoProfesores={loadingProfesores}
                    historialConsultado={historialConsultado}
                    total={totalPendiente}
                    profesorFiltro={profesorFiltro}
                    actualizando={actualizando}
                    saldandoId={saldandoId}
                    bloqueado={ocupado}
                    resaltadoId={prestamoResaltadoId}
                    onCambiarFiltro={mostrarHistorialDe}
                    onBuscar={buscarHistorial}
                    onLimpiar={limpiarFiltro}
                    onSaldar={saldarPrestamo}
                />
            </div>
        </div>
    );
};

export default PrestamosAdmin;
