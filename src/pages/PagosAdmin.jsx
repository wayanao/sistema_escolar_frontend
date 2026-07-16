import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../utils/api";
import FacturaModerna from "../components/FacturaModerna";
import DocumentoImprimible from "../components/impresion/DocumentoImprimible";

const obtenerFechaLocal = () => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

const formatearMoneda = (valor) => `$${Number(valor || 0).toLocaleString()}`;

const formatearPeriodo = (periodo) => {
  if (!periodo) return "";
  const [anio, mes] = periodo.split("-").map(Number);
  const etiqueta = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, 1)));
  return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
};

const crearPagoInicial = (estudianteId = "") => ({
  estudiante_id: estudianteId,
  descripcion: "",
  fecha: obtenerFechaLocal(),
  monto: "",
  venta_id: null,
  metodos: [],
  tipo_pago_id_adelanto: "",
  cantidad_meses: 1,
  aplicaciones: [],
});

function PagosAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  // Si llegamos desde Cartera Vencida / Resumen estudiante con un id preseleccionado
  const estudianteIdPreseleccionado = location.state?.estudiante_id ?? null;
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [tiposPagos, setTiposPagos] = useState([]);
  const [ventasPendientes, setVentasPendientes] = useState([]);
  const [deudasEstudiante, setDeudasEstudiante] = useState([]);
  const [valoresPersonalizados, setValoresPersonalizados] = useState([]);
  const [valorPersonalizadoData, setValorPersonalizadoData] = useState({
    tipo_pago_id: "",
    valor: "",
    motivo: ""
  });
  const [guardandoValorPersonalizado, setGuardandoValorPersonalizado] = useState(false);
  const [registrandoPago, setRegistrandoPago] = useState(false);
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagoAImprimir, setPagoAImprimir] = useState(null);
  const [modoPago, setModoPago] = useState("normal");
  const [opcionesAdelanto, setOpcionesAdelanto] = useState([]);
  const [loadingOpcionesAdelanto, setLoadingOpcionesAdelanto] = useState(false);
  const [errorOpcionesAdelanto, setErrorOpcionesAdelanto] = useState("");
  const [opcionesVencidas, setOpcionesVencidas] = useState([]);
  const [loadingOpcionesVencidas, setLoadingOpcionesVencidas] = useState(false);
  const [errorOpcionesVencidas, setErrorOpcionesVencidas] = useState("");
  const [abonoLibre, setAbonoLibre] = useState(false);

  // Formulario de pago mixto
  const [pagoData, setPagoData] = useState(crearPagoInicial());

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  useEffect(() => {
    cargarEstudiantes();
    cargarCursos();
    cargarTiposPagos();
  }, []);

  // Auto-seleccionar estudiante y abrir formulario cuando se navega
  // con estado desde Cartera Vencida ("Cobrar") u otra pantalla.
  useEffect(() => {
    if (!estudianteIdPreseleccionado || estudiantes.length === 0) return;
    if (selectedEstudiante?.id === estudianteIdPreseleccionado) return;

    const est = estudiantes.find(
      (e) => Number(e.id) === Number(estudianteIdPreseleccionado)
    );
    if (est) {
      handleEstudianteSelect(est);
      setShowForm(true);
      // Limpiar el state de navegación para que F5 no vuelva a abrir el form.
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudiantes, estudianteIdPreseleccionado]);

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

  if (!usuario || usuario.rol !== "admin") {
    navigate("/login");
    return null;
  }

  const cargarEstudiantes = async () => {
    try {
      const res = await api.get("/estudiantes");
      const data = res.data;
      setEstudiantes(data);
    } catch (error) {
      console.error("Error cargando estudiantes:", error);
      Swal.fire('Error', 'Error al cargar estudiantes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarTiposPagos = async () => {
    try {
      const res = await api.get("/tipos-pagos");
      const data = Array.isArray(res.data) ? res.data : [];
      setTiposPagos(data.filter((tipoPago) => tipoPago.activo !== false));
    } catch (error) {
      console.error("Error cargando tipos de pagos:", error);
    }
  };

  const cargarHistorialPagos = async (estudianteId) => {
    try {
      const res = await api.get(`/pagos/${estudianteId}`);
      const data = res.data;
      setPagos(data); // Already sorted from backend
    } catch (error) {
      console.error("Error cargando pagos:", error);
      setPagos([]);
    }
  };

  const handleEstudianteSelect = (estudiante) => {
    setSelectedEstudiante(estudiante);
    setPagoData(crearPagoInicial(estudiante.id));
    setModoPago("normal");
    setOpcionesAdelanto([]);
    setErrorOpcionesAdelanto("");
    setOpcionesVencidas([]);
    setErrorOpcionesVencidas("");
    setAbonoLibre(false);
    setValorPersonalizadoData({ tipo_pago_id: "", valor: "", motivo: "" });
    cargarHistorialPagos(estudiante.id);
    cargarVentasPendientes(estudiante.id);
    cargarDeudasEstudiante(estudiante.id);
    cargarOpcionesVencidas(estudiante.id);
    cargarValoresPersonalizados(estudiante.id);
  };

  const toggleFormularioPago = () => {
    if (!selectedEstudiante) return;
    setShowForm((abierto) => {
      if (!abierto) {
        setPagoData(crearPagoInicial(selectedEstudiante.id));
        setModoPago("normal");
        setOpcionesAdelanto([]);
        setErrorOpcionesAdelanto("");
        setAbonoLibre(false);
        cargarOpcionesVencidas(selectedEstudiante.id);
      }
      return !abierto;
    });
  };

  const cargarDeudasEstudiante = async (estudianteId) => {
    try {
      const res = await api.get(`/estudiantes/${estudianteId}/deudas`);
      setDeudasEstudiante(res.data.deudas || []);
    } catch (error) {
      console.error("Error cargando deudas del estudiante:", error);
      setDeudasEstudiante([]);
    }
  };

  const cargarVentasPendientes = async (estudianteId) => {
    try {
      const res = await api.get(`/api/ventas/pendientes/${estudianteId}`);
      setVentasPendientes(res.data);
    } catch (error) {
      console.error("Error cargando ventas pendientes:", error);
      setVentasPendientes([]);
    }
  };

  const obtenerSaldoSeleccionado = () => {
    if (pagoData.venta_id) {
      const venta = ventasPendientes.find((v) => Number(v.id) === Number(pagoData.venta_id));
      return venta ? Number(venta.total || 0) : null;
    }

    if (!pagoData.descripcion) return null;
    const deuda = deudasEstudiante.find((d) => d.concepto === pagoData.descripcion);
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

  const cargarOpcionesVencidas = async (estudianteId = selectedEstudiante?.id) => {
    if (!estudianteId) return;
    setLoadingOpcionesVencidas(true);
    setErrorOpcionesVencidas("");
    try {
      const res = await api.get(`/pagos/vencidos/opciones/${estudianteId}`);
      setOpcionesVencidas(Array.isArray(res.data?.opciones) ? res.data.opciones : []);
    } catch (error) {
      console.error("Error cargando cuotas vencidas:", error);
      setOpcionesVencidas([]);
      setErrorOpcionesVencidas(
        error.response?.data?.detail || "No se pudieron consultar los meses vencidos."
      );
    } finally {
      setLoadingOpcionesVencidas(false);
    }
  };

  const actualizarCuotasSeleccionadas = (opcion, periodos) => {
    const seleccionadas = (opcion?.cuotas || []).filter((cuota) => periodos.includes(cuota.periodo));
    const aplicaciones = seleccionadas.map((cuota) => ({
      tipo_pago_id: Number(opcion.tipo_pago_id),
      periodo: cuota.periodo,
      monto: Number(cuota.saldo || 0),
    }));
    const total = aplicaciones.reduce((acumulado, item) => acumulado + item.monto, 0);
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
      const ventaObj = ventasPendientes.find((venta) => Number(venta.id) === Number(id));
      if (!ventaObj) return;
      setAbonoLibre(false);
      setPagoData((actual) => ({
        ...actual,
        descripcion: ventaObj.descripcion,
        monto: ventaObj.total,
        venta_id: id,
        aplicaciones: [],
        metodos: [],
      }));
      return;
    }

    const deudaObj = deudasEstudiante.find((deuda) => deuda.concepto === selectedVal);
    const opcion = opcionesVencidas.find(
      (item) => Number(item.tipo_pago_id) === Number(deudaObj?.concepto_id)
    );
    const defaultMonto = deudaObj
      ? deudaObj.deuda
      : (tiposPagos.find((tipo) => tipo.nombre === selectedVal)?.valor || "");
    const primeraCuota = opcion?.cuotas?.[0];
    const aplicaciones = primeraCuota ? [{
      tipo_pago_id: Number(opcion.tipo_pago_id),
      periodo: primeraCuota.periodo,
      monto: Number(primeraCuota.saldo || 0),
    }] : [];
    const monto = primeraCuota ? String(primeraCuota.saldo) : defaultMonto;
    setAbonoLibre(Boolean(deudaObj?.tipo_cobro === "mensual" && !primeraCuota));
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

  const cargarOpcionesAdelanto = async () => {
    if (!selectedEstudiante) return;
    setLoadingOpcionesAdelanto(true);
    setErrorOpcionesAdelanto("");
    try {
      const res = await api.get(`/pagos/adelanto/opciones/${selectedEstudiante.id}`);
      setOpcionesAdelanto(Array.isArray(res.data?.opciones) ? res.data.opciones : []);
    } catch (error) {
      console.error("Error cargando opciones de adelanto:", error);
      setOpcionesAdelanto([]);
      setErrorOpcionesAdelanto(
        error.response?.data?.detail || "No se pudieron consultar los meses disponibles."
      );
    } finally {
      setLoadingOpcionesAdelanto(false);
    }
  };

  const cambiarModoPago = (modo) => {
    if (!selectedEstudiante || modo === modoPago) return;
    setModoPago(modo);
    setPagoData(crearPagoInicial(selectedEstudiante.id));
    setAbonoLibre(false);
    if (modo === "normal") {
      cargarOpcionesVencidas(selectedEstudiante.id);
    }
    if (modo === "adelantado" && opcionesAdelanto.length === 0) {
      cargarOpcionesAdelanto();
    }
  };

  const seleccionarConceptoAdelanto = (tipoPagoId) => {
    const opcion = opcionesAdelanto.find(
      (item) => Number(item.tipo_pago_id) === Number(tipoPagoId)
    );
    const cantidad = opcion?.max_meses > 0 ? 1 : 0;
    setPagoData((actual) => ({
      ...actual,
      tipo_pago_id_adelanto: tipoPagoId,
      cantidad_meses: cantidad,
      descripcion: opcion?.concepto || "",
      monto: opcion ? String(Number(opcion.valor_unitario || 0) * cantidad) : "",
      venta_id: null,
      metodos: [],
    }));
  };

  const cambiarCantidadAdelanto = (cantidadMeses) => {
    const cantidad = Number(cantidadMeses);
    const opcion = opcionesAdelanto.find(
      (item) => Number(item.tipo_pago_id) === Number(pagoData.tipo_pago_id_adelanto)
    );
    const total = Number(opcion?.valor_unitario || 0) * cantidad;
    setPagoData((actual) => ({
      ...actual,
      cantidad_meses: cantidad,
      monto: String(total),
      metodos: actual.metodos.length === 1
        ? [{ ...actual.metodos[0], monto: String(total) }]
        : actual.metodos,
    }));
  };

  const cargarCursos = async () => {
    try {
      const res = await api.get("/cursos");
      setCursos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando cursos:", error);
      setCursos([]);
    }
  };

  const cargarValoresPersonalizados = async (estudianteId) => {
    try {
      const res = await api.get(`/estudiantes/${estudianteId}/valores-pago-personalizados`);
      setValoresPersonalizados(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando valores personalizados:", error);
      setValoresPersonalizados([]);
    }
  };

  const handleTipoValorPersonalizadoChange = (tipoPagoId) => {
    const existente = valoresPersonalizados.find(
      (valor) => Number(valor.tipo_pago_id) === Number(tipoPagoId)
    );

    setValorPersonalizadoData({
      tipo_pago_id: tipoPagoId,
      valor: existente ? String(existente.valor) : "",
      motivo: existente?.motivo || ""
    });
  };

  const guardarValorPersonalizado = async () => {
    if (!selectedEstudiante) return;

    const tipoPagoId = Number(valorPersonalizadoData.tipo_pago_id);
    const valor = Number(valorPersonalizadoData.valor);

    if (!tipoPagoId || valorPersonalizadoData.valor === "" || Number.isNaN(valor) || valor < 0) {
      Swal.fire("Datos incompletos", "Selecciona un concepto y escribe un valor válido.", "warning");
      return;
    }

    setGuardandoValorPersonalizado(true);
    try {
      const res = await api.put(
        `/estudiantes/${selectedEstudiante.id}/valores-pago-personalizados/${tipoPagoId}`,
        {
          valor,
          motivo: valorPersonalizadoData.motivo,
          activo: true
        }
      );
      setValoresPersonalizados(res.data.valores || []);
      setValorPersonalizadoData({ tipo_pago_id: "", valor: "", motivo: "" });
      cargarDeudasEstudiante(selectedEstudiante.id);
      cargarOpcionesVencidas(selectedEstudiante.id);
      Swal.fire("Guardado", "El valor personalizado quedó aplicado para este estudiante.", "success");
    } catch (error) {
      console.error("Error guardando valor personalizado:", error);
      const detalle = error.response?.data?.detail;
      Swal.fire("Error", detalle || "No se pudo guardar el valor personalizado.", "error");
    } finally {
      setGuardandoValorPersonalizado(false);
    }
  };

  const quitarValorPersonalizado = async (valorPersonalizado) => {
    if (!selectedEstudiante) return;

    const result = await Swal.fire({
      title: "Quitar valor personalizado",
      text: `El estudiante volverá al valor del curso para ${valorPersonalizado.tipo_pago_nombre}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Quitar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(
        `/estudiantes/${selectedEstudiante.id}/valores-pago-personalizados/${valorPersonalizado.tipo_pago_id}`
      );
      setValoresPersonalizados((actuales) =>
        actuales.filter((item) => Number(item.tipo_pago_id) !== Number(valorPersonalizado.tipo_pago_id))
      );
      setValorPersonalizadoData({ tipo_pago_id: "", valor: "", motivo: "" });
      cargarDeudasEstudiante(selectedEstudiante.id);
      cargarOpcionesVencidas(selectedEstudiante.id);
      Swal.fire("Actualizado", "El valor personalizado fue retirado.", "success");
    } catch (error) {
      console.error("Error quitando valor personalizado:", error);
      const detalle = error.response?.data?.detail;
      Swal.fire("Error", detalle || "No se pudo quitar el valor personalizado.", "error");
    }
  };

  const handlePagoSubmit = async (e) => {
    e.preventDefault();
    if (registrandoPago) return;
    if (!selectedEstudiante) {
      Swal.fire('Error', 'Selecciona un estudiante antes de registrar el pago', 'error');
      return;
    }

    if (!pagoData.metodos.length || pagoData.metodos.some(m => !m.monto || m.monto <= 0)) {
      Swal.fire('Error', 'Debe ingresar al menos un método y monto válido', 'error');
      return;
    }
    const total = pagoData.metodos.reduce((acc, m) => acc + parseFloat(m.monto || 0), 0);
    if (!pagoData.monto || parseFloat(pagoData.monto) !== total) {
      Swal.fire('Error', 'La suma de los métodos debe ser igual al monto total', 'error');
      return;
    }
    if (modoPago === "normal" && !validarMontoContraSaldo(total)) {
      return;
    }

    const deudaMensualSeleccionada = deudasEstudiante.find(
      (deuda) => deuda.concepto === pagoData.descripcion && deuda.tipo_cobro === "mensual"
    );
    const opcionMensualSeleccionada = opcionesVencidas.find(
      (item) => Number(item.tipo_pago_id) === Number(deudaMensualSeleccionada?.concepto_id)
    );
    if (
      modoPago === "normal" &&
      opcionMensualSeleccionada &&
      !abonoLibre &&
      pagoData.aplicaciones.length === 0
    ) {
      Swal.fire("Selecciona un mes", "Elige al menos una cuota vencida o utiliza Abono libre.", "warning");
      return;
    }

    if (modoPago === "normal" && pagoData.aplicaciones.length > 0) {
      const meses = pagoData.aplicaciones.map((item) => formatearPeriodo(item.periodo)).join(", ");
      const confirmacion = await Swal.fire({
        title: "Confirmar meses del pago",
        text: `Se aplicarán ${formatearMoneda(total)} a: ${meses}.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, registrar pago",
        cancelButtonText: "Revisar",
        confirmButtonColor: "#16a34a",
      });
      if (!confirmacion.isConfirmed) return;
    }

    setRegistrandoPago(true);
    try {
      const estudianteId = selectedEstudiante.id;
      let res;
      if (modoPago === "adelantado") {
        if (!pagoData.tipo_pago_id_adelanto || Number(pagoData.cantidad_meses) < 1) {
          Swal.fire("Datos incompletos", "Selecciona el concepto y los meses a adelantar.", "warning");
          return;
        }
        res = await api.post("/pagos/adelanto", {
          estudiante_id: estudianteId,
          tipo_pago_id: Number(pagoData.tipo_pago_id_adelanto),
          cantidad_meses: Number(pagoData.cantidad_meses),
          fecha: pagoData.fecha,
          metodos: pagoData.metodos.map((metodo) => ({
            ...metodo,
            monto: Number(metodo.monto),
          })),
        });
      } else {
        const payload = { ...pagoData, estudiante_id: pagoData.estudiante_id || estudianteId };
        delete payload.tipo_pago_id_adelanto;
        delete payload.cantidad_meses;
        payload.aplicaciones = (payload.aplicaciones || []).map((aplicacion) => ({
          ...aplicacion,
          tipo_pago_id: Number(aplicacion.tipo_pago_id),
          monto: Number(aplicacion.monto),
        }));
        if (payload.aplicaciones.length === 0) delete payload.aplicaciones;
        if (!payload.venta_id) delete payload.venta_id;
        res = await api.post("/pagos", payload);
      }
      if (res.status >= 200 && res.status < 300) {
        setShowForm(false);
        setPagoData(crearPagoInicial(estudianteId));
        setModoPago("normal");
        setOpcionesAdelanto([]);
        setAbonoLibre(false);
        Swal.fire(
          '¡Éxito!',
          modoPago === "adelantado"
            ? `${res.data.periodos?.length || 0} meses adelantados quedaron registrados correctamente.`
            : pagoData.aplicaciones.length > 0
              ? `Pago aplicado a ${pagoData.aplicaciones.map((item) => formatearPeriodo(item.periodo)).join(", ")}.`
            : 'Pago registrado correctamente',
          'success'
        );
        Promise.all([
          cargarHistorialPagos(estudianteId),
          cargarVentasPendientes(estudianteId),
          cargarDeudasEstudiante(estudianteId),
          cargarOpcionesVencidas(estudianteId),
        ]).catch((reloadError) => {
          console.error("Error recargando datos despues del pago:", reloadError);
        });
      } else {
        Swal.fire('Error', 'Error al registrar pago', 'error');
      }
    } catch (error) {
      console.error("Error:", error);
      const detalle = error.response?.data?.detail;
      const mensaje =
        typeof detalle === "string"
          ? detalle
          : error.response
            ? "El servidor rechazó el pago. Revisa los datos e intenta nuevamente."
            : "No se pudo conectar con el servidor. Verifica que el backend esté encendido.";
      Swal.fire('Error', mensaje, 'error');
    } finally {
      setRegistrandoPago(false);
    }
  };

  const imprimirFactura = (pago) => {
    if (!selectedEstudiante) return;
    setPagoAImprimir(pago);
  };

  const anularPago = async (pago) => {
    if (!selectedEstudiante || pago.anulado) return;

    const result = await Swal.fire({
      title: "Anular pago",
      text: "El pago quedará visible como anulado y no contará como ingreso válido.",
      input: "textarea",
      inputLabel: "Motivo de anulación",
      inputPlaceholder: "Ej: Error en el valor registrado",
      inputAttributes: {
        maxlength: 300,
      },
      showCancelButton: true,
      confirmButtonText: "Anular pago",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      inputValidator: (value) => {
        if (!value || value.trim().length < 5) {
          return "Escribe un motivo de al menos 5 caracteres.";
        }
        return null;
      },
    });

    if (!result.isConfirmed) return;

    try {
      await api.post(`/pagos/${pago.pago_id}/anular`, {
        motivo: result.value.trim(),
      });
      Swal.fire("Pago anulado", "La deuda y los reportes se actualizarán con este cambio.", "success");
      cargarHistorialPagos(selectedEstudiante.id);
      cargarVentasPendientes(selectedEstudiante.id);
      cargarDeudasEstudiante(selectedEstudiante.id);
      cargarOpcionesVencidas(selectedEstudiante.id);
    } catch (error) {
      console.error("Error anulando pago:", error);
      const detail = error?.response?.data?.detail;
      Swal.fire("Error", detail || "No se pudo anular el pago.", "error");
    }
  };

  const estudiantesFiltrados = estudiantes.filter(est =>
    (est.nombre + " " + est.apellido).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const obtenerNombreCurso = (estudiante) => {
    if (typeof estudiante.curso_nombre === "string" && estudiante.curso_nombre.trim()) {
      return estudiante.curso_nombre;
    }
    if (typeof estudiante.curso === "string" && estudiante.curso.trim()) {
      return estudiante.curso;
    }
    return cursos.find((curso) => Number(curso.id) === Number(estudiante.curso_id))?.nombre || "Sin curso";
  };

  const opcionAdelantoSeleccionada = opcionesAdelanto.find(
    (item) => Number(item.tipo_pago_id) === Number(pagoData.tipo_pago_id_adelanto)
  );
  const periodosAdelantoSeleccionados = opcionAdelantoSeleccionada?.periodos_disponibles?.slice(
    0,
    Number(pagoData.cantidad_meses || 0)
  ) || [];
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
    opcionVencidaSeleccionada.cuotas.every((cuota) => periodosVencidosSeleccionados.has(cuota.periodo))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">💰 Gestión de Pagos</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listado de Estudiantes */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-[calc(100vh-140px)] flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Estudiantes</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2">
            {loading ? (
              <p className="text-gray-500 text-sm">Cargando...</p>
            ) : estudiantesFiltrados.length === 0 ? (
              <p className="text-gray-500 text-sm">No se encontraron estudiantes.</p>
            ) : (
              estudiantesFiltrados.map((estudiante) => (
                <div
                  key={estudiante.id}
                  onClick={() => handleEstudianteSelect(estudiante)}
                  className={"p-3 rounded-lg border cursor-pointer transition-colors " + 
                    (selectedEstudiante?.id === estudiante.id
                      ? "bg-purple-50 border-purple-600 text-purple-900 shadow-sm"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100")
                  }
                >
                  <div className="font-medium capitalize leading-snug">
                    {estudiante.apellido} {estudiante.nombre}
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-gray-500">
                    <span>Doc: {estudiante.documento || 'N/A'}</span>
                    <span className="text-gray-300" aria-hidden="true">|</span>
                    <span className="max-w-full truncate text-xs font-semibold uppercase tracking-wide text-purple-700">
                      {obtenerNombreCurso(estudiante)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel de Pagos */}
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

              <section className="mb-6 rounded-lg border border-purple-100 bg-purple-50/50 p-4">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Valores personalizados</h3>
                    <p className="text-sm text-slate-600">
                      Ajusta el valor de un concepto solo para este estudiante.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr] xl:grid-cols-[1fr_0.7fr_1.3fr_auto]">
                  <select
                    value={valorPersonalizadoData.tipo_pago_id}
                    onChange={(e) => handleTipoValorPersonalizadoChange(e.target.value)}
                    className="w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="">Selecciona concepto</option>
                    {tiposPagos.map((tipoPago) => (
                      <option key={tipoPago.id} value={tipoPago.id}>
                        {tipoPago.nombre} - base {formatearMoneda(tipoPago.valor)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorPersonalizadoData.valor}
                    onChange={(e) => setValorPersonalizadoData({ ...valorPersonalizadoData, valor: e.target.value })}
                    className="w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="Valor personalizado"
                  />

                  <input
                    type="text"
                    value={valorPersonalizadoData.motivo}
                    onChange={(e) => setValorPersonalizadoData({ ...valorPersonalizadoData, motivo: e.target.value })}
                    className="w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="Motivo o acuerdo"
                    maxLength={250}
                  />

                  <button
                    type="button"
                    onClick={guardarValorPersonalizado}
                    disabled={guardandoValorPersonalizado}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
                  >
                    {guardandoValorPersonalizado ? "Guardando..." : "Guardar valor"}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2">
                  {valoresPersonalizados.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-purple-200 bg-white/70 p-3 text-sm text-slate-500">
                      Este estudiante usa los valores normales de su curso.
                    </p>
                  ) : (
                    valoresPersonalizados.map((valorPersonalizado) => (
                      <div
                        key={valorPersonalizado.id}
                        className="flex flex-col gap-3 rounded-lg border border-purple-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{valorPersonalizado.tipo_pago_nombre}</p>
                          <p className="text-sm text-slate-600">
                            Personalizado: <span className="font-semibold text-purple-700">{formatearMoneda(valorPersonalizado.valor)}</span>
                            {" · "}
                            Curso/base: {formatearMoneda(valorPersonalizado.valor_curso ?? valorPersonalizado.valor_base)}
                          </p>
                          {valorPersonalizado.motivo && (
                            <p className="text-xs text-slate-500">Motivo: {valorPersonalizado.motivo}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleTipoValorPersonalizadoChange(valorPersonalizado.tipo_pago_id)}
                            className="rounded-lg border border-purple-200 px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => quitarValorPersonalizado(valorPersonalizado)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {showForm && (
                <form onSubmit={handlePagoSubmit} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="mb-5 grid grid-cols-2 rounded-xl border border-gray-200 bg-white p-1" role="group" aria-label="Tipo de registro de pago">
                    <button
                      type="button"
                      onClick={() => cambiarModoPago("normal")}
                      className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                        modoPago === "normal"
                          ? "bg-purple-700 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Pago pendiente
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarModoPago("adelantado")}
                      className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                        modoPago === "adelantado"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Meses adelantados
                    </button>
                  </div>

                  {modoPago === "normal" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Concepto de Pago</label>
                      <select
                        value={pagoData.venta_id ? `CargoVenta_${pagoData.venta_id}` : pagoData.descripcion}
                        onChange={(e) => seleccionarConceptoPendiente(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        required
                      >
                        <option value="">-- Seleccione un Concepto --</option>

                        {ventasPendientes.length > 0 && (
                          <optgroup label="Cargos de Inventario (Pendientes)">
                            {ventasPendientes.map(vp => (
                              <option key={`venta_${vp.id}`} value={`CargoVenta_${vp.id}`}>
                                {vp.descripcion} (${vp.total.toLocaleString()})
                              </option>
                            ))}
                          </optgroup>
                        )}

                        <optgroup label="Pensiones, Matrícula y Colegiatura">
                          {deudasEstudiante.length > 0 ? deudasEstudiante.map((d, index) => (
                            <option key={`deuda_${index}`} value={d.concepto}>
                              {d.concepto} (${d.deuda.toLocaleString()}) {d.pagado > 0 ? '- Saldo' : ''}
                            </option>
                          )) : (
                            <option disabled>No hay deudas pendientes</option>
                          )}
                        </optgroup>
                      </select>

                      {deudaPendienteSeleccionada?.tipo_cobro === "mensual" && (
                        <section className="mt-4 overflow-hidden rounded-xl border border-purple-200 bg-purple-50/60">
                          <div className="flex flex-col gap-3 border-b border-purple-100 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-purple-950">Meses pendientes</h3>
                                {opcionVencidaSeleccionada?.cuotas?.length > 0 && (
                                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                                    {opcionVencidaSeleccionada.cuotas.length} {opcionVencidaSeleccionada.cuotas.length === 1 ? "mes" : "meses"}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-gray-600">
                                El mes más antiguo se selecciona primero. Puedes elegir varios.
                              </p>
                            </div>
                            {opcionVencidaSeleccionada?.cuotas?.length > 0 && !abonoLibre && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => actualizarCuotasSeleccionadas(
                                    opcionVencidaSeleccionada,
                                    [opcionVencidaSeleccionada.cuotas[0].periodo]
                                  )}
                                  className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50"
                                >
                                  Más antiguo
                                </button>
                                <button
                                  type="button"
                                  onClick={() => actualizarCuotasSeleccionadas(
                                    opcionVencidaSeleccionada,
                                    todasLasCuotasSeleccionadas
                                      ? [opcionVencidaSeleccionada.cuotas[0].periodo]
                                      : opcionVencidaSeleccionada.cuotas.map((cuota) => cuota.periodo)
                                  )}
                                  className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50"
                                >
                                  {todasLasCuotasSeleccionadas ? "Solo el más antiguo" : "Seleccionar todos"}
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            {loadingOpcionesVencidas ? (
                              <div className="flex items-center gap-2 rounded-lg bg-white p-3 text-sm font-medium text-purple-800">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" aria-hidden="true" />
                                Consultando cuotas vencidas...
                              </div>
                            ) : errorOpcionesVencidas ? (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                <p>{errorOpcionesVencidas}</p>
                                <button
                                  type="button"
                                  onClick={() => cargarOpcionesVencidas()}
                                  className="mt-2 font-bold underline"
                                >
                                  Reintentar
                                </button>
                              </div>
                            ) : abonoLibre ? (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <p className="text-sm font-semibold text-amber-900">Abono libre sin asignación mensual</p>
                                <p className="mt-1 text-xs text-amber-800">El monto seguirá siendo editable y se aplicará con la regla anterior.</p>
                                {opcionVencidaSeleccionada?.cuotas?.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => actualizarCuotasSeleccionadas(
                                      opcionVencidaSeleccionada,
                                      [opcionVencidaSeleccionada.cuotas[0].periodo]
                                    )}
                                    className="mt-2 text-sm font-bold text-purple-700 underline"
                                  >
                                    Volver a seleccionar meses
                                  </button>
                                )}
                              </div>
                            ) : opcionVencidaSeleccionada?.cuotas?.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {opcionVencidaSeleccionada.cuotas.map((cuota) => {
                                  const seleccionada = periodosVencidosSeleccionados.has(cuota.periodo);
                                  return (
                                    <label
                                      key={cuota.periodo}
                                      className={`cursor-pointer rounded-xl border p-3 transition ${
                                        seleccionada
                                          ? "border-purple-500 bg-purple-100 shadow-sm ring-1 ring-purple-300"
                                          : "border-gray-200 bg-white hover:border-purple-300"
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <input
                                          type="checkbox"
                                          checked={seleccionada}
                                          onChange={() => {
                                            const siguientes = new Set(periodosVencidosSeleccionados);
                                            if (seleccionada) siguientes.delete(cuota.periodo);
                                            else siguientes.add(cuota.periodo);
                                            if (siguientes.size === 0) return;
                                            actualizarCuotasSeleccionadas(opcionVencidaSeleccionada, [...siguientes]);
                                          }}
                                          className="mt-1 h-4 w-4 accent-purple-700"
                                        />
                                        <span className="min-w-0 flex-1">
                                          <span className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-bold text-gray-900">{formatearPeriodo(cuota.periodo)}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                              cuota.estado === "parcial"
                                                ? "bg-amber-100 text-amber-800"
                                                : "bg-red-100 text-red-700"
                                            }`}>
                                              {cuota.estado === "parcial" ? "Abono parcial" : "Vencido"}
                                            </span>
                                          </span>
                                          <span className="mt-2 flex items-end justify-between gap-2 text-sm">
                                            <span className="text-gray-500">Saldo de la cuota</span>
                                            <strong className="text-gray-900">{formatearMoneda(cuota.saldo)}</strong>
                                          </span>
                                        </span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="rounded-lg border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-600">
                                No hay meses vencidos disponibles para este concepto.
                              </p>
                            )}

                            {!abonoLibre && opcionVencidaSeleccionada?.cuotas?.length > 0 && (
                              <div className="mt-3 flex flex-col gap-2 rounded-lg bg-purple-900 p-3 text-white sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-sm">
                                  {pagoData.aplicaciones.length} {pagoData.aplicaciones.length === 1 ? "mes seleccionado" : "meses seleccionados"}
                                </span>
                                <strong className="text-lg">Total: {formatearMoneda(pagoData.monto)}</strong>
                              </div>
                            )}

                            {!abonoLibre && (
                              <button
                                type="button"
                                onClick={activarAbonoLibre}
                                className="mt-3 text-xs font-semibold text-gray-600 underline hover:text-purple-700"
                              >
                                Registrar un abono libre sin seleccionar mes
                              </button>
                            )}
                          </div>
                        </section>
                      )}
                    </div>
                  ) : (
                    <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                      <div className="mb-3">
                        <h3 className="font-bold text-emerald-950">Registrar mensualidades futuras</h3>
                        <p className="mt-1 text-sm text-emerald-800">
                          El sistema selecciona los próximos meses disponibles y evita cobrarlos dos veces.
                        </p>
                      </div>

                      {loadingOpcionesAdelanto ? (
                        <p className="text-sm font-medium text-emerald-800">Consultando meses disponibles...</p>
                      ) : errorOpcionesAdelanto ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          <p>{errorOpcionesAdelanto}</p>
                          <button type="button" onClick={cargarOpcionesAdelanto} className="mt-2 font-bold underline">
                            Reintentar
                          </button>
                        </div>
                      ) : opcionesAdelanto.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-emerald-300 bg-white p-3 text-sm text-gray-600">
                          No hay conceptos mensuales habilitados para adelantar.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Concepto mensual</label>
                            <select
                              value={pagoData.tipo_pago_id_adelanto}
                              onChange={(e) => seleccionarConceptoAdelanto(e.target.value)}
                              className="w-full rounded-lg border border-emerald-200 bg-white p-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                              required
                            >
                              <option value="">-- Selecciona un concepto --</option>
                              {opcionesAdelanto.map((opcion) => (
                                <option key={opcion.tipo_pago_id} value={opcion.tipo_pago_id} disabled={opcion.max_meses === 0}>
                                  {opcion.concepto} · {formatearMoneda(opcion.valor_unitario)} por mes
                                  {opcion.max_meses === 0 ? " · Sin meses disponibles" : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          {opcionAdelantoSeleccionada && opcionAdelantoSeleccionada.max_meses > 0 && (
                            <>
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-sm font-semibold text-gray-700">Cantidad de meses</label>
                                  <select
                                    value={pagoData.cantidad_meses}
                                    onChange={(e) => cambiarCantidadAdelanto(e.target.value)}
                                    className="w-full rounded-lg border border-emerald-200 bg-white p-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                  >
                                    {Array.from({ length: opcionAdelantoSeleccionada.max_meses }, (_, index) => index + 1).map((cantidad) => (
                                      <option key={cantidad} value={cantidad}>
                                        {cantidad} {cantidad === 1 ? "mes" : "meses"}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="rounded-lg border border-emerald-200 bg-white p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Total del adelanto</p>
                                  <p className="mt-1 text-xl font-black text-emerald-950">{formatearMoneda(pagoData.monto)}</p>
                                </div>
                              </div>

                              <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Meses que quedarán cubiertos</p>
                                <div className="flex flex-wrap gap-2">
                                  {periodosAdelantoSeleccionados.map((periodo) => (
                                    <span key={periodo.periodo} className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm font-bold text-emerald-800">
                                      {periodo.etiqueta}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </section>
                  )}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={pagoData.fecha}
                        onChange={(e) => setPagoData({ ...pagoData, fecha: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {modoPago === "adelantado" || pagoData.aplicaciones.length > 0
                          ? "Total calculado ($)"
                          : "Monto ($)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={pagoData.monto}
                        onChange={(e) => {
                          const monto = e.target.value;
                          setPagoData((actual) => ({
                            ...actual,
                            monto,
                            metodos: actual.metodos.length === 1
                              ? [{ ...actual.metodos[0], monto }]
                              : actual.metodos,
                          }));
                        }}
                        onBlur={(e) => {
                          if (modoPago === "normal" && e.target.value) validarMontoContraSaldo(Number(e.target.value));
                        }}
                        readOnly={modoPago === "adelantado" || pagoData.aplicaciones.length > 0}
                        className={`w-full rounded-lg border p-2 focus:border-transparent focus:ring-2 ${
                          modoPago === "adelantado"
                            ? "border-emerald-200 bg-emerald-50 font-bold text-emerald-950 focus:ring-emerald-300"
                            : pagoData.aplicaciones.length > 0
                              ? "border-purple-200 bg-purple-50 font-bold text-purple-950 focus:ring-purple-300"
                              : "border-gray-300 bg-white focus:ring-purple-500"
                        }`}
                        required
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Métodos de Pago (puede elegir varios)</label>
                    <div className="flex flex-col gap-2">
                      {['efectivo', 'tarjeta', 'transferencia'].map((tipo) => {
                        const idx = pagoData.metodos.findIndex(m => m.tipo === tipo);
                        const checked = idx !== -1;
                        return (
                          <div key={tipo} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`metodo-${tipo}`}
                              checked={checked}
                              onChange={e => {
                                let nuevosMetodos = [...pagoData.metodos];
                                if (e.target.checked) {
                                  nuevosMetodos.push({
                                    tipo,
                                    monto: nuevosMetodos.length === 0
                                      ? pagoData.monto
                                      : '',
                                    nota: ''
                                  });
                                } else {
                                  nuevosMetodos = nuevosMetodos.filter(m => m.tipo !== tipo);
                                }
                                setPagoData({ ...pagoData, metodos: nuevosMetodos });
                              }}
                            />
                            <label htmlFor={`metodo-${tipo}`} className="capitalize w-24">{tipo}</label>
                            {checked && (
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Monto"
                                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white w-32"
                                  value={pagoData.metodos[idx]?.monto || ''}
                                  onChange={e => {
                                    const nuevosMetodos = pagoData.metodos.map(m =>
                                      m.tipo === tipo ? { ...m, monto: e.target.value } : m
                                    );
                                    setPagoData({ ...pagoData, metodos: nuevosMetodos });
                                  }}
                                  required
                                />
                                {tipo === 'transferencia' && (
                                  <input
                                    type="text"
                                    placeholder="Banco o plataforma"
                                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white w-full sm:w-56"
                                    value={pagoData.metodos[idx]?.nota || ''}
                                    onChange={e => {
                                      const nuevosMetodos = pagoData.metodos.map(m =>
                                        m.tipo === tipo ? { ...m, nota: e.target.value } : m
                                      );
                                      setPagoData({ ...pagoData, metodos: nuevosMetodos });
                                    }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="submit"
                      disabled={
                        registrandoPago ||
                        (modoPago === "adelantado" && (
                          loadingOpcionesAdelanto ||
                          !pagoData.tipo_pago_id_adelanto ||
                          Number(pagoData.cantidad_meses) < 1
                        ))
                      }
                      className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-300"
                    >
                      {registrandoPago && (
                        <span
                          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                          aria-hidden="true"
                        />
                      )}
                      {registrandoPago
                        ? "Registrando..."
                        : modoPago === "adelantado"
                          ? "Registrar adelanto"
                          : "Registrar Pago"}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <h3 className="text-lg font-medium text-gray-700 mt-6 mb-3 border-b pb-2">Historial de Pagos</h3>
              <div className="flex flex-col gap-3">
                {pagos.length === 0 ? (
                  <p className="text-gray-500 italic">No hay pagos registrados para este estudiante.</p>
                ) : (
                  pagos.map((pago) => (
                      <div key={pago.pago_id} className={`p-4 rounded-lg border transition-colors ${
                        pago.anulado
                          ? "bg-red-50 border-red-200"
                          : "bg-gray-50 border-gray-200 hover:border-purple-300"
                      }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-medium text-lg ${pago.anulado ? "line-through text-gray-500" : ""}`}>
                              {pago.descripcion}
                            </p>
                            {pago.anulado && (
                              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                                Anulado
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500">{pago.fecha}</p>
                          {pago.tipo_pago && (
                            <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              Método: {pago.tipo_pago}
                            </span>
                          )}
                          {pago.anulado && (
                            <p className="mt-2 text-sm text-red-700">
                              Motivo: {pago.motivo_anulacion || "Sin motivo registrado"}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${pago.anulado ? "text-red-600 line-through" : "text-green-600"}`}>
                            ${pago.monto.toLocaleString()}
                          </p>
                          <div className="mt-2 flex flex-col items-end gap-2">
                            <button
                              onClick={() => imprimirFactura(pago)}
                              disabled={pago.anulado}
                              className="text-sm text-purple-700 hover:text-purple-800 disabled:cursor-not-allowed disabled:text-gray-400"
                            >
                              <span>🖨️</span> Imprimir Recibo
                            </button>
                            {!pago.anulado && (
                              <button
                                onClick={() => anularPago(pago)}
                                className="text-sm font-semibold text-red-600 hover:text-red-700"
                              >
                                Anular pago
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">💰</div>
              <p>Selecciona un estudiante para ver sus pagos</p>
            </div>
          )}
        </div>
      </div>

      {pagoAImprimir && selectedEstudiante && (
        <div className="fixed inset-0 bg-slate-100 z-50 overflow-auto">
          <div className="fixed top-4 left-4 no-print z-[60]">
            <button
              onClick={() => setPagoAImprimir(null)}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-900"
            >
              ← Volver
            </button>
          </div>
          <DocumentoImprimible
            tipo="voucher_pago"
            titulo="Comprobante de Pago"
            subtitulo={`Factura #FAC-${(pagoAImprimir.pago_id || 0).toString().padStart(6, "0")}`}
          >
            <FacturaModerna pago={pagoAImprimir} estudiante={selectedEstudiante} />
          </DocumentoImprimible>
        </div>
      )}
    </div>
  );
}

export default PagosAdmin;
