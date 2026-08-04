import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import ComprobantePago from "../components/pagos/ComprobantePago";
import FormularioPago from "../components/pagos/FormularioPago";
import HistorialPagos from "../components/pagos/HistorialPagos";
import ListaEstudiantesPagos from "../components/pagos/ListaEstudiantesPagos";
import ValoresPersonalizadosPago from "../components/pagos/ValoresPersonalizadosPago";
import useAnulacionPago from "../hooks/pagos/useAnulacionPago";
import useCatalogosPagos from "../hooks/pagos/useCatalogosPagos";
import useConsultasEstudiantePagos from "../hooks/pagos/useConsultasEstudiantePagos";
import useFormularioPago from "../hooks/pagos/useFormularioPago";
import useOpcionesAdelanto from "../hooks/pagos/useOpcionesAdelanto";
import useRegistroPago from "../hooks/pagos/useRegistroPago";
import useValoresPersonalizadosPago from "../hooks/pagos/useValoresPersonalizadosPago";

const notificarErrorCargaEstudiantes = () =>
  Swal.fire("Error", "Error al cargar estudiantes", "error");

function PagosAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  // Si llegamos desde Cartera Vencida / Resumen estudiante con un id preseleccionado
  const estudianteIdPreseleccionado = location.state?.estudiante_id ?? null;
  const { estudiantes, cursos, tiposPagos, loading } = useCatalogosPagos({
    alErrorEstudiantes: notificarErrorCargaEstudiantes,
  });
  const {
    pagos,
    ventasPendientes,
    deudasEstudiante,
    valoresPersonalizados,
    selectedEstudiante,
    opcionesVencidas,
    loadingOpcionesVencidas,
    errorOpcionesVencidas,
    seleccionarEstudiante,
    cargarHistorialPagos,
    cargarDeudasEstudiante,
    cargarVentasPendientes,
    cargarOpcionesVencidas,
    actualizarValoresPersonalizados,
  } = useConsultasEstudiantePagos();
  const {
    opcionesAdelanto,
    loadingOpcionesAdelanto,
    errorOpcionesAdelanto,
    cargarOpcionesAdelanto,
    reiniciarOpcionesAdelanto,
    limpiarOpcionesAdelanto,
  } = useOpcionesAdelanto();
  const {
    pagoData,
    modoPago,
    abonoLibre,
    showForm,
    prepararFormulario,
    abrirFormulario,
    cerrarFormulario,
    toggleFormularioPago,
    validarMontoContraSaldo,
    actualizarCuotasSeleccionadas,
    seleccionarConceptoPendiente,
    activarAbonoLibre,
    cambiarModoPago,
    seleccionarConceptoAdelanto,
    cambiarCantidadAdelanto,
    cambiarModalidadAdelanto,
    cambiarMontoDistribuir,
    actualizarCampoPago,
    cambiarMontoPago,
    alternarMetodoPago,
    cambiarMontoMetodo,
    cambiarNotaMetodo,
    reiniciarFormularioTrasRegistro,
    opcionAdelantoSeleccionada,
    periodosAdelantoSeleccionados,
    saldoAdelantoSinDistribuir,
    deudaDelConceptoAdelantado,
    deudaPendienteSeleccionada,
    opcionVencidaSeleccionada,
    periodosVencidosSeleccionados,
    todasLasCuotasSeleccionadas,
  } = useFormularioPago({
    selectedEstudiante,
    ventasPendientes,
    deudasEstudiante,
    tiposPagos,
    opcionesVencidas,
    opcionesAdelanto,
    cargarOpcionesVencidas,
    cargarOpcionesAdelanto,
    reiniciarOpcionesAdelanto,
  });
  const {
    valorPersonalizadoData,
    guardandoValorPersonalizado,
    reiniciarValorPersonalizado,
    seleccionarTipoValorPersonalizado,
    actualizarCampoValorPersonalizado,
    guardarValorPersonalizado,
    quitarValorPersonalizado,
  } = useValoresPersonalizadosPago({
    selectedEstudiante,
    valoresPersonalizados,
    actualizarValoresPersonalizados,
    cargarDeudasEstudiante,
    cargarOpcionesVencidas,
  });
  const { registrandoPago, registrarPago } = useRegistroPago({
    selectedEstudiante,
    pagoData,
    modoPago,
    abonoLibre,
    deudasEstudiante,
    opcionesVencidas,
    periodosAdelantoSeleccionados,
    saldoAdelantoSinDistribuir,
    deudaDelConceptoAdelantado,
    validarMontoContraSaldo,
    reiniciarFormularioTrasRegistro,
    limpiarOpcionesAdelanto,
    cargarHistorialPagos,
    cargarVentasPendientes,
    cargarDeudasEstudiante,
    cargarOpcionesVencidas,
  });
  const { anularPago } = useAnulacionPago({
    selectedEstudiante,
    cargarHistorialPagos,
    cargarVentasPendientes,
    cargarDeudasEstudiante,
    cargarOpcionesVencidas,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [pagoAImprimir, setPagoAImprimir] = useState(null);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  // Auto-seleccionar estudiante y abrir formulario cuando se navega
  // con estado desde Cartera Vencida ("Cobrar") u otra pantalla.
  useEffect(() => {
    if (!estudianteIdPreseleccionado || estudiantes.length === 0) return;
    if (selectedEstudiante?.id === estudianteIdPreseleccionado) return;

    const estudiante = estudiantes.find(
      (item) => Number(item.id) === Number(estudianteIdPreseleccionado)
    );
    if (estudiante) {
      handleEstudianteSelect(estudiante);
      abrirFormulario();
      // Limpiar el state de navegación para que F5 no vuelva a abrir el form.
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudiantes, estudianteIdPreseleccionado]);

  if (!usuario || usuario.rol !== "admin") {
    navigate("/login");
    return null;
  }

  const handleEstudianteSelect = (estudiante) => {
    seleccionarEstudiante(estudiante);
    prepararFormulario(estudiante.id);
    reiniciarOpcionesAdelanto();
    reiniciarValorPersonalizado();
  };

  const imprimirFactura = (pago) => {
    if (!selectedEstudiante) return;
    setPagoAImprimir(pago);
  };

  const estudiantesFiltrados = estudiantes.filter((estudiante) =>
    `${estudiante.nombre} ${estudiante.apellido}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const obtenerNombreCurso = (estudiante) => {
    if (typeof estudiante.curso_nombre === "string" && estudiante.curso_nombre.trim()) {
      return estudiante.curso_nombre;
    }
    if (typeof estudiante.curso === "string" && estudiante.curso.trim()) {
      return estudiante.curso;
    }
    return cursos.find(
      (curso) => Number(curso.id) === Number(estudiante.curso_id)
    )?.nombre || "Sin curso";
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">💰 Gestión de Pagos</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ListaEstudiantesPagos
          estudiantes={estudiantesFiltrados}
          loading={loading}
          searchTerm={searchTerm}
          selectedEstudianteId={selectedEstudiante?.id}
          obtenerNombreCurso={obtenerNombreCurso}
          onSearchTermChange={setSearchTerm}
          onSelectEstudiante={handleEstudianteSelect}
        />

        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 h-[calc(100vh-140px)] overflow-y-auto">
          {selectedEstudiante ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold capitalize">
                  Pagos de {selectedEstudiante.apellido} {selectedEstudiante.nombre}
                </h2>
                <button
                  onClick={toggleFormularioPago}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                >
                  {showForm ? "Cancelar" : "+ Nuevo Pago/Factura"}
                </button>
              </div>

              <ValoresPersonalizadosPago
                tiposPagos={tiposPagos}
                valoresPersonalizados={valoresPersonalizados}
                valorPersonalizadoData={valorPersonalizadoData}
                guardandoValorPersonalizado={guardandoValorPersonalizado}
                onSeleccionarTipo={seleccionarTipoValorPersonalizado}
                onActualizarCampo={actualizarCampoValorPersonalizado}
                onGuardar={guardarValorPersonalizado}
                onQuitar={quitarValorPersonalizado}
              />

              {showForm && (
                <FormularioPago
                  pagoData={pagoData}
                  modoPago={modoPago}
                  abonoLibre={abonoLibre}
                  registrandoPago={registrandoPago}
                  ventasPendientes={ventasPendientes}
                  deudasEstudiante={deudasEstudiante}
                  deudaPendienteSeleccionada={deudaPendienteSeleccionada}
                  opcionVencidaSeleccionada={opcionVencidaSeleccionada}
                  periodosVencidosSeleccionados={periodosVencidosSeleccionados}
                  todasLasCuotasSeleccionadas={todasLasCuotasSeleccionadas}
                  loadingOpcionesVencidas={loadingOpcionesVencidas}
                  errorOpcionesVencidas={errorOpcionesVencidas}
                  opcionesAdelanto={opcionesAdelanto}
                  loadingOpcionesAdelanto={loadingOpcionesAdelanto}
                  errorOpcionesAdelanto={errorOpcionesAdelanto}
                  opcionAdelantoSeleccionada={opcionAdelantoSeleccionada}
                  deudaDelConceptoAdelantado={deudaDelConceptoAdelantado}
                  periodosAdelantoSeleccionados={periodosAdelantoSeleccionados}
                  saldoAdelantoSinDistribuir={saldoAdelantoSinDistribuir}
                  onRegistrar={registrarPago}
                  onCerrar={cerrarFormulario}
                  onCambiarModoPago={cambiarModoPago}
                  onSeleccionarConceptoPendiente={seleccionarConceptoPendiente}
                  onActualizarCuotasSeleccionadas={actualizarCuotasSeleccionadas}
                  onActivarAbonoLibre={activarAbonoLibre}
                  onReintentarOpcionesVencidas={cargarOpcionesVencidas}
                  onSeleccionarConceptoAdelanto={seleccionarConceptoAdelanto}
                  onCambiarCantidadAdelanto={cambiarCantidadAdelanto}
                  onCambiarModalidadAdelanto={cambiarModalidadAdelanto}
                  onCambiarMontoDistribuir={cambiarMontoDistribuir}
                  onReintentarOpcionesAdelanto={() =>
                    cargarOpcionesAdelanto(selectedEstudiante.id)
                  }
                  onActualizarCampoPago={actualizarCampoPago}
                  onCambiarMontoPago={cambiarMontoPago}
                  onValidarMonto={validarMontoContraSaldo}
                  onAlternarMetodoPago={alternarMetodoPago}
                  onCambiarMontoMetodo={cambiarMontoMetodo}
                  onCambiarNotaMetodo={cambiarNotaMetodo}
                />
              )}

              <HistorialPagos
                pagos={pagos}
                onImprimir={imprimirFactura}
                onAnular={anularPago}
              />
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">💰</div>
              <p>Selecciona un estudiante para ver sus pagos</p>
            </div>
          )}
        </div>
      </div>

      <ComprobantePago
        pago={pagoAImprimir}
        estudiante={selectedEstudiante}
        onCerrar={() => setPagoAImprimir(null)}
      />
    </div>
  );
}

export default PagosAdmin;
