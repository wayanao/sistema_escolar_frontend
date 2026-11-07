import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FormularioPago from "./FormularioPago";

const crearPagoData = (cambios = {}) => ({
  descripcion: "",
  monto: "",
  fecha: "2026-08-04",
  venta_id: "",
  aplicaciones: [],
  metodos: [],
  tipo_pago_id_adelanto: "",
  cantidad_meses: 1,
  modalidad_adelanto: "meses",
  monto_distribuir: "",
  ...cambios,
});

const crearProps = (cambios = {}) => ({
  pagoData: crearPagoData(),
  modoPago: "normal",
  abonoLibre: false,
  registrandoPago: false,
  deudaPendienteSeleccionada: null,
  opcionVencidaSeleccionada: null,
  periodosVencidosSeleccionados: new Set(),
  todasLasCuotasSeleccionadas: false,
  loadingOpcionesVencidas: false,
  errorOpcionesVencidas: "",
  puedeElegirPendienteOAdelanto: false,
  loadingOpcionesAdelanto: false,
  errorOpcionesAdelanto: "",
  opcionAdelantoSeleccionada: null,
  deudaDelConceptoAdelantado: null,
  periodosAdelantoSeleccionados: [],
  saldoAdelantoSinDistribuir: 0,
  onRegistrar: vi.fn(),
  onCerrar: vi.fn(),
  onCambiarModoPago: vi.fn(),
  onActualizarCuotasSeleccionadas: vi.fn(),
  onActivarAbonoLibre: vi.fn(),
  onReintentarOpcionesVencidas: vi.fn(),
  onCambiarCantidadAdelanto: vi.fn(),
  onCambiarModalidadAdelanto: vi.fn(),
  onCambiarMontoDistribuir: vi.fn(),
  onReintentarOpcionesAdelanto: vi.fn(),
  onActualizarCampoPago: vi.fn(),
  onCambiarMontoPago: vi.fn(),
  onValidarMonto: vi.fn(),
  onAlternarMetodoPago: vi.fn(),
  onCambiarMontoMetodo: vi.fn(),
  onCambiarNotaMetodo: vi.fn(),
  ...cambios,
});

