import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import DeudasAniosAnterioresView from "../components/anioLectivo/DeudasAniosAnterioresView";
import ComprobantePago from "../components/pagos/ComprobantePago";
import FormularioPago from "../components/pagos/FormularioPago";
import HistorialPagos from "../components/pagos/HistorialPagos";
import ListaEstudiantesPagos from "../components/pagos/ListaEstudiantesPagos";
import ResumenDeudaPago from "../components/pagos/ResumenDeudaPago";
import SelectorAnioPago from "../components/pagos/SelectorAnioPago";
import ValoresPersonalizadosPago from "../components/pagos/ValoresPersonalizadosPago";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useAnulacionPago from "../hooks/pagos/useAnulacionPago";
import useCatalogosPagos from "../hooks/pagos/useCatalogosPagos";
import useConsultasEstudiantePagos from "../hooks/pagos/useConsultasEstudiantePagos";
import useFormularioPago from "../hooks/pagos/useFormularioPago";
import useOpcionesAdelanto from "../hooks/pagos/useOpcionesAdelanto";
import useRegistroPago from "../hooks/pagos/useRegistroPago";
import useValoresPersonalizadosPago from "../hooks/pagos/useValoresPersonalizadosPago";
import { ESTADO_PREPARACION, parametrosAnio } from "../utils/anioLectivo";
import { crearResumenDeuda } from "../utils/pagos/resumenDeuda";

const notificarErrorCargaEstudiantes = () =>
  Swal.fire("Error", "Error al cargar estudiantes", "error");

// Por debajo de `lg` (1024px) todo queda apilado: al elegir un estudiante se
// baja hasta el panel de pagos, y al abrir el formulario, hasta el formulario,
// que queda debajo de lo que debe.
function bajarHasta(elemento) {
  if (!elemento || !window.matchMedia?.("(max-width: 1023.98px)").matches) return;
  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  elemento.scrollIntoView?.({
    behavior: reducirMovimiento ? "auto" : "smooth",
    block: "start",
  });
}

function PagosAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const preseleccionRef = useRef({
    estudianteId: location.state?.estudiante_id ?? null,
    anioLectivoId: location.state?.anio_lectivo_id ?? null,
  });
  // Si llegamos desde Cartera Vencida / Resumen estudiante con un id preseleccionado
  const estudianteIdPreseleccionado = preseleccionRef.current.estudianteId;
  const { anios, anioActivo } = useAnioLectivo();
  // `null` conserva el año activo y, con él, las peticiones anteriores.
  const [anioPagoId, setAnioPagoId] = useState(null);
  const anioPago = useMemo(
    () => anios.find((anio) => anio.id === anioPagoId) ?? anioActivo,
    [anioActivo, anioPagoId, anios],
  );
  const parametrosAnioPago = useMemo(
    () => parametrosAnio(anioPagoId, anioActivo?.id ?? null),
    [anioActivo?.id, anioPagoId],
  );
  const esAnioPagoActivo = !parametrosAnioPago.anio_lectivo_id;

  const { estudiantes, cursos, tiposPagos, loading } = useCatalogosPagos({
    alErrorEstudiantes: notificarErrorCargaEstudiantes,
    parametrosAnio: parametrosAnioPago,
  });
  const {
    pagos,
    ventasPendientes,
    cargandoVentas,
    errorVentas,
    deudasEstudiante,
    cargandoDeudas,
    errorDeudas,
    deudaAniosAnteriores,
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
    recargarDatosDelAnio,
    actualizarValoresPersonalizados,
  } = useConsultasEstudiantePagos({ parametrosAnio: parametrosAnioPago });
  const {
    opcionesAdelanto,
    loadingOpcionesAdelanto,
    errorOpcionesAdelanto,
    cargarOpcionesAdelanto,
    reiniciarOpcionesAdelanto,
    limpiarOpcionesAdelanto,
  } = useOpcionesAdelanto({ parametrosAnio: parametrosAnioPago });
  const ventasDelAnioPago = esAnioPagoActivo ? ventasPendientes : [];
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
    cobrarPendiente,
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
    ventasPendientes: ventasDelAnioPago,
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
    anioLectivoId: parametrosAnioPago.anio_lectivo_id,
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
  const anioCargadoRef = useRef(null);
  const panelPagoRef = useRef(null);
  const formularioRef = useRef(null);
  // Cada vez que se abre el formulario (o se cobra otra fila) sube este
  // contador; el efecto baja hasta el formulario ya pintado.
  const [aperturasFormulario, setAperturasFormulario] = useState(0);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  useEffect(() => {
    if (aperturasFormulario > 0) bajarHasta(formularioRef.current);
  }, [aperturasFormulario]);

  useEffect(() => {
    const idPreseleccionado = Number(preseleccionRef.current.anioLectivoId);
    if (!idPreseleccionado || !anioActivo) return;
    const existe = anios.some((anio) => anio.id === idPreseleccionado);
    if (!existe) return;
    setAnioPagoId(idPreseleccionado === anioActivo.id ? null : idPreseleccionado);
  }, [anioActivo, anios]);

  // Al cambiar el año, se descarta cualquier selección de cuotas del año
  // anterior y se vuelven a pedir únicamente los datos financieros que sí
  // dependen del año. Historial y ventas permanecen como estaban.
  useEffect(() => {
    const anioActualId = anioPago?.id ?? null;
    if (anioActualId === null) return;
    if (anioCargadoRef.current === null) {
      anioCargadoRef.current = anioActualId;
      return;
    }
    if (anioCargadoRef.current === anioActualId) return;
    anioCargadoRef.current = anioActualId;

    reiniciarOpcionesAdelanto();
    reiniciarValorPersonalizado();
    if (selectedEstudiante) {
      prepararFormulario(selectedEstudiante.id);
      recargarDatosDelAnio(selectedEstudiante.id);
    }
  }, [
    anioPago?.id,
    prepararFormulario,
    recargarDatosDelAnio,
    reiniciarOpcionesAdelanto,
    reiniciarValorPersonalizado,
    selectedEstudiante,
  ]);

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
      setAperturasFormulario((total) => total + 1);
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

  const seleccionarDesdeLista = (estudiante) => {
    handleEstudianteSelect(estudiante);
    bajarHasta(panelPagoRef.current);
  };

  const alternarFormulario = () => {
    if (!showForm) setAperturasFormulario((total) => total + 1);
    toggleFormularioPago();
  };

  const cobrarDesdeResumen = (fila) => {
    cobrarPendiente(fila.cobro);
    setAperturasFormulario((total) => total + 1);
  };

  // Las ventas son del año activo: en otro año no cuentan ni se esperan.
  const resumenDeuda = crearResumenDeuda({
    deudas: deudasEstudiante,
    ventasPendientes: ventasDelAnioPago,
    opcionesVencidas,
  });
  const cargandoResumen =
    cargandoDeudas || loadingOpcionesVencidas || (esAnioPagoActivo && cargandoVentas);
  const errorResumen = errorDeudas || (esAnioPagoActivo ? errorVentas : "");

  const reintentarResumen = () => {
    if (!selectedEstudiante) return;
    cargarDeudasEstudiante(selectedEstudiante.id);
    if (esAnioPagoActivo) cargarVentasPendientes(selectedEstudiante.id);
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

  const hayAnioEnPreparacion = anios.some(
    (anio) => anio.estado === ESTADO_PREPARACION,
  );
  const mostrarSelectorAnioPago = Boolean(
    selectedEstudiante &&
    anios.length > 1 &&
    (hayAnioEnPreparacion || deudaAniosAnteriores.length > 0 || !esAnioPagoActivo),
  );

  const cambiarAnioPago = (anioId) => {
    if (!anioActivo || !anios.some((anio) => anio.id === anioId)) return;
    setAnioPagoId(anioId === anioActivo.id ? null : anioId);
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
          onSelectEstudiante={seleccionarDesdeLista}
        />

        <div
          ref={panelPagoRef}
          className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 h-[calc(100vh-140px)] overflow-y-auto scroll-mt-4"
        >
          {selectedEstudiante ? (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold capitalize">
                  Pagos de {selectedEstudiante.apellido} {selectedEstudiante.nombre}
                </h2>
                <button
                  type="button"
                  onClick={alternarFormulario}
                  className={`w-full rounded-lg px-5 py-2.5 text-base font-semibold shadow-sm transition-colors sm:w-auto ${
                    showForm
                      ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {showForm ? "Cancelar" : (
                    <>
                      <span aria-hidden="true">💰</span> Cobrar
                    </>
                  )}
                </button>
              </div>

              {mostrarSelectorAnioPago && (
                <SelectorAnioPago
                  anios={anios}
                  anioSeleccionado={anioPago}
                  esAnioActivo={esAnioPagoActivo}
                  onCambiar={cambiarAnioPago}
                />
              )}

              <ResumenDeudaPago
                anio={anioPago?.anio ?? null}
                resumen={resumenDeuda}
                cargando={cargandoResumen}
                error={errorResumen}
                onReintentar={reintentarResumen}
                onCobrar={cobrarDesdeResumen}
              />

              <DeudasAniosAnterioresView
                deudasAnios={deudaAniosAnteriores}
                className="mb-5"
              />

              {/* Cobrar es lo más frecuente: el formulario abre arriba, debajo
                  de lo que debe. Los valores personalizados se configuran de
                  vez en cuando, van debajo y empiezan cerrados con cada
                  estudiante (`key`). */}
              {showForm && (
                <div ref={formularioRef} className="scroll-mt-4">
                  <FormularioPago
                    pagoData={pagoData}
                    modoPago={modoPago}
                    abonoLibre={abonoLibre}
                    registrandoPago={registrandoPago}
                    ventasPendientes={ventasDelAnioPago}
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
                </div>
              )}

              <ValoresPersonalizadosPago
                key={selectedEstudiante.id}
                tiposPagos={tiposPagos}
                valoresPersonalizados={valoresPersonalizados}
                valorPersonalizadoData={valorPersonalizadoData}
                guardandoValorPersonalizado={guardandoValorPersonalizado}
                onSeleccionarTipo={seleccionarTipoValorPersonalizado}
                onActualizarCampo={actualizarCampoValorPersonalizado}
                onGuardar={guardarValorPersonalizado}
                onQuitar={quitarValorPersonalizado}
              />

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
