import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import pagosApi from "../services/pagosApi";
import Swal from "sweetalert2";
import { ContextoAnioLectivo } from "../hooks/anioLectivo/useAnioLectivo";
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
    obtenerValoresPagoEstudiante: vi.fn(),
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

const contextoDosAnios = {
  anios: [
    { id: 2, anio: 2027, estado: "preparacion" },
    { id: 1, anio: 2026, estado: "activo" },
  ],
  anioActivo: { id: 1, anio: 2026, estado: "activo" },
  anioSeleccionado: { id: 1, anio: 2026, estado: "activo" },
  anioSeleccionadoId: null,
  hayVariosAnios: true,
  parametros: {},
  permisos: { esAnioActivo: true, puedeEditar: true },
  seleccionarAnio: vi.fn(),
  volverAlActivo: vi.fn(),
  recargarAnios: vi.fn(),
};

function renderPagos(initialEntries = ["/admin/pagos"], contextoAnio = null) {
  const pagina = (
    <>
      <PagosAdmin />
      <ObservadorRuta />
    </>
  );
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {contextoAnio ? (
        <ContextoAnioLectivo.Provider value={contextoAnio}>
          {pagina}
        </ContextoAnioLectivo.Provider>
      ) : pagina}
    </MemoryRouter>
  );
}

async function seleccionarEstudiante(user) {
  await user.click(await screen.findByText("Pérez Ana"));
  await waitFor(() => {
    expect(pagosApi.obtenerOpcionesVencidas).toHaveBeenCalledWith(7);
  });
}

// Desde el 2026-11-04 se cobra desde las filas de lo que debe ("Cobrar
// Pensión", "Adelantar Pensión"). Sus botones esperan a que termine la consulta.
async function pulsarFila(user, nombre) {
  const boton = await screen.findByRole("button", { name: nombre });
  await waitFor(() => expect(boton).toBeEnabled());
  await user.click(boton);
}

