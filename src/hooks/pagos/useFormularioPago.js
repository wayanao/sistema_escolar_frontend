import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  calcularTotalPeriodos,
  crearAplicacionesCuotas,
  crearPeriodosAdelantoPorCantidad,
  distribuirMontoEnPeriodos,
} from "../../utils/pagos/calculos";
import { crearPagoInicial } from "../../utils/pagos/contratos";
import { obtenerFechaLocal } from "../../utils/pagos/formatos";

const crearPagoActual = (estudianteId = "") =>
  crearPagoInicial(estudianteId, obtenerFechaLocal(new Date()));

export default function useFormularioPago({
  selectedEstudiante,
  ventasPendientes = [],
  deudasEstudiante = [],
  tiposPagos = [],
  opcionesVencidas = [],
  opcionesAdelanto = [],
  cargarOpcionesVencidas,
  cargarOpcionesAdelanto,
  reiniciarOpcionesAdelanto,
}) {
  const [pagoData, setPagoData] = useState(() => crearPagoActual());
  const [modoPago, setModoPago] = useState("normal");
  const [abonoLibre, setAbonoLibre] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (
      modoPago !== "normal" ||
      abonoLibre ||
      !pagoData.descripcion ||
      pagoData.aplicaciones.length > 0
    ) return;

    const deuda = deudasEstudiante.find(
      (item) => item.concepto === pagoData.descripcion && item.tipo_cobro === "mensual"
    );
    const opcion = opcionesVencidas.find(
      (item) => Number(item.tipo_pago_id) === Number(deuda?.concepto_id)
    );
    const primeraCuota = opcion?.cuotas?.[0];
    if (!primeraCuota) return;

    const monto = String(primeraCuota.saldo);
    setPagoData((actual) => ({
      ...actual,
      monto,
      aplicaciones: [{
        tipo_pago_id: Number(opcion.tipo_pago_id),
        periodo: primeraCuota.periodo,
        monto: Number(primeraCuota.saldo || 0),
      }],
      metodos: actual.metodos.length === 1
        ? [{ ...actual.metodos[0], monto }]
        : actual.metodos,
    }));
  }, [
    abonoLibre,
    deudasEstudiante,
    modoPago,
    opcionesVencidas,
    pagoData.aplicaciones.length,
    pagoData.descripcion,
  ]);

  const prepararFormulario = (estudianteId) => {
    setPagoData(crearPagoActual(estudianteId));
    setModoPago("normal");
    setAbonoLibre(false);
  };

  const abrirFormulario = () => setShowForm(true);
  const cerrarFormulario = () => setShowForm(false);

  const toggleFormularioPago = () => {
    if (!selectedEstudiante) return;
    setShowForm((abierto) => {
      if (!abierto) {
        prepararFormulario(selectedEstudiante.id);
        reiniciarOpcionesAdelanto();
        cargarOpcionesVencidas(selectedEstudiante.id);
      }
      return !abierto;
    });
  };

  const obtenerSaldoSeleccionado = () => {
    if (pagoData.venta_id) {
      const venta = ventasPendientes.find(
        (item) => Number(item.id) === Number(pagoData.venta_id)
      );
      return venta ? Number(venta.total || 0) : null;
    }

    if (!pagoData.descripcion) return null;
    const deuda = deudasEstudiante.find((item) => item.concepto === pagoData.descripcion);
    return deuda ? Number(deuda.deuda || 0) : null;
  };

  const validarMontoContraSaldo = (monto) => {
    const saldo = obtenerSaldoSeleccionado();
    if (saldo === null) return true;
    if (Number(monto) > saldo) {
      Swal.fire(
        'Monto mayor a la deuda',
        `El estudiante solo debe $${saldo.toLocaleString()}. Puedes registrar un abono menor o igual a ese valor.`,
        'warning'
      );
      return false;
    }
    return true;
  };

  const actualizarCuotasSeleccionadas = (opcion, periodos) => {
    const { aplicaciones, total } = crearAplicacionesCuotas(opcion, periodos);
    setAbonoLibre(false);
    setPagoData((actual) => ({
      ...actual,
      aplicaciones,
      monto: aplicaciones.length ? String(total) : "",
      metodos: actual.metodos.length === 1
        ? [{ ...actual.metodos[0], monto: aplicaciones.length ? String(total) : "" }]
        : actual.metodos,
    }));
  };

  const seleccionarConceptoPendiente = (selectedVal) => {
    if (selectedVal.startsWith("CargoVenta_")) {
      const id = parseInt(selectedVal.split("_")[1]);
      const venta = ventasPendientes.find((item) => Number(item.id) === Number(id));
      if (!venta) return;
      setAbonoLibre(false);
      setPagoData((actual) => ({
        ...actual,
        descripcion: venta.descripcion,
        monto: venta.total,
        venta_id: id,
        aplicaciones: [],
        metodos: [],
      }));
      return;
    }

    const deuda = deudasEstudiante.find((item) => item.concepto === selectedVal);
    const opcion = opcionesVencidas.find(
      (item) => Number(item.tipo_pago_id) === Number(deuda?.concepto_id)
    );
    const defaultMonto = deuda
      ? deuda.deuda
      : (tiposPagos.find((tipo) => tipo.nombre === selectedVal)?.valor || "");
    const primeraCuota = opcion?.cuotas?.[0];
    const aplicaciones = primeraCuota ? [{
      tipo_pago_id: Number(opcion.tipo_pago_id),
      periodo: primeraCuota.periodo,
      monto: Number(primeraCuota.saldo || 0),
    }] : [];
    const monto = primeraCuota ? String(primeraCuota.saldo) : defaultMonto;
    setAbonoLibre(Boolean(deuda?.tipo_cobro === "mensual" && !primeraCuota));
    setPagoData((actual) => ({
      ...actual,
      descripcion: selectedVal,
      monto,
      venta_id: null,
      aplicaciones,
      metodos: [],
    }));
  };

  const activarAbonoLibre = () => {
    const deuda = deudasEstudiante.find((item) => item.concepto === pagoData.descripcion);
    const monto = deuda ? String(deuda.deuda || "") : pagoData.monto;
    setAbonoLibre(true);
    setPagoData((actual) => ({
      ...actual,
      aplicaciones: [],
      monto,
      metodos: actual.metodos.length === 1
        ? [{ ...actual.metodos[0], monto }]
        : actual.metodos,
    }));
  };

  const cambiarModoPago = (modo) => {
    if (!selectedEstudiante || modo === modoPago) return;
    setModoPago(modo);
    setPagoData(crearPagoActual(selectedEstudiante.id));
    setAbonoLibre(false);
    if (modo === "normal") cargarOpcionesVencidas(selectedEstudiante.id);
    if (modo === "adelantado" && opcionesAdelanto.length === 0) {
      cargarOpcionesAdelanto(selectedEstudiante.id);
    }
  };

  const seleccionarConceptoAdelanto = (tipoPagoId) => {
    const opcion = opcionesAdelanto.find(
      (item) => Number(item.tipo_pago_id) === Number(tipoPagoId)
    );
    const cantidad = opcion?.max_meses > 0 ? 1 : 0;
    const totalInicial = Number(opcion?.periodos_disponibles?.[0]?.saldo || 0);
    setPagoData((actual) => ({
      ...actual,
      tipo_pago_id_adelanto: tipoPagoId,
      cantidad_meses: cantidad,
      descripcion: opcion?.concepto || "",
      monto: actual.modalidad_adelanto === "meses" && opcion ? String(totalInicial) : "",
      monto_distribuir: "",
      venta_id: null,
      metodos: [],
    }));
  };

  const cambiarCantidadAdelanto = (cantidadMeses) => {
    const cantidad = Number(cantidadMeses);
    const opcion = opcionesAdelanto.find(
      (item) => Number(item.tipo_pago_id) === Number(pagoData.tipo_pago_id_adelanto)
    );
    const total = calcularTotalPeriodos(opcion?.periodos_disponibles || [], cantidad);
    setPagoData((actual) => ({
      ...actual,
      cantidad_meses: cantidad,
      monto: String(total),
      metodos: actual.metodos.length === 1
        ? [{ ...actual.metodos[0], monto: String(total) }]
        : actual.metodos,
    }));
  };

  const cambiarModalidadAdelanto = (modalidad) => {
    const opcion = opcionesAdelanto.find(
      (item) => Number(item.tipo_pago_id) === Number(pagoData.tipo_pago_id_adelanto)
    );
    const totalInicial = Number(opcion?.periodos_disponibles?.[0]?.saldo || 0);
    setPagoData((actual) => ({
      ...actual,
      modalidad_adelanto: modalidad,
      cantidad_meses: opcion?.max_meses > 0 ? 1 : 0,
      monto_distribuir: "",
      monto: modalidad === "meses" && opcion ? String(totalInicial) : "",
      metodos: [],
    }));
  };

  const cambiarMontoDistribuir = (valor) => {
    setPagoData((actual) => ({
      ...actual,
      monto_distribuir: valor,
      monto: valor,
      metodos: actual.metodos.length === 1
        ? [{ ...actual.metodos[0], monto: valor }]
        : actual.metodos,
    }));
  };

  const actualizarCampoPago = (campo, valor) =>
    setPagoData((actual) => ({ ...actual, [campo]: valor }));

  const cambiarMontoPago = (monto) => {
    setPagoData((actual) => ({
      ...actual,
      monto,
      metodos: actual.metodos.length === 1
        ? [{ ...actual.metodos[0], monto }]
        : actual.metodos,
    }));
  };

  const alternarMetodoPago = (tipo, activo) => {
    setPagoData((actual) => {
      let metodos = [...actual.metodos];
      if (activo) {
        metodos.push({
          tipo,
          monto: metodos.length === 0 ? actual.monto : "",
          nota: "",
        });
      } else {
        metodos = metodos.filter((metodo) => metodo.tipo !== tipo);
      }
      return { ...actual, metodos };
    });
  };

  const cambiarMontoMetodo = (tipo, monto) =>
    setPagoData((actual) => ({
      ...actual,
      metodos: actual.metodos.map((metodo) =>
        metodo.tipo === tipo ? { ...metodo, monto } : metodo
      ),
    }));

  const cambiarNotaMetodo = (tipo, nota) =>
    setPagoData((actual) => ({
      ...actual,
      metodos: actual.metodos.map((metodo) =>
        metodo.tipo === tipo ? { ...metodo, nota } : metodo
      ),
    }));

  const reiniciarFormularioTrasRegistro = (estudianteId) => {
    setShowForm(false);
    prepararFormulario(estudianteId);
  };

  const opcionAdelantoSeleccionada = opcionesAdelanto.find(
    (item) => Number(item.tipo_pago_id) === Number(pagoData.tipo_pago_id_adelanto)
  );
  const periodosAdelantoPorCantidad = crearPeriodosAdelantoPorCantidad(
    opcionAdelantoSeleccionada?.periodos_disponibles || [],
    pagoData.cantidad_meses
  );
  const resultadoDistribucionAdelanto = distribuirMontoEnPeriodos(
    opcionAdelantoSeleccionada?.periodos_disponibles || [],
    pagoData.monto_distribuir
  );
  const periodosAdelantoSeleccionados = pagoData.modalidad_adelanto === "monto"
    ? resultadoDistribucionAdelanto.distribucion
    : periodosAdelantoPorCantidad;
  const saldoAdelantoSinDistribuir = pagoData.modalidad_adelanto === "monto"
    ? resultadoDistribucionAdelanto.sinDistribuir
    : 0;
  const deudaDelConceptoAdelantado = deudasEstudiante.find(
    (deuda) => Number(deuda.concepto_id) === Number(pagoData.tipo_pago_id_adelanto)
  );
  const deudaPendienteSeleccionada = deudasEstudiante.find(
    (deuda) => deuda.concepto === pagoData.descripcion
  );
  const opcionVencidaSeleccionada = opcionesVencidas.find(
    (item) => Number(item.tipo_pago_id) === Number(deudaPendienteSeleccionada?.concepto_id)
  );
  const periodosVencidosSeleccionados = new Set(
    (pagoData.aplicaciones || []).map((item) => item.periodo)
  );
  const todasLasCuotasSeleccionadas = Boolean(
    opcionVencidaSeleccionada?.cuotas?.length &&
    opcionVencidaSeleccionada.cuotas.every(
      (cuota) => periodosVencidosSeleccionados.has(cuota.periodo)
    )
  );

  return {
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
  };
}
