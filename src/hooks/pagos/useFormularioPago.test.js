import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import useFormularioPago from "./useFormularioPago";

vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn() },
}));

const deudaMensual = {
  concepto: "Pensión",
  concepto_id: 11,
  tipo_cobro: "mensual",
  deuda: 180000,
};

const opcionVencida = {
  tipo_pago_id: 11,
  cuotas: [
    { periodo: "2026-06", saldo: 100000 },
    { periodo: "2026-07", saldo: 80000 },
  ],
};

const opcionAdelanto = {
  tipo_pago_id: 11,
  concepto: "Pensión",
  max_meses: 2,
  periodos_disponibles: [
    { periodo: "2026-08", etiqueta: "Agosto", saldo: 100000 },
    { periodo: "2026-09", etiqueta: "Septiembre", saldo: 100000 },
  ],
};

function crearProps(sobrescrituras = {}) {
  return {
    selectedEstudiante: { id: 7 },
    ventasPendientes: [],
    deudasEstudiante: [deudaMensual],
    tiposPagos: [{ id: 11, nombre: "Pensión", valor: 100000 }],
    opcionesVencidas: [opcionVencida],
    opcionesAdelanto: [opcionAdelanto],
    cargarOpcionesVencidas: vi.fn(),
    cargarOpcionesAdelanto: vi.fn(),
    reiniciarOpcionesAdelanto: vi.fn(),
    ...sobrescrituras,
  };
}

describe("useFormularioPago", () => {
  beforeEach(() => {
    Swal.fire.mockReset();
  });

  it("selecciona cuotas y sincroniza un único método con el total", () => {
    const { result } = renderHook(() => useFormularioPago(crearProps()));

    act(() => result.current.prepararFormulario(7));
    act(() => result.current.seleccionarConceptoPendiente("Pensión"));
    expect(result.current.pagoData.aplicaciones).toEqual([
      { tipo_pago_id: 11, periodo: "2026-06", monto: 100000 },
    ]);
    expect(result.current.pagoData.monto).toBe("100000");

    act(() => result.current.alternarMetodoPago("efectivo", true));
    act(() =>
      result.current.actualizarCuotasSeleccionadas(opcionVencida, [
        "2026-06",
        "2026-07",
      ])
    );

    expect(result.current.pagoData.monto).toBe("180000");
    expect(result.current.pagoData.metodos).toEqual([
      { tipo: "efectivo", monto: "180000", nota: "" },
    ]);
  });

  it("administra métodos combinados y sus notas sin convertir montos", () => {
    const { result } = renderHook(() => useFormularioPago(crearProps()));
    act(() => result.current.prepararFormulario(7));
    act(() => result.current.seleccionarConceptoPendiente("Pensión"));
    act(() => result.current.alternarMetodoPago("efectivo", true));
    act(() => result.current.alternarMetodoPago("transferencia", true));
    act(() => result.current.cambiarMontoMetodo("efectivo", "60000"));
    act(() => result.current.cambiarMontoMetodo("transferencia", "40000"));
    act(() => result.current.cambiarNotaMetodo("transferencia", "Banco"));

    expect(result.current.pagoData.metodos).toEqual([
      { tipo: "efectivo", monto: "60000", nota: "" },
      { tipo: "transferencia", monto: "40000", nota: "Banco" },
    ]);
  });

  it("calcula la distribución y el excedente del adelanto por monto", () => {
    const { result } = renderHook(() => useFormularioPago(crearProps()));
    act(() => result.current.cambiarModoPago("adelantado"));
    act(() => result.current.seleccionarConceptoAdelanto("11"));
    act(() => result.current.cambiarModalidadAdelanto("monto"));
    act(() => result.current.cambiarMontoDistribuir("150000"));

    expect(result.current.periodosAdelantoSeleccionados).toEqual([
      {
        periodo: "2026-08",
        etiqueta: "Agosto",
        saldo: 100000,
        monto_aplicado: 100000,
        saldo_restante: 0,
      },
      {
        periodo: "2026-09",
        etiqueta: "Septiembre",
        saldo: 100000,
        monto_aplicado: 50000,
        saldo_restante: 50000,
      },
    ]);
    expect(result.current.saldoAdelantoSinDistribuir).toBe(0);
  });

  it("conserva la advertencia cuando el monto supera el saldo", () => {
    const { result } = renderHook(() => useFormularioPago(crearProps()));
    act(() => result.current.seleccionarConceptoPendiente("Pensión"));

    expect(result.current.validarMontoContraSaldo(200000)).toBe(false);
    expect(Swal.fire).toHaveBeenCalledWith(
      "Monto mayor a la deuda",
      expect.stringContaining("180.000"),
      "warning"
    );
  });
});
