import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import pagosApi from "../../services/pagosApi";
import useRegistroPago from "./useRegistroPago";
import { opcionesExitoTrasEspera, opcionesVentanaEspera } from "../ventanaExito";

vi.mock("../../services/pagosApi", () => ({
  default: {
    registrarPago: vi.fn(),
    registrarPagoAdelantado: vi.fn(),
  },
}));

// La espera del pago pasa a éxito en la misma ventana y la cierra un reloj
// (ventanaExito.js): por eso hacen falta más partes de SweetAlert.
vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
    update: vi.fn(),
    getFooter: vi.fn(),
    getPopup: vi.fn(),
    isVisible: vi.fn(),
    close: vi.fn(),
  },
}));

const ESPERA_PAGO = {
  title: "Registrando el pago…",
  text: "No cierres ni cambies de página hasta que termine.",
};

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
    cargarHistorialPagos: vi.fn(),
    cargarVentasPendientes: vi.fn(),
    cargarDeudasEstudiante: vi.fn(),
    cargarOpcionesVencidas: vi.fn(),
    cargarOpcionesAdelanto: vi.fn(),
    ...sobrescrituras,
  };
}

describe("useRegistroPago", () => {
  beforeEach(() => {
    pagosApi.registrarPago.mockReset();
    pagosApi.registrarPagoAdelantado.mockReset();
    Swal.fire.mockReset();
    Swal.update.mockReset();
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
    expect(props.cargarHistorialPagos).toHaveBeenCalledWith(7);
    expect(props.cargarVentasPendientes).toHaveBeenCalledWith(7);
    expect(props.cargarDeudasEstudiante).toHaveBeenCalledWith(7);
    expect(props.cargarOpcionesVencidas).toHaveBeenCalledWith(7);
    // Los meses para adelantar se ven en lo que debe: se vuelven a pedir.
    expect(props.cargarOpcionesAdelanto).toHaveBeenCalledWith(7);
    // Una sola espera: la tarjeta de espera pasa a éxito sin cerrarse, con
    // «Entendido» y los meses a los que se aplicó.
    expect(Swal.fire).toHaveBeenLastCalledWith(opcionesVentanaEspera(ESPERA_PAGO));
    expect(Swal.update).toHaveBeenCalledWith(
      opcionesExitoTrasEspera({ title: "¡Éxito!", text: "Pago aplicado a Junio de 2026." }),
    );
  });

  it("la tarjeta de espera sale apenas se confirma, antes de que responda el servidor", async () => {
    const props = crearProps();
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
    let responder;
    pagosApi.registrarPago.mockReturnValue(new Promise((resolve) => { responder = resolve; }));
    const { result } = renderHook(() => useRegistroPago(props));

    let registro;
    await act(async () => {
      registro = result.current.registrarPago({ preventDefault: vi.fn() });
      // Pasa la confirmación: el pago queda esperando al servidor.
      await vi.waitFor(() => expect(pagosApi.registrarPago).toHaveBeenCalled());
    });

    expect(Swal.fire).toHaveBeenLastCalledWith(opcionesVentanaEspera(ESPERA_PAGO));
    expect(Swal.update).not.toHaveBeenCalled();
    expect(result.current.registrandoPago).toBe(true);

    await act(async () => {
      responder({ pago_id: 42 });
      await registro;
    });

    expect(Swal.update).toHaveBeenCalledWith(
      opcionesExitoTrasEspera({ title: "¡Éxito!", text: "Pago aplicado a Junio de 2026." }),
    );
    expect(result.current.registrandoPago).toBe(false);
  });

  it("avisa qué pagos creó, para mostrarlos en el historial", async () => {
    const alRegistrar = vi.fn();
    const props = crearProps({ alRegistrar });
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
    // Dos métodos de pago: el backend crea una fila por cada uno.
    pagosApi.registrarPago.mockResolvedValue({ pago_id: [42, 43] });
    const { result } = renderHook(() => useRegistroPago(props));

    await act(async () => result.current.registrarPago({ preventDefault: vi.fn() }));

    expect(alRegistrar).toHaveBeenCalledWith([42, 43]);
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

    // Primero la tarjeta de espera; el error ocupa su lugar y nunca pasa a éxito.
    expect(Swal.fire).toHaveBeenNthCalledWith(1, opcionesVentanaEspera(ESPERA_PAGO));
    expect(Swal.fire).toHaveBeenLastCalledWith("Error", "Pago duplicado", "error");
    expect(Swal.update).not.toHaveBeenCalled();
    expect(result.current.registrandoPago).toBe(false);
    consoleError.mockRestore();
  });

  it("dirige el pago y sus recargas al año elegido", async () => {
    const props = crearProps({ anioLectivoId: 2 });
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
    pagosApi.registrarPago.mockResolvedValue({ pago_id: 42 });
    const { result } = renderHook(() => useRegistroPago(props));

    await act(async () => result.current.registrarPago({ preventDefault: vi.fn() }));

    expect(pagosApi.registrarPago).toHaveBeenCalledWith(
      expect.objectContaining({ anio_lectivo_id: 2 })
    );
    expect(props.cargarHistorialPagos).toHaveBeenCalledWith(7);
    expect(props.cargarVentasPendientes).toHaveBeenCalledWith(7);
    expect(props.cargarDeudasEstudiante).toHaveBeenCalledWith(7);
    expect(props.cargarOpcionesVencidas).toHaveBeenCalledWith(7);
  });
});
