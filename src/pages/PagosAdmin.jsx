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

function moverHasta(elemento) {
  const reducirMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  elemento.scrollIntoView?.({
    behavior: reducirMovimiento ? "auto" : "smooth",
    block: "start",
  });
}

// Por debajo de `lg` (1024px) la lista y el panel quedan apilados: al elegir
// un estudiante se baja hasta el panel de pagos.
function bajarAlPanel(panel) {
  if (!panel || !window.matchMedia?.("(max-width: 1023.98px)").matches) return;
  moverHasta(panel);
}

// Al elegir qué cobrar en lo que debe, el formulario queda debajo: se baja
// hasta él en cualquier pantalla (pedido del usuario, 2026-11-04).
function bajarAlFormulario(formulario) {
  if (formulario) moverHasta(formulario);
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
  } = useOpcionesAdelanto({ parametrosAnio: parametrosAnioPago });
  const ventasDelAnioPago = esAnioPagoActivo ? ventasPendientes : [];
  const {
    pagoData,
    modoPago,
    abonoLibre,
    showForm,
    prepararFormulario,
    cerrarFormulario,
    validarMontoContraSaldo,
    actualizarCuotasSeleccionadas,
    cobrarConcepto,
    activarAbonoLibre,
    cambiarModoPago,
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
    conceptosAlDia,
    puedeElegirPendienteOAdelanto,
  } = useFormularioPago({
    selectedEstudiante,
    ventasPendientes: ventasDelAnioPago,
    deudasEstudiante,
    tiposPagos,
    opcionesVencidas,
    opcionesAdelanto,
    cargarOpcionesVencidas,
    cargarOpcionesAdelanto,
  });
  const {
    filasValoresPago,
    borradoresValoresPago,
    cargandoValoresPago,
    guardandoTipoId,
    mensajeValoresPago,
    errorValoresPago,
    reiniciarValorPersonalizado,
    abrirValoresPago,
    cambiarBorradorValorPago,
    guardarValorPago,
    volverAlPrecio,
  } = useValoresPersonalizadosPago({
    selectedEstudiante,
    parametrosAnio: parametrosAnioPago,
    actualizarValoresPersonalizados,
    cargarDeudasEstudiante,
    cargarOpcionesVencidas,
    cargarOpcionesAdelanto,
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
    cargarHistorialPagos,
    cargarVentasPendientes,
    cargarDeudasEstudiante,
    cargarOpcionesVencidas,
    cargarOpcionesAdelanto,
    anioLectivoId: parametrosAnioPago.anio_lectivo_id,
  });
  const { anularPago } = useAnulacionPago({
    selectedEstudiante,
    cargarHistorialPagos,
    cargarVentasPendientes,
    cargarDeudasEstudiante,
    cargarOpcionesVencidas,
    cargarOpcionesAdelanto,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [pagoAImprimir, setPagoAImprimir] = useState(null);
  const anioCargadoRef = useRef(null);
  const panelPagoRef = useRef(null);
  const formularioRef = useRef(null);
  // Cada vez que se elige qué cobrar en lo que debe sube este contador; el
  // efecto baja hasta el formulario ya pintado.
  const [aperturasFormulario, setAperturasFormulario] = useState(0);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  useEffect(() => {
    if (aperturasFormulario > 0) bajarAlFormulario(formularioRef.current);
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
      // Lo que debe muestra los conceptos para adelantar del año nuevo.
      cargarOpcionesAdelanto(selectedEstudiante.id);
    }
  }, [
    anioPago?.id,
    cargarOpcionesAdelanto,
    prepararFormulario,
    recargarDatosDelAnio,
    reiniciarOpcionesAdelanto,
    reiniciarValorPersonalizado,
    selectedEstudiante,
  ]);

  // Al llegar desde Cartera Vencida ("Cobrar") u otra pantalla, se elige el
  // estudiante y se muestra lo que debe: ahí se escoge qué cobrar.
  useEffect(() => {
    if (!estudianteIdPreseleccionado || estudiantes.length === 0) return;
    if (selectedEstudiante?.id === estudianteIdPreseleccionado) return;

    const estudiante = estudiantes.find(
      (item) => Number(item.id) === Number(estudianteIdPreseleccionado)
    );
    if (estudiante) {
      handleEstudianteSelect(estudiante);
      bajarAlPanel(panelPagoRef.current);
      // Limpiar el state de navegación para que F5 no lo vuelva a elegir.
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudiantes, estudianteIdPreseleccionado]);

  if (!usuario || usuario.rol !== "admin") {
    navigate("/login");
    return null;
  }

  // Lo que debe necesita también los meses para adelantar: se piden al elegir
  // el estudiante, no al abrir el formulario.
  const handleEstudianteSelect = (estudiante) => {
    seleccionarEstudiante(estudiante);
    prepararFormulario(estudiante.id);
    reiniciarOpcionesAdelanto();
    cargarOpcionesAdelanto(estudiante.id);
    reiniciarValorPersonalizado();
  };

  const seleccionarDesdeLista = (estudiante) => {
    handleEstudianteSelect(estudiante);
    bajarAlPanel(panelPagoRef.current);
  };

  const cobrarDesdeResumen = (fila) => {
    cobrarConcepto(fila.cobro);
    setAperturasFormulario((total) => total + 1);
  };

  // Las ventas son del año activo: en otro año no cuentan ni se esperan.
  const resumenDeuda = crearResumenDeuda({
    deudas: deudasEstudiante,
    ventasPendientes: ventasDelAnioPago,
    opcionesVencidas,
    conceptosAlDia,
  });
  const cargandoResumen =
    cargandoDeudas ||
    loadingOpcionesVencidas ||
    loadingOpcionesAdelanto ||
    (esAnioPagoActivo && cargandoVentas);
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
              {/* Desde el 2026-11-04 se cobra desde cada fila de lo que debe:
                  ya no hay un "Cobrar" general aquí arriba. */}
              <h2 className="mb-4 text-xl font-semibold capitalize">
                Pagos de {selectedEstudiante.apellido} {selectedEstudiante.nombre}
              </h2>

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
                errorAdelanto={errorOpcionesAdelanto}
                onReintentar={reintentarResumen}
                onReintentarAdelanto={() => cargarOpcionesAdelanto(selectedEstudiante.id)}
                onCobrar={cobrarDesdeResumen}
              />

              <DeudasAniosAnterioresView
                deudasAnios={deudaAniosAnteriores}
                className="mb-5"
              />

              {/* El formulario abre debajo de lo que debe, con el concepto ya
                  elegido. Los valores personalizados se configuran de vez en
                  cuando, van debajo y empiezan cerrados con cada estudiante y
                  cada año (`key`). */}
              {showForm && (
                <div ref={formularioRef} className="scroll-mt-4">
                  <FormularioPago
                    pagoData={pagoData}
                    modoPago={modoPago}
                    abonoLibre={abonoLibre}
                    registrandoPago={registrandoPago}
                    deudaPendienteSeleccionada={deudaPendienteSeleccionada}
                    opcionVencidaSeleccionada={opcionVencidaSeleccionada}
                    periodosVencidosSeleccionados={periodosVencidosSeleccionados}
                    todasLasCuotasSeleccionadas={todasLasCuotasSeleccionadas}
                    loadingOpcionesVencidas={loadingOpcionesVencidas}
                    errorOpcionesVencidas={errorOpcionesVencidas}
                    puedeElegirPendienteOAdelanto={puedeElegirPendienteOAdelanto}
                    loadingOpcionesAdelanto={loadingOpcionesAdelanto}
                    errorOpcionesAdelanto={errorOpcionesAdelanto}
                    opcionAdelantoSeleccionada={opcionAdelantoSeleccionada}
                    deudaDelConceptoAdelantado={deudaDelConceptoAdelantado}
                    periodosAdelantoSeleccionados={periodosAdelantoSeleccionados}
                    saldoAdelantoSinDistribuir={saldoAdelantoSinDistribuir}
                    onRegistrar={registrarPago}
                    onCerrar={cerrarFormulario}
                    onCambiarModoPago={cambiarModoPago}
                    onActualizarCuotasSeleccionadas={actualizarCuotasSeleccionadas}
                    onActivarAbonoLibre={activarAbonoLibre}
                    onReintentarOpcionesVencidas={cargarOpcionesVencidas}
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
                key={`${selectedEstudiante.id}-${anioPago?.id ?? "activo"}`}
                anio={anioPago?.anio ?? null}
                estudianteNombre={`${selectedEstudiante.nombre} ${selectedEstudiante.apellido}`}
                valoresPersonalizados={valoresPersonalizados}
                filas={filasValoresPago}
                borradores={borradoresValoresPago}
                cargando={cargandoValoresPago}
                guardandoTipoId={guardandoTipoId}
                mensaje={mensajeValoresPago}
                error={errorValoresPago}
                onAbrir={abrirValoresPago}
                onCambiarBorrador={cambiarBorradorValorPago}
                onGuardar={guardarValorPago}
                onVolverAlPrecio={volverAlPrecio}
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
