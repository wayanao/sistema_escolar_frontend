import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import pagosApi from "../services/pagosApi";
import Swal from "sweetalert2";
import PagosAdmin from "./PagosAdmin";

vi.mock("../services/pagosApi", () => ({
  default: {
    obtenerEstudiantes: vi.fn(),
    obtenerTiposPagos: vi.fn(),
    obtenerHistorialPagos: vi.fn(),
    obtenerDeudasEstudiante: vi.fn(),
    obtenerVentasPendientes: vi.fn(),
    obtenerOpcionesVencidas: vi.fn(),
    obtenerOpcionesAdelanto: vi.fn(),
    obtenerCursos: vi.fn(),
    obtenerValoresPersonalizados: vi.fn(),
    guardarValorPersonalizado: vi.fn(),
    quitarValorPersonalizado: vi.fn(),
    registrarPago: vi.fn(),
    registrarPagoAdelantado: vi.fn(),
    anularPago: vi.fn(),
  },
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

const estudiante = {
  id: 7,
  nombre: "Ana",
  apellido: "Pérez",
  documento: "1007",
  curso_nombre: "Quinto",
};

const deudaMensual = {
  concepto: "Pensión",
  concepto_id: 11,
  tipo_cobro: "mensual",
  deuda: 200000,
  pagado: 0,
};

const cuotasVencidas = {
  opciones: [
    {
      tipo_pago_id: 11,
      cuotas: [
        { periodo: "2026-06", saldo: 100000, estado: "vencido" },
        { periodo: "2026-07", saldo: 100000, estado: "vencido" },
      ],
    },
  ],
};

const opcionesAdelanto = {
  opciones: [
    {
      tipo_pago_id: 11,
      concepto: "Pensión",
      valor_unitario: 100000,
      mes_final: 11,
      max_meses: 2,
      total_disponible: 200000,
      periodos_disponibles: [
        { periodo: "2026-08", etiqueta: "Agosto 2026", saldo: 100000 },
        { periodo: "2026-09", etiqueta: "Septiembre 2026", saldo: 100000 },
      ],
    },
  ],
};

function ObservadorRuta() {
  const location = useLocation();

  return (
    <>
      <output data-testid="ruta-actual">{location.pathname}</output>
      <output data-testid="estado-ruta">{JSON.stringify(location.state)}</output>
    </>
  );
}

function renderPagos(initialEntries = ["/admin/pagos"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <PagosAdmin />
      <ObservadorRuta />
    </MemoryRouter>
  );
}

async function seleccionarEstudiante(user) {
  await user.click(await screen.findByText("Pérez Ana"));
  await waitFor(() => {
    expect(pagosApi.obtenerOpcionesVencidas).toHaveBeenCalledWith(7);
  });
}

describe("PagosAdmin - caracterización", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));
    pagosApi.obtenerEstudiantes.mockResolvedValue([estudiante]);
    pagosApi.obtenerCursos.mockResolvedValue([{ id: 5, nombre: "Quinto" }]);
    pagosApi.obtenerTiposPagos.mockResolvedValue([
      { id: 11, nombre: "Pensión", valor: 100000, activo: true },
    ]);
    pagosApi.obtenerHistorialPagos.mockResolvedValue([]);
    pagosApi.obtenerDeudasEstudiante.mockResolvedValue({ deudas: [deudaMensual] });
    pagosApi.obtenerVentasPendientes.mockResolvedValue([]);
    pagosApi.obtenerOpcionesVencidas.mockResolvedValue(cuotasVencidas);
    pagosApi.obtenerValoresPersonalizados.mockResolvedValue([]);
    pagosApi.obtenerOpcionesAdelanto.mockResolvedValue(opcionesAdelanto);
    pagosApi.registrarPago.mockResolvedValue({ periodos: [] });
    pagosApi.registrarPagoAdelantado.mockResolvedValue({ periodos: [] });
    Swal.fire.mockResolvedValue({ isConfirmed: true, value: "Motivo válido" });
  });

  it("redirige a login cuando la sesión no pertenece a un administrador", async () => {
    localStorage.clear();

    renderPagos();

    await waitFor(() => {
      expect(screen.getByTestId("ruta-actual")).toHaveTextContent("/login");
    });
    expect(screen.queryByRole("heading", { name: "💰 Gestión de Pagos" })).not.toBeInTheDocument();
  });

  it("preselecciona el estudiante de location.state, abre el formulario y limpia el estado", async () => {
    renderPagos([
      {
        pathname: "/admin/pagos",
        state: { estudiante_id: 7 },
      },
    ]);

    expect(await screen.findByText("Pagos de Pérez Ana")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pago pendiente" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("estado-ruta")).toHaveTextContent("null");
    });
    expect(pagosApi.obtenerHistorialPagos).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerOpcionesVencidas).toHaveBeenCalledWith(7);
  });

  it("consulta los contratos actuales al cargar y seleccionar un estudiante", async () => {
    const user = userEvent.setup();
    renderPagos();

    await seleccionarEstudiante(user);

    expect(pagosApi.obtenerEstudiantes).toHaveBeenCalledTimes(1);
    expect(pagosApi.obtenerCursos).toHaveBeenCalledTimes(1);
    expect(pagosApi.obtenerTiposPagos).toHaveBeenCalledTimes(1);
    expect(pagosApi.obtenerHistorialPagos).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerDeudasEstudiante).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerVentasPendientes).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerOpcionesVencidas).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerValoresPersonalizados).toHaveBeenCalledWith(7);
    expect(screen.getByText("Pagos de Pérez Ana")).toBeInTheDocument();
  });

  it("conserva la búsqueda local y el estado vacío del listado", async () => {
    const user = userEvent.setup();
    pagosApi.obtenerEstudiantes.mockResolvedValue([
      estudiante,
      {
        id: 8,
        nombre: "Luis",
        apellido: "Gómez",
        documento: "1008",
        curso_nombre: "Sexto",
      },
    ]);
    renderPagos();

    expect(await screen.findByText("Pérez Ana")).toBeInTheDocument();
    expect(screen.getByText("Gómez Luis")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Buscar estudiante..."), "nadie");

    expect(screen.getByText("No se encontraron estudiantes.")).toBeInTheDocument();
    expect(screen.queryByText("Pérez Ana")).not.toBeInTheDocument();
  });

  it("conserva la edición visual de un valor personalizado", async () => {
    const user = userEvent.setup();
    pagosApi.obtenerValoresPersonalizados.mockResolvedValue([
      {
        id: 31,
        tipo_pago_id: 11,
        tipo_pago_nombre: "Pensión",
        valor: 85000,
        valor_curso: 100000,
        motivo: "Acuerdo familiar",
      },
    ]);
    renderPagos();
    await seleccionarEstudiante(user);

    expect(await screen.findByText("Acuerdo familiar", { exact: false })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Editar" }));

    expect(screen.getByPlaceholderText("Valor personalizado")).toHaveValue(85000);
    expect(screen.getByPlaceholderText("Motivo o acuerdo")).toHaveValue("Acuerdo familiar");
  });

  it("conserva el historial, la apertura del comprobante y la anulación", async () => {
    const user = userEvent.setup();
    pagosApi.obtenerHistorialPagos.mockResolvedValue([
      {
        pago_id: 42,
        descripcion: "Pensión agosto",
        fecha: "2026-08-04",
        monto: 100000,
        tipo_pago: "efectivo",
        anulado: false,
      },
    ]);
    renderPagos();
    await seleccionarEstudiante(user);

    expect(await screen.findByText("Pensión agosto")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Imprimir Recibo/ }));
    expect(screen.getByRole("button", { name: "← Volver" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "← Volver" }));

    await user.click(screen.getByRole("button", { name: "Anular pago" }));
    await waitFor(() => {
      expect(pagosApi.anularPago).toHaveBeenCalledWith(42, {
        motivo: "Motivo válido",
      });
    });
  });

  it("conserva el payload de un pago mensual con métodos combinados", async () => {
    const user = userEvent.setup();
    renderPagos();
    await seleccionarEstudiante(user);

    await user.click(screen.getByRole("button", { name: "+ Nuevo Pago/Factura" }));
    const opcionPension = document.querySelector('option[value="Pensión"]');
    await user.selectOptions(opcionPension.closest("select"), "Pensión");
    await screen.findByText("Junio de 2026");

    await user.click(screen.getByLabelText("efectivo"));
    await user.click(screen.getByLabelText("transferencia"));
    const montos = screen.getAllByPlaceholderText("Monto");
    await user.clear(montos[0]);
    await user.type(montos[0], "60000");
    await user.type(montos[1], "40000");
    await user.type(screen.getByLabelText("Banco o plataforma"), "Banco de prueba");

    await user.click(screen.getByRole("button", { name: "Registrar Pago" }));

    await waitFor(() => expect(pagosApi.registrarPago).toHaveBeenCalled());
    const [payload] = pagosApi.registrarPago.mock.calls[0];
    expect(payload).toEqual({
      estudiante_id: 7,
      descripcion: "Pensión",
      fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      monto: "100000",
      metodos: [
        { tipo: "efectivo", monto: "60000", nota: "" },
        { tipo: "transferencia", monto: "40000", nota: "Banco de prueba" },
      ],
      aplicaciones: [
        { tipo_pago_id: 11, periodo: "2026-06", monto: 100000 },
      ],
    });
  });

  it("distribuye un adelanto por monto y conserva su payload numérico", async () => {
    const user = userEvent.setup();
    renderPagos();
    await seleccionarEstudiante(user);

    await user.click(screen.getByRole("button", { name: "+ Nuevo Pago/Factura" }));
    await user.click(screen.getByRole("button", { name: "Meses adelantados" }));
    await waitFor(() => {
      expect(pagosApi.obtenerOpcionesAdelanto).toHaveBeenCalledWith(7);
    });

    const opcionAdelanto = Array.from(document.querySelectorAll("option"))
      .find((option) => option.textContent.includes("por mes"));
    await user.selectOptions(opcionAdelanto.parentElement, "11");
    await user.click(screen.getByRole("button", { name: "Distribuir un monto" }));
    fireEvent.change(screen.getByPlaceholderText("Ej: 80000"), {
      target: { value: "150000" },
    });

    expect(await screen.findByText("Agosto 2026")).toBeInTheDocument();
    expect(screen.getByText("Septiembre 2026")).toBeInTheDocument();
    expect(screen.getByText("Queda cubierto")).toBeInTheDocument();
    expect(screen.getByText("Saldo pendiente")).toBeInTheDocument();
    expect(screen.getByText("Disponible hasta noviembre: $200.000")).toBeInTheDocument();

    await user.click(screen.getByLabelText("subsidio"));
    await user.type(screen.getByLabelText("Referencia del subsidio"), "Convenio 2026");
    await user.click(screen.getByRole("button", { name: "Registrar adelanto" }));

    await waitFor(() => expect(pagosApi.registrarPagoAdelantado).toHaveBeenCalled());
    const [payload] = pagosApi.registrarPagoAdelantado.mock.calls[0];
    expect(payload).toEqual({
      estudiante_id: 7,
      tipo_pago_id: 11,
      monto_distribuir: 150000,
      fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      metodos: [
        { tipo: "subsidio", monto: 150000, nota: "Convenio 2026" },
      ],
    });
  });
});
