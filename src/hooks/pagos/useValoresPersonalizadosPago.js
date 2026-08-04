import { useState } from "react";
import Swal from "sweetalert2";
import pagosApi from "../../services/pagosApi";
import { crearValorPersonalizadoInicial } from "../../utils/pagos/contratos";

export default function useValoresPersonalizadosPago({
  selectedEstudiante,
  valoresPersonalizados,
  actualizarValoresPersonalizados,
  cargarDeudasEstudiante,
  cargarOpcionesVencidas,
}) {
  const [valorPersonalizadoData, setValorPersonalizadoData] = useState(
    crearValorPersonalizadoInicial()
  );
  const [guardandoValorPersonalizado, setGuardandoValorPersonalizado] = useState(false);

  const reiniciarValorPersonalizado = () =>
    setValorPersonalizadoData(crearValorPersonalizadoInicial());

  const seleccionarTipoValorPersonalizado = (tipoPagoId) => {
    const existente = valoresPersonalizados.find(
      (valor) => Number(valor.tipo_pago_id) === Number(tipoPagoId)
    );
    setValorPersonalizadoData({
      tipo_pago_id: tipoPagoId,
      valor: existente ? String(existente.valor) : "",
      motivo: existente?.motivo || "",
    });
  };

  const actualizarCampoValorPersonalizado = (campo, valor) =>
    setValorPersonalizadoData((actual) => ({ ...actual, [campo]: valor }));

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
      const data = await pagosApi.guardarValorPersonalizado(
        selectedEstudiante.id,
        tipoPagoId,
        { valor, motivo: valorPersonalizadoData.motivo, activo: true }
      );
      actualizarValoresPersonalizados(data.valores || []);
      reiniciarValorPersonalizado();
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
      await pagosApi.quitarValorPersonalizado(
        selectedEstudiante.id,
        valorPersonalizado.tipo_pago_id
      );
      actualizarValoresPersonalizados((actuales) =>
        actuales.filter(
          (item) => Number(item.tipo_pago_id) !== Number(valorPersonalizado.tipo_pago_id)
        )
      );
      reiniciarValorPersonalizado();
      cargarDeudasEstudiante(selectedEstudiante.id);
      cargarOpcionesVencidas(selectedEstudiante.id);
      Swal.fire("Actualizado", "El valor personalizado fue retirado.", "success");
    } catch (error) {
      console.error("Error quitando valor personalizado:", error);
      const detalle = error.response?.data?.detail;
      Swal.fire("Error", detalle || "No se pudo quitar el valor personalizado.", "error");
    }
  };

  return {
    valorPersonalizadoData,
    guardandoValorPersonalizado,
    reiniciarValorPersonalizado,
    seleccionarTipoValorPersonalizado,
    actualizarCampoValorPersonalizado,
    guardarValorPersonalizado,
    quitarValorPersonalizado,
  };
}
