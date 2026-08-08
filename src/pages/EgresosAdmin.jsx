import React from "react";
import FormularioEgreso from "../components/nominaEgresosPrestamos/FormularioEgreso";
import HistorialEgresos from "../components/nominaEgresosPrestamos/HistorialEgresos";
import useEgresos from "../hooks/nominaEgresosPrestamos/useEgresos";
import useFormularioEgreso from "../hooks/nominaEgresosPrestamos/useFormularioEgreso";

const EgresosAdmin = () => {
  const {
    egresos,
    total,
    loading,
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
    cambiarCampo,
    limpiarFormulario,
    editarEgreso,
    guardarEgreso,
  } = useFormularioEgreso({ recargarRangoVigente, mostrarRangoDeUnDia });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Control de Egresos y Gastos</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <FormularioEgreso
        formulario={formulario}
        editando={Boolean(egresoEditando)}
        onCambiarCampo={cambiarCampo}
        onEnviar={guardarEgreso}
        onCancelarEdicion={limpiarFormulario}
      />

      <HistorialEgresos
        egresos={egresos}
        cargando={loading}
        total={total}
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        onCambiarDesde={setFechaDesde}
        onCambiarHasta={setFechaHasta}
        onBuscar={buscarPorFechas}
        onFiltrarHoy={filtrarHoy}
        onEditar={editarEgreso}
      />
    </div>
  );
};

export default EgresosAdmin;