describe("FormularioPago", () => {
  it("muestra el concepto elegido en lo que debe y delega sus controles", () => {
    const props = crearProps({
      pagoData: crearPagoData({ descripcion: "Matrícula", monto: "50000" }),
    });
    render(<FormularioPago {...props} />);

    expect(screen.getByRole("form", { name: "Cobro de Matrícula" })).toBeInTheDocument();
    expect(screen.getByText("Matrícula")).toBeInTheDocument();
    // El concepto se elige en lo que debe: aquí ya no hay lista ni botones de modo.
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pago pendiente" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Meses adelantados" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("2026-08-04"), {
      target: { value: "2026-08-05" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej: 150.000"), { target: { value: "45000" } });
    fireEvent.blur(screen.getByPlaceholderText("Ej: 150.000"));
    fireEvent.click(screen.getByLabelText("efectivo"));
    fireEvent.submit(screen.getByRole("button", { name: "Registrar Pago" }).closest("form"));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(props.onActualizarCampoPago).toHaveBeenCalledWith("fecha", "2026-08-05");
    expect(props.onCambiarMontoPago).toHaveBeenCalledWith("45000");
    expect(props.onValidarMonto).toHaveBeenCalledWith(50000);
    expect(props.onAlternarMetodoPago).toHaveBeenCalledWith("efectivo", true);
    expect(props.onRegistrar).toHaveBeenCalledTimes(1);
    expect(props.onCerrar).toHaveBeenCalledTimes(1);
  });

  it("mientras registra, el botón solo se bloquea: la espera va en la tarjeta", () => {
    render(<FormularioPago {...crearProps({ registrandoPago: true })} />);

    // Una sola espera (2026-11-07): ni «Registrando...» ni círculo en el botón.
    expect(screen.getByRole("button", { name: "Registrar Pago" })).toBeDisabled();
    expect(screen.queryByText("Registrando...")).not.toBeInTheDocument();
  });

  it("conserva la distribución visual de un adelanto por monto", () => {
    const opcionAdelanto = {
      tipo_pago_id: 11,
      concepto: "Pensión",
      valor_unitario: 100000,
      mes_final: 11,
      max_meses: 2,
      total_disponible: 200000,
    };
    const deudaPension = {
      concepto: "Pensión",
      concepto_id: 11,
      tipo_cobro: "mensual",
      deuda: 25000,
      pagado: 0,
    };
    const props = crearProps({
      modoPago: "adelantado",
      pagoData: crearPagoData({
        descripcion: "Pensión",
        monto: "150000",
        tipo_pago_id_adelanto: "11",
        modalidad_adelanto: "monto",
        monto_distribuir: "150000",
        metodos: [{ tipo: "subsidio", monto: "150000", nota: "Convenio 2026" }],
      }),
      puedeElegirPendienteOAdelanto: true,
      opcionAdelantoSeleccionada: opcionAdelanto,
      deudaDelConceptoAdelantado: deudaPension,
      periodosAdelantoSeleccionados: [
        {
          periodo: "2026-08",
          etiqueta: "Agosto 2026",
          monto_aplicado: 100000,
          saldo_restante: 0,
        },
        {
          periodo: "2026-09",
          etiqueta: "Septiembre 2026",
          monto_aplicado: 50000,
          saldo_restante: 50000,
        },
      ],
    });
    render(<FormularioPago {...props} />);

    expect(screen.getByRole("form", { name: "Cobro de Pensión" })).toBeInTheDocument();
    expect(screen.getByText("Agosto 2026")).toBeInTheDocument();
    expect(screen.getByText("Septiembre 2026")).toBeInTheDocument();
    expect(screen.getByText("Queda cubierto")).toBeInTheDocument();
    expect(screen.getByText("Saldo pendiente")).toBeInTheDocument();
    expect(screen.getByText("Hay deuda vencida por $25.000.")).toBeInTheDocument();
    expect(screen.getByText("Disponible hasta noviembre: $200.000")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Ej: 80.000"), {
      target: { value: "120000" },
    });
    fireEvent.change(screen.getByLabelText("Referencia del subsidio"), {
      target: { value: "Nuevo convenio" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Meses completos" }));
    fireEvent.click(screen.getByRole("button", { name: "Pagar lo que debe" }));

    expect(props.onCambiarMontoDistribuir).toHaveBeenCalledWith("120000");
    expect(props.onCambiarNotaMetodo).toHaveBeenCalledWith("subsidio", "Nuevo convenio");
    expect(props.onCambiarModalidadAdelanto).toHaveBeenCalledWith("meses");
    expect(props.onCambiarModoPago).toHaveBeenCalledWith("normal");
  });

  it("con deuda mensual y meses por adelantar ofrece pagar lo que debe o adelantar", () => {
    const deudaPension = {
      concepto: "Pensión",
      concepto_id: 11,
      tipo_cobro: "mensual",
      deuda: 100000,
      pagado: 0,
    };
    const props = crearProps({
      pagoData: crearPagoData({ descripcion: "Pensión", monto: "100000" }),
      deudaPendienteSeleccionada: deudaPension,
      puedeElegirPendienteOAdelanto: true,
    });
    render(<FormularioPago {...props} />);

    const eleccion = screen.getByRole("group", { name: "Qué pagar de este concepto" });
    expect(eleccion).toHaveTextContent("Pagar lo que debe");
    expect(screen.getByText("Meses pendientes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Adelantar meses" }));

    expect(props.onCambiarModoPago).toHaveBeenCalledWith("adelantado");
  });

  it("en el adelanto, si no se pudieron consultar los meses, avisa y deja reintentar", () => {
    const props = crearProps({
      modoPago: "adelantado",
      pagoData: crearPagoData({ descripcion: "Pensión", tipo_pago_id_adelanto: "11" }),
      errorOpcionesAdelanto: "No se pudieron consultar los meses disponibles.",
    });
    render(<FormularioPago {...props} />);

    expect(screen.getByText("No se pudieron consultar los meses disponibles.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(props.onReintentarOpcionesAdelanto).toHaveBeenCalledTimes(1);
  });
});
