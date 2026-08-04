import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import pagosApi from "../../services/pagosApi";
import useRegistroPago from "./useRegistroPago";

vi.mock("../../services/pagosApi", () => ({
  default: {
    registrarPago: vi.fn(),
    registrarPagoAdelantado: vi.fn(),
  },
}));

vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn() },
}));

function crearPago(sobrescrituras = {}) {
  return {
    estudiante_id: 7,
    descripcion: "Pensión",
    fecha: "2026-08-04",
    monto: "100000",
    venta_id: null,
    metodos: [{ tipo: "efectivo", monto: "100000", nota: "" }],
    tipo_pago_id_adelanto: "",
    cantidad_meses: 1,
    modalidad_adelanto: "meses",
    monto_distribuir: "",
    aplicaciones: [{ tipo_pago_id: 11, periodo: "2026-06", monto: 100000 }],
    ...sobrescrituras,
  };
}

function crearProps(sobrescrituras = {}) {
  return {
    selectedEstudiante: { id: 7 },
    pagoData: crearPago(),
    modoPago: "normal",
    abonoLibre: false,
    deudasEstudiante: [
      { concepto: "Pensión", concepto_id: 11, tipo_cobro: "mensual", deuda: 100000 },
    ],
    opcionesVencidas: [{ tipo_pago_id: 11, cuotas: [{ periodo: "2026-06" }] }],
    periodosAdelantoSeleccionados: [],
    saldoAdelantoSinDistribuir: 0,
    deudaDelConceptoAdelantado: null,
    validarMontoContraSaldo: vi.fn(() => true),
    reiniciarFormularioTrasRegistro: vi.fn(),
    limpiarOpcionesAdelanto: vi.fn(),
    cargarHistorialPagos: vi.fn(),
    cargarVentasPendientes: vi.fn(),
    cargarDeudasEstudiante: vi.fn(),
    cargarOpcionesVencidas: vi.fn(),
    ...sobrescrituras,
  };
}

describe("useRegistroPago", () => {
  beforeEach(() => {
    pagosApi.registrarPago.mockReset();
    pagosApi.registrarPagoAdelantado.mockReset();
    Swal.fire.mockReset();
  });

  it("rechaza métodos cuya suma no coincide con el total", async () => {
    const props = crearProps({
      pagoData: crearPago({
        aplicaciones: [],
        metodos: [{ tipo: "efectivo", monto: "90000", nota: "" }],
      }),
    });
    const { result } = renderHook(() => useRegistroPago(props));

    await act(async () => result.current.registrarPago({ preventDefault: vi.fn() }));

    expect(pagosApi.registrarPago).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(
      "Error",
      "La suma de los métodos debe ser igual al monto total",
      "error"
    );
  });

  it("confirma, registra y recarga un pago mensual", async () => {
    const props = crearProps();
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
    pagosApi.registrarPago.mockResolvedValue({ pago_id: 42 });
    const { result } = renderHook(() => useRegistroPago(props));

    await act(async () => result.current.registrarPago({ preventDefault: vi.fn() }));

    expect(pagosApi.registrarPago).toHaveBeenCalledWith({
      estudiante_id: 7,
      descripcion: "Pensión",
      fecha: "2026-08-04",
      monto: "100000",
      metodos: [{ tipo: "efectivo", monto: "100000", nota: "" }],
      aplicaciones: [{ tipo_pago_id: 11, periodo: "2026-06", monto: 100000 }],
    });
    expect(props.reiniciarFormularioTrasRegistro).toHaveBeenCalledWith(7);
    expect(props.limpiarOpcionesAdelanto).toHaveBeenCalledTimes(1);
    expect(props.cargarHistorialPagos).toHaveBeenCalledWith(7);
    expect(props.cargarVentasPendientes).toHaveBeenCalledWith(7);
    expect(props.cargarDeudasEstudiante).toHaveBeenCalledWith(7);
    expect(props.cargarOpcionesVencidas).toHaveBeenCalledWith(7);
  });

  it("conserva el detalle del backend cuando el registro falla", async () => {
    const error = { response: { data: { detail: "Pago duplicado" } } };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    pagosApi.registrarPago.mockRejectedValue(error);
    const props = crearProps({
      pagoData: crearPago({ aplicaciones: [] }),
      abonoLibre: true,
    });
    const { result } = renderHook(() => useRegistroPago(props));

    await act(async () => result.current.registrarPago({ preventDefault: vi.fn() }));

    expect(Swal.fire).toHaveBeenCalledWith("Error", "Pago duplicado", "error");
    expect(result.current.registrandoPago).toBe(false);
    consoleError.mockRestore();
  });
});