// JSDOM no trae matchMedia ni scrollIntoView; se simulan solo en estas pruebas.
function simularPantalla({ angosta }) {
  window.matchMedia = vi.fn((consulta) => ({
    matches: consulta.includes("max-width") ? angosta : false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  Element.prototype.scrollIntoView = vi.fn();
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
    pagosApi.obtenerValoresPagoEstudiante.mockResolvedValue({ conceptos: [] });
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

  it("preselecciona el estudiante de location.state, muestra lo que debe y limpia el estado", async () => {
    renderPagos([
      {
        pathname: "/admin/pagos",
        state: { estudiante_id: 7 },
      },
    ]);

    expect(await screen.findByText("Pagos de Pérez Ana")).toBeInTheDocument();
    // Lo que se cobra se elige en lo que debe: el formulario no abre solo.
    expect(screen.getByRole("region", { name: "Lo que debe" })).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: /Cobro de/ })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("estado-ruta")).toHaveTextContent("null");
    });
    expect(pagosApi.obtenerHistorialPagos).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerOpcionesVencidas).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerOpcionesAdelanto).toHaveBeenCalledWith(7);
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

  describe("bajada al panel de pago al elegir un estudiante", () => {
    afterEach(() => {
      delete window.matchMedia;
      delete Element.prototype.scrollIntoView;
    });

    it("en tablet o celular baja hasta el panel de pagos", async () => {
      simularPantalla({ angosta: true });
      const user = userEvent.setup();
      renderPagos();

      await seleccionarEstudiante(user);

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
      const [panel] = Element.prototype.scrollIntoView.mock.contexts;
      expect(panel).toContainElement(screen.getByText("Pagos de Pérez Ana"));
    });

    it("en computador, elegir el estudiante no mueve la pantalla, pero Cobrar baja al formulario", async () => {
      simularPantalla({ angosta: false });
      const user = userEvent.setup();
      renderPagos();

      await seleccionarEstudiante(user);
      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

      await pulsarFila(user, "Cobrar Pensión");

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
      const [formulario] = Element.prototype.scrollIntoView.mock.contexts;
      expect(formulario).toContainElement(screen.getByRole("form", { name: "Cobro de Pensión" }));
    });

    it("en celular, el Cobrar de lo que debe baja hasta el formulario", async () => {
      simularPantalla({ angosta: true });
      const user = userEvent.setup();
      renderPagos();
      await seleccionarEstudiante(user);

      await pulsarFila(user, "Cobrar Pensión");

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
      const [, formulario] = Element.prototype.scrollIntoView.mock.contexts;
      expect(formulario).toContainElement(screen.getByRole("form", { name: "Cobro de Pensión" }));
    });
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

  it("Cobrar de una fila abre el formulario debajo de lo que debe y los valores quedan cerrados", async () => {
    const user = userEvent.setup();
    renderPagos();
    await seleccionarEstudiante(user);

    // Ya no hay un "Cobrar" general: se cobra desde cada fila.
    expect(screen.queryByRole("button", { name: "Cobrar" })).not.toBeInTheDocument();
    const valores = screen.getByRole("button", { name: /Valores personalizados/ });
    expect(valores).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: /Valores de pago/ })).not.toBeInTheDocument();
    // Cerrado no consulta nada: cobrar no paga esa petición.
    expect(pagosApi.obtenerValoresPagoEstudiante).not.toHaveBeenCalled();

    await pulsarFila(user, "Cobrar Pensión");

    const resumen = screen.getByRole("region", { name: "Lo que debe" });
    const formulario = screen.getByRole("form", { name: "Cobro de Pensión" });
    const historial = screen.getByRole("heading", { name: "Historial de Pagos" });
    expect(
      resumen.compareDocumentPosition(formulario) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      formulario.compareDocumentPosition(valores) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      valores.compareDocumentPosition(historial) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("Lo que debe muestra cada concepto y su Cobrar arma el mismo pago de siempre", async () => {
    const user = userEvent.setup();
    renderPagos();
    await seleccionarEstudiante(user);

    const resumen = screen.getByRole("region", { name: "Lo que debe" });
    expect(await within(resumen).findByText("2 meses pendientes")).toBeInTheDocument();
    expect(within(resumen).getByText("Pensión")).toBeInTheDocument();

    await pulsarFila(user, "Cobrar Pensión");

    expect(screen.getByRole("form", { name: "Cobro de Pensión" })).toBeInTheDocument();
    expect(await screen.findByText("Junio de 2026")).toBeInTheDocument();
    await user.click(screen.getByLabelText("efectivo"));
    await user.click(screen.getByRole("button", { name: "Registrar Pago" }));

    await waitFor(() => expect(pagosApi.registrarPago).toHaveBeenCalled());
    expect(pagosApi.registrarPago.mock.calls[0][0]).toEqual({
      estudiante_id: 7,
      descripcion: "Pensión",
      fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      monto: "100000",
      metodos: [{ tipo: "efectivo", monto: "100000", nota: "" }],
      aplicaciones: [{ tipo_pago_id: 11, periodo: "2026-06", monto: 100000 }],
    });
  });

  it("valores personalizados muestra el precio del curso y guarda con la ruta de siempre", async () => {
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
    pagosApi.obtenerValoresPagoEstudiante.mockResolvedValue({
      conceptos: [
        {
          tipo_pago_id: 11,
          nombre: "Pensión",
          tipo_cobro: "mensual",
          precio_curso: 100000,
          valor_personalizado: 85000,
          motivo: "Acuerdo familiar",
          valor_a_pagar: 85000,
        },
      ],
    });
    pagosApi.guardarValorPersonalizado.mockResolvedValue({
      valores: [{ id: 31, tipo_pago_id: 11, valor: 80000 }],
    });
    renderPagos();
    await seleccionarEstudiante(user);

    await user.click(
      await screen.findByRole("button", { name: /1 concepto con valor personalizado/ })
    );
    const pension = await screen.findByRole("listitem", { name: "Pensión" });
    expect(pagosApi.obtenerValoresPagoEstudiante).toHaveBeenCalledWith(7);
    expect(within(pension).getByText(/Precio del curso:/)).toHaveTextContent(/100\.000/);
    expect(within(pension).getByText(/Paga .*85\.000 \(personalizado\)/)).toBeInTheDocument();
    expect(within(pension).getByText("Motivo: Acuerdo familiar")).toBeInTheDocument();

    const campo = within(pension).getByRole("textbox", { name: "Valor personalizado de Pensión" });
    await user.clear(campo);
    await user.type(campo, "80000");
    await user.click(within(pension).getByRole("button", { name: "Guardar el valor de Pensión" }));

    await waitFor(() => {
      expect(pagosApi.guardarValorPersonalizado).toHaveBeenCalledWith(7, 11, {
        valor: 80000,
        motivo: "Acuerdo familiar",
        activo: true,
      });
    });
    const recuadro = screen.getByRole("region", { name: "Valores de pago de Ana Pérez" });
    expect(await within(recuadro).findByRole("status")).toHaveTextContent(
      "Se guardó el valor de Pensión para Ana."
    );
    // Lo que debe y sus meses se vuelven a pedir, porque el valor cambia lo que se cobra.
    await waitFor(() => expect(pagosApi.obtenerDeudasEstudiante).toHaveBeenCalledTimes(2));
    expect(pagosApi.obtenerValoresPagoEstudiante).toHaveBeenCalledTimes(2);
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

    // El historial empieza cerrado: se abre con su botón.
    expect(screen.queryByText("Pensión agosto")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /Ver historial de pagos/ }));
    expect(screen.getByText("Pensión agosto")).toBeInTheDocument();
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

  it("después de registrar, el historial muestra solo el pago recién hecho", async () => {
    const user = userEvent.setup();
    const anterior = {
      pago_id: 10,
      descripcion: "Matrícula de febrero",
      fecha: "2026-02-01",
      monto: 300000,
      tipo_pago: "efectivo",
      anulado: false,
    };
    const nuevo = {
      pago_id: 43,
      descripcion: "Pensión · Cuotas: Junio 2026",
      fecha: "2026-11-04",
      monto: 100000,
      tipo_pago: "efectivo",
      anulado: false,
    };
    pagosApi.obtenerHistorialPagos
      .mockResolvedValueOnce([anterior])
      .mockResolvedValue([nuevo, anterior]);
    pagosApi.registrarPago.mockResolvedValue({ pago_id: 43 });
    renderPagos();
    await seleccionarEstudiante(user);
    expect(
      await screen.findByRole("button", { name: /Ver historial de pagos/ })
    ).toHaveTextContent("1 pago registrado");
    expect(screen.queryByText("Matrícula de febrero")).not.toBeInTheDocument();

    await pulsarFila(user, "Cobrar Pensión");
    await screen.findByText("Junio de 2026");
    await user.click(screen.getByLabelText("efectivo"));
    await user.click(screen.getByRole("button", { name: "Registrar Pago" }));

    expect(await screen.findByText(/Pago recién registrado/)).toBeInTheDocument();
    expect(screen.getByText("Pensión · Cuotas: Junio 2026")).toBeInTheDocument();
    expect(screen.queryByText("Matrícula de febrero")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ver historial de pagos/ })).toHaveTextContent(
      "2 pagos registrados"
    );
  });

  it("conserva el payload de un pago mensual con métodos combinados", async () => {
    const user = userEvent.setup();
    renderPagos();
    await seleccionarEstudiante(user);

    await pulsarFila(user, "Cobrar Pensión");
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

    // Los meses para adelantar se piden al elegir el estudiante.
    expect(pagosApi.obtenerOpcionesAdelanto).toHaveBeenCalledWith(7);

    // Pensión tiene deuda: "Cobrar Pensión" y luego "Adelantar meses".
    await pulsarFila(user, "Cobrar Pensión");
    await user.click(await screen.findByRole("button", { name: "Adelantar meses" }));
    await user.click(screen.getByRole("button", { name: "Distribuir un monto" }));
    fireEvent.change(screen.getByPlaceholderText("Ej: 80.000"), {
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

  it("un concepto mensual al día se adelanta desde lo que debe", async () => {
    const user = userEvent.setup();
    pagosApi.obtenerDeudasEstudiante.mockResolvedValue({ deudas: [] });
    pagosApi.obtenerOpcionesVencidas.mockResolvedValue({ opciones: [] });
    renderPagos();
    await seleccionarEstudiante(user);
    expect(await screen.findByText("Al día: no debe nada.")).toBeInTheDocument();
    expect(
      await screen.findByText("Al día · $100.000 por mes · 2 meses por adelantar")
    ).toBeInTheDocument();

    await pulsarFila(user, "Adelantar Pensión");

    expect(screen.getByRole("form", { name: "Cobro de Pensión" })).toBeInTheDocument();
    expect(screen.getByText("Registrar mensualidades futuras")).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Qué pagar de este concepto" })
    ).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("efectivo"));
    await user.click(screen.getByRole("button", { name: "Registrar adelanto" }));

    await waitFor(() => expect(pagosApi.registrarPagoAdelantado).toHaveBeenCalled());
    expect(pagosApi.registrarPagoAdelantado.mock.calls[0][0]).toEqual({
      estudiante_id: 7,
      tipo_pago_id: 11,
      cantidad_meses: 1,
      fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      metodos: [{ tipo: "efectivo", monto: 100000, nota: "" }],
    });
    expect(pagosApi.registrarPago).not.toHaveBeenCalled();
  });

  it("elige explícitamente otro año, recarga sus cobros y no mezcla ventas", async () => {
    const user = userEvent.setup();
    const parametros2027 = { parametrosAnio: { anio_lectivo_id: 2 } };
    pagosApi.obtenerTiposPagos.mockImplementation((opciones) =>
      Promise.resolve(
        opciones?.parametrosAnio?.anio_lectivo_id === 2
          ? [{ id: 21, nombre: "Matrícula", valor: 300000, activo: true }]
          : [{ id: 11, nombre: "Pensión", valor: 100000, activo: true }]
      )
    );
    pagosApi.obtenerDeudasEstudiante.mockImplementation((_id, opciones) =>
      Promise.resolve(
        opciones?.parametrosAnio?.anio_lectivo_id === 2
          ? {
              deudas: [{
                concepto: "Matrícula",
                concepto_id: 21,
                tipo_cobro: "anual",
                deuda: 300000,
                pagado: 0,
              }],
              deuda_anios_anteriores: [],
            }
          : {
              deudas: [deudaMensual],
              deuda_anios_anteriores: [{
                anio_lectivo_id: 9,
                anio: 2025,
                curso_id: 3,
                deudas: [{ concepto: "Pensión", deuda: 50000 }],
                total_deuda: 50000,
              }],
            }
      )
    );
    pagosApi.obtenerOpcionesVencidas.mockImplementation((_id, opciones) =>
      Promise.resolve(
        opciones?.parametrosAnio?.anio_lectivo_id === 2
          ? { opciones: [] }
          : cuotasVencidas
      )
    );
    pagosApi.obtenerValoresPersonalizados.mockResolvedValue([]);
    pagosApi.obtenerVentasPendientes.mockResolvedValue([
      { id: 80, descripcion: "Uniforme", total: 90000 },
    ]);

    renderPagos(["/admin/pagos"], contextoDosAnios);
    await seleccionarEstudiante(user);

    expect(screen.getByRole("heading", { name: "Deudas de años anteriores" })).toBeInTheDocument();
    expect(screen.getByText("Año 2025")).toBeInTheDocument();
    // En el año activo, el cargo de inventario sí está para cobrar.
    expect(await screen.findByRole("button", { name: "Cobrar Uniforme" })).toBeInTheDocument();
    const selector = screen.getByRole("combobox", { name: "Año del pago" });
    expect(selector).toHaveValue("1");

    await user.selectOptions(selector, "2");

    await waitFor(() => {
      expect(pagosApi.obtenerTiposPagos).toHaveBeenLastCalledWith(parametros2027);
      expect(pagosApi.obtenerDeudasEstudiante).toHaveBeenLastCalledWith(7, parametros2027);
      expect(pagosApi.obtenerOpcionesVencidas).toHaveBeenLastCalledWith(7, parametros2027);
      expect(pagosApi.obtenerValoresPersonalizados).toHaveBeenLastCalledWith(7, parametros2027);
    });
    expect(pagosApi.obtenerEstudiantes).toHaveBeenCalledTimes(1);
    expect(pagosApi.obtenerCursos).toHaveBeenCalledTimes(1);
    expect(pagosApi.obtenerHistorialPagos).toHaveBeenCalledTimes(1);
    expect(pagosApi.obtenerVentasPendientes).toHaveBeenCalledTimes(1);

    await pulsarFila(user, "Cobrar Matrícula");
    // Las ventas son del año activo: en 2027 no salen para cobrar.
    expect(screen.queryByRole("button", { name: "Cobrar Uniforme" })).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("efectivo"));
    await user.click(screen.getByRole("button", { name: "Registrar Pago" }));

    await waitFor(() => expect(pagosApi.registrarPago).toHaveBeenCalled());
    expect(pagosApi.registrarPago).toHaveBeenCalledWith(
      expect.objectContaining({
        estudiante_id: 7,
        descripcion: "Matrícula",
        anio_lectivo_id: 2,
      })
    );
  });
});
