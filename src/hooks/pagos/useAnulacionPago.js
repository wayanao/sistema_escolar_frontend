import Swal from "sweetalert2";
import pagosApi from "../../services/pagosApi";

export default function useAnulacionPago({
  selectedEstudiante,
  cargarHistorialPagos,
  cargarVentasPendientes,
  cargarDeudasEstudiante,
  cargarOpcionesVencidas,
}) {
  const anularPago = async (pago) => {
    if (!selectedEstudiante || pago.anulado) return;
    const result = await Swal.fire({
      title: "Anular pago",
      text: "El pago quedará visible como anulado y no contará como ingreso válido.",
      input: "textarea",
      inputLabel: "Motivo de anulación",
      inputPlaceholder: "Ej: Error en el valor registrado",
      inputAttributes: { maxlength: 300 },
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
      await pagosApi.anularPago(pago.pago_id, { motivo: result.value.trim() });
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

  return { anularPago };
}
