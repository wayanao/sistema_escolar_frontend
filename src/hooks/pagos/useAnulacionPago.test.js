import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import pagosApi from "../../services/pagosApi";
import useAnulacionPago from "./useAnulacionPago";
import { opcionesVentanaExito } from "../ventanaExito";

vi.mock("../../services/pagosApi", () => ({
  default: { anularPago: vi.fn() },
}));

vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn() },
}));

function crearProps(sobrescrituras = {}) {
  return {
    selectedEstudiante: { id: 7 },
    cargarHistorialPagos: vi.fn(),
    cargarVentasPendientes: vi.fn(),
    cargarDeudasEstudiante: vi.fn(),
    cargarOpcionesVencidas: vi.fn(),
    cargarOpcionesAdelanto: vi.fn(),
    ...sobrescrituras,
  };
}

describe("useAnulacionPago", () => {
  beforeEach(() => {
    pagosApi.anularPago.mockReset();
    Swal.fire.mockReset();
  });

  it("no abre confirmación para pagos ya anulados", async () => {
    const { result } = renderHook(() => useAnulacionPago(crearProps()));

    await act(async () => result.current.anularPago({ pago_id: 42, anulado: true }));

    expect(Swal.fire).not.toHaveBeenCalled();
    expect(pagosApi.anularPago).not.toHaveBeenCalled();
  });

  it("envía el motivo recortado y recarga las cinco consultas", async () => {
    const props = crearProps();
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true, value: "  Error manual  " });
    pagosApi.anularPago.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useAnulacionPago(props));

    await act(async () => result.current.anularPago({ pago_id: 42, anulado: false }));

    expect(pagosApi.anularPago).toHaveBeenCalledWith(42, { motivo: "Error manual" });
    expect(props.cargarHistorialPagos).toHaveBeenCalledWith(7);
    expect(props.cargarVentasPendientes).toHaveBeenCalledWith(7);
    expect(props.cargarDeudasEstudiante).toHaveBeenCalledWith(7);
    expect(props.cargarOpcionesVencidas).toHaveBeenCalledWith(7);
    // Anular un adelanto libera esos meses, que se ven en lo que debe.
    expect(props.cargarOpcionesAdelanto).toHaveBeenCalledWith(7);
    // La ventana de éxito común (tarjeta blanca), con botón «Entendido».
    expect(Swal.fire).toHaveBeenLastCalledWith(
      opcionesVentanaExito({
        title: "Pago anulado",
        text: "La deuda y los reportes se actualizarán con este cambio.",
      }),
    );
  });

  it("conserva el error del backend al anular", async () => {
    const error = { response: { data: { detail: "No anulable" } } };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true, value: "Motivo válido" });
    pagosApi.anularPago.mockRejectedValue(error);
    const { result } = renderHook(() => useAnulacionPago(crearProps()));

    await act(async () => result.current.anularPago({ pago_id: 42, anulado: false }));

    expect(Swal.fire).toHaveBeenLastCalledWith("Error", "No anulable", "error");
    consoleError.mockRestore();
  });
});
