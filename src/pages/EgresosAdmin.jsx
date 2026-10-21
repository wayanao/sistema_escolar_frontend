import React, { useEffect, useRef } from "react";
import FormularioEgreso from "../components/nominaEgresosPrestamos/FormularioEgreso";
import HistorialEgresos from "../components/nominaEgresosPrestamos/HistorialEgresos";
import useEgresos from "../hooks/nominaEgresosPrestamos/useEgresos";
import useFormularioEgreso from "../hooks/nominaEgresosPrestamos/useFormularioEgreso";

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

const EgresosAdmin = () => {
  const formularioRef = useRef(null);
  const tituloFormularioRef = useRef(null);
  const historialRef = useRef(null);

  const {
    egresos,
    total,
    loading,
    actualizando,
    error,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    buscarPorFechas,
    filtrarHoy,
    recargarRangoVigente,
    mostrarRangoDeUnDia,
  } = useEgresos();

  const {
    formulario,
    egresoEditando,
    guardando,
    egresoResaltadoId,
    egresoPorMostrar,
    cambiarCampo,
    limpiarFormulario,
    editarEgreso,
    guardarEgreso,
  } = useFormularioEgreso({
    recargarRangoVigente,
    mostrarRangoDeUnDia,
    irAlHistorial: () => llevarALaVista(historialRef.current, "start"),
  });

  // Editar sube al formulario y le pasa el foco a su título, sin abrir el
  // teclado del celular (el título no es un campo).
  const editar = (egreso) => {
    if (!editarEgreso(egreso)) return;
    llevarALaVista(formularioRef.current, "start");
    tituloFormularioRef.current?.focus({ preventScroll: true });
  };

  // Después de guardar: baja hasta la fila guardada, que ya está en la tabla.
  // Si ya se ve, no mueve nada.
  useEffect(() => {
    if (!egresoPorMostrar) return;
    const fila = historialRef.current?.querySelector(
      `[data-egreso-id="${egresoPorMostrar.id}"]`
    );
    llevarALaVista(fila, "nearest");
  }, [egresoPorMostrar]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Control de Egresos y Gastos</h1>

      {error && (
        <div role="alert" className="text-red-500 mb-4 flex flex-wrap items-center gap-3">
          <p>{error}</p>
          <button
            type="button"
            onClick={recargarRangoVigente}
            disabled={loading || actualizando}
            className="rounded border border-red-300 bg-white px-3 py-1 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
          >
            Reintentar
          </button>
        </div>
      )}

      <div ref={formularioRef} className="scroll-mt-4">
        <FormularioEgreso
          formulario={formulario}
          editando={Boolean(egresoEditando)}
          guardando={guardando}
          tituloRef={tituloFormularioRef}
          onCambiarCampo={cambiarCampo}
          onEnviar={guardarEgreso}
          onCancelarEdicion={limpiarFormulario}
        />
      </div>

      <div ref={historialRef} className="scroll-mt-4">
        <HistorialEgresos
          egresos={egresos}
          cargando={loading}
          total={total}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          actualizando={actualizando}
          editandoId={egresoEditando?.id ?? null}
          resaltadoId={egresoResaltadoId}
          bloqueado={guardando}
          onCambiarDesde={setFechaDesde}
          onCambiarHasta={setFechaHasta}
          onBuscar={buscarPorFechas}
          onFiltrarHoy={filtrarHoy}
          onEditar={editar}
        />
      </div>
    </div>
  );
};

export default EgresosAdmin;
