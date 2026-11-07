import { useState } from "react";
import Swal from "sweetalert2";
import pagosApi from "../../services/pagosApi";
import {
  crearPayloadPagoAdelantado,
  crearPayloadPagoNormal,
  idsDelPagoRegistrado,
} from "../../utils/pagos/contratos";
import { formatearMoneda, formatearPeriodo } from "../../utils/pagos/formatos";
import { mostrarEspera } from "../ventanaExito";

export default function useRegistroPago({
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
  anioLectivoId,
  alRegistrar,
}) {
  const [registrandoPago, setRegistrandoPago] = useState(false);

  const registrarPago = async (evento) => {
    evento.preventDefault();
    if (registrandoPago) return;
    if (!selectedEstudiante) {
      Swal.fire('Error', 'Selecciona un estudiante antes de registrar el pago', 'error');
      return;
    }

    const esDistribucionAdelanto =
      modoPago === "adelantado" && pagoData.modalidad_adelanto === "monto";
    if (modoPago === "adelantado" && !pagoData.tipo_pago_id_adelanto) {
      Swal.fire("Datos incompletos", "Selecciona el concepto mensual.", "warning");
      return;
    }
    if (esDistribucionAdelanto) {
      if (Number(pagoData.monto_distribuir) <= 0) {
        Swal.fire("Monto requerido", "Escribe el valor recibido que deseas distribuir.", "warning");
        return;
      }
      if (saldoAdelantoSinDistribuir > 0) {
        Swal.fire(
          "Monto fuera del año seleccionado",
          `${formatearMoneda(saldoAdelantoSinDistribuir)} quedarían sin un mes asignado. Reduce el monto.`,
          "warning"
        );
        return;
      }
    } else if (modoPago === "adelantado" && Number(pagoData.cantidad_meses) < 1) {
      Swal.fire("Datos incompletos", "Selecciona la cantidad de meses a adelantar.", "warning");
      return;
    }

    if (!pagoData.metodos.length || pagoData.metodos.some((metodo) => !metodo.monto || metodo.monto <= 0)) {
      Swal.fire('Error', 'Debe ingresar al menos un método y monto válido', 'error');
      return;
    }
    const total = pagoData.metodos.reduce(
      (acumulado, metodo) => acumulado + parseFloat(metodo.monto || 0),
      0
    );
    if (!pagoData.monto || parseFloat(pagoData.monto) !== total) {
      Swal.fire('Error', 'La suma de los métodos debe ser igual al monto total', 'error');
      return;
    }
    if (modoPago === "normal" && !validarMontoContraSaldo(total)) return;

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
      const meses = pagoData.aplicaciones
        .map((item) => formatearPeriodo(item.periodo))
        .join(", ");
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

    if (esDistribucionAdelanto) {
      const detalle = periodosAdelantoSeleccionados
        .map((item) => `${item.etiqueta}: ${formatearMoneda(item.monto_aplicado)}`)
        .join("; ");
      const advertenciaDeuda = Number(deudaDelConceptoAdelantado?.deuda || 0) > 0
        ? ` El estudiante conserva una deuda vencida de ${formatearMoneda(deudaDelConceptoAdelantado.deuda)}.`
        : "";
      const confirmacion = await Swal.fire({
        title: "Confirmar distribución del adelanto",
        text: `Se distribuirán ${formatearMoneda(total)} así: ${detalle}.${advertenciaDeuda}`,
        icon: advertenciaDeuda ? "warning" : "question",
        showCancelButton: true,
        confirmButtonText: "Sí, distribuir monto",
        cancelButtonText: "Revisar",
        confirmButtonColor: "#059669",
      });
      if (!confirmacion.isConfirmed) return;
    }

    setRegistrandoPago(true);
    // Una sola espera (pedido del usuario el 2026-11-07): la tarjeta sale ya,
    // con la barrita llenándose, y cuando el pago queda pasa a «¡Éxito!» sin
    // cerrarse. Si falla, la ventana de error ocupa su lugar.
    const espera = mostrarEspera({
      title: modoPago === "adelantado" ? "Registrando el adelanto…" : "Registrando el pago…",
    });
    try {
      const estudianteId = selectedEstudiante.id;
      let resultado;
      if (modoPago === "adelantado") {
        resultado = await pagosApi.registrarPagoAdelantado(
          crearPayloadPagoAdelantado(
            pagoData,
            estudianteId,
            esDistribucionAdelanto,
            anioLectivoId,
          )
        );
      } else {
        resultado = await pagosApi.registrarPago(
          crearPayloadPagoNormal(pagoData, estudianteId, anioLectivoId)
        );
      }
      reiniciarFormularioTrasRegistro(estudianteId);
      // El historial muestra solo el pago recién hecho (todas sus filas).
      alRegistrar?.(idsDelPagoRegistrado(resultado));
      // Dice a qué meses se aplicó y se cierra sola cuando la barrita llega
      // al final (TIEMPO_PARA_LEER, para que dé tiempo de leer).
      espera.exito({
        title: '¡Éxito!',
        text: esDistribucionAdelanto
          ? `El monto quedó distribuido en ${resultado.periodos?.length || 0} meses.`
          : modoPago === "adelantado"
          ? `${resultado.periodos?.length || 0} meses adelantados quedaron registrados correctamente.`
          : pagoData.aplicaciones.length > 0
            ? `Pago aplicado a ${pagoData.aplicaciones.map((item) => formatearPeriodo(item.periodo)).join(", ")}.`
          : 'Pago registrado correctamente',
      });
      // Un pago también cambia los meses que quedan por adelantar, que se ven
      // en lo que debe.
      Promise.all([
        cargarHistorialPagos(estudianteId),
        cargarVentasPendientes(estudianteId),
        cargarDeudasEstudiante(estudianteId),
        cargarOpcionesVencidas(estudianteId),
        cargarOpcionesAdelanto(estudianteId),
      ]).catch((reloadError) => {
        console.error("Error recargando datos despues del pago:", reloadError);
      });
    } catch (error) {
      console.error("Error:", error);
      const detalle = error.response?.data?.detail;
      const mensaje = typeof detalle === "string"
        ? detalle
        : error.response
          ? "El servidor rechazó el pago. Revisa los datos e intenta nuevamente."
          : "No se pudo conectar con el servidor. Verifica que el backend esté encendido.";
      Swal.fire('Error', mensaje, 'error');
    } finally {
      setRegistrandoPago(false);
    }
  };

  return { registrandoPago, registrarPago };
}
