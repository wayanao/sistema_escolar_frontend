import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { finDeMesISO, formatoMoneda as formatoMonedaReal, hoyISO } from "../utils/reportesFinancieros/formatos";
import ReportesAdmin from "./ReportesAdmin";

const { apiMock, navigateMock } = vi.hoisted(() => ({
  apiMock: { get: vi.fn() },
  navigateMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

// Se usan las funciones reales de utils/reportesFinancieros/formatos (no una
// réplica) para calcular el texto/fecha esperados en las aserciones, y así
// no desalinearse si su implementación cambia (p. ej. el arreglo de zona
// horaria de hoyISO/nombreMes).
const formatoMoneda = (valor) => formatoMonedaReal(valor).replace(/\s+/g, " "); // normaliza el NBSP de Intl a un espacio simple, igual que Testing Library

const reporteGeneral = {
  estadisticas_generales: {
    total_estudiantes: 120,
    total_profesores: 15,
    total_ingresos: 5000000,
    ingresos_hoy: 200000,
    total_egresos: 1200000,
    egresos_hoy: 50000,
    balance_general: 3800000,
    balance_hoy: 150000,
  },
  estudiantes_por_curso: [{ curso: "5A", cantidad: 30 }],
  ingresos_mensuales: [{ mes: "2026-07", total: 4000000 }],
  egresos_mensuales: [{ mes: "2026-07", total: 900000 }],
};

const ingresosDetalle = [
  {
    id: 1,
    estudiante: "Ana Pérez",
    monto: 100000,
    monto_valido: 100000,
    fecha: "08/08/2026 09:00",
    descripcion: "Pensión agosto",
    tipo_pago: "Efectivo",
    estado: "Pagado",
    anulado: false,
    motivo_anulacion: null,
  },
  {
    id: 2,
    estudiante: "Luis Gómez",
    monto: 50000,
    monto_valido: 0,
    fecha: "08/08/2026 10:00",
    descripcion: "Matrícula",
    tipo_pago: "Tarjeta",
    estado: "Anulado",
    anulado: true,
    motivo_anulacion: "Error de registro",
  },
];

const egresosDetalle = [
  {
    id: 9,
    concepto: "Papelería",
    monto: 30000,
    fecha: "08/08/2026",
    categoria: "Insumos",
    notas: "Compra mensual",
    origen: "manual",
  },
];

function mockRespuestaGeneral() {
  apiMock.get.mockImplementation((url) => {
    if (url === "/reportes/general") return Promise.resolve({ data: reporteGeneral });
    throw new Error(`GET inesperado sin mock: ${url}`);
  });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "admin" }));
  window.alert = vi.fn();
  window.requestAnimationFrame = vi.fn((callback) => {
    callback();
    return 1;
  });
  Element.prototype.scrollIntoView = vi.fn();
});

describe("ReportesAdmin - caracterización", () => {
  it("redirige a /login cuando la sesión no pertenece a un administrador", () => {
    localStorage.clear();
    localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "profesor" }));
    mockRespuestaGeneral();

    render(<ReportesAdmin />);

    expect(navigateMock).toHaveBeenCalledWith("/login");
  });

  it("carga el reporte general al montar y muestra estadísticas y movimiento mensual", async () => {
    mockRespuestaGeneral();

    render(<ReportesAdmin />);

    expect(await screen.findByText(formatoMoneda(200000))).toBeInTheDocument(); // Ingresos hoy
    expect(screen.getByText(formatoMoneda(50000))).toBeInTheDocument(); // Egresos hoy
    expect(screen.getByText(formatoMoneda(150000))).toBeInTheDocument(); // Balance hoy
    expect(screen.getByText(formatoMoneda(3800000))).toBeInTheDocument(); // Balance general
    expect(screen.getByText("120")).toBeInTheDocument(); // Estudiantes
    expect(screen.getByText("15")).toBeInTheDocument(); // Profesores
    expect(screen.getByText(formatoMoneda(5000000))).toBeInTheDocument(); // Ingresos acumulados
    expect(screen.getByText(formatoMoneda(1200000))).toBeInTheDocument(); // Egresos acumulados

    // Movimiento mensual del mes inventariado
    expect(screen.getByText(formatoMoneda(4000000))).toBeInTheDocument();
    expect(screen.getByText(formatoMoneda(900000))).toBeInTheDocument();

    expect(apiMock.get).toHaveBeenCalledWith("/reportes/general");
  });

  it("abre el detalle de ingresos de hoy con medios de pago y estado anulado", async () => {
    apiMock.get.mockImplementation((url, config) => {
      if (url === "/reportes/general") return Promise.resolve({ data: reporteGeneral });
      if (url === "/reportes/ingresos-rango") return Promise.resolve({ data: ingresosDetalle, __config: config });
      throw new Error(`GET inesperado sin mock: ${url}`);
    });

    render(<ReportesAdmin />);
    await screen.findByText(formatoMoneda(200000));

    fireEvent.click(screen.getByRole("button", { name: /Ingresos hoy/ }));

    expect(await screen.findByText("Detalle de ingresos")).toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledWith("/reportes/ingresos-rango", {
      params: { inicio: hoyISO(), fin: hoyISO() },
    });

    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
    expect(screen.getByText("Anulado")).toBeInTheDocument();
    expect(screen.getByText("Motivo: Error de registro")).toBeInTheDocument();

    // Total con filtro "todos": el anulado no suma (monto_valido efectivo 0)
    const encabezado = screen.getByText("Detalle de ingresos").closest("div").parentElement;
    expect(within(encabezado).getByText(formatoMoneda(100000))).toBeInTheDocument();
  });

  it("abre el detalle de egresos de hoy", async () => {
    apiMock.get.mockImplementation((url) => {
      if (url === "/reportes/general") return Promise.resolve({ data: reporteGeneral });
      if (url === "/reportes/egresos-rango") return Promise.resolve({ data: egresosDetalle });
      throw new Error(`GET inesperado sin mock: ${url}`);
    });

    render(<ReportesAdmin />);
    await screen.findByText(formatoMoneda(200000));

    fireEvent.click(screen.getByRole("button", { name: /Egresos hoy/ }));

    expect(await screen.findByText("Detalle de egresos")).toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledWith("/reportes/egresos-rango", {
      params: { inicio: hoyISO(), fin: hoyISO() },
    });

    expect(screen.getByText("Papelería")).toBeInTheDocument();
    expect(screen.getByText("Compra mensual")).toBeInTheDocument();
    expect(screen.getByText("Insumos")).toBeInTheDocument();
    expect(screen.getByText("manual")).toBeInTheDocument();
  });

  it("filtra el detalle de ingresos por medio de pago; un método combinado sin monto propio conserva el total", async () => {
    const combinado = {
      id: 3,
      estudiante: "Carlos Ruiz",
      monto: 80000,
      monto_valido: 80000,
      fecha: "08/08/2026 11:00",
      descripcion: "Pensión + mora",
      tipo_pago: "Efectivo + Tarjeta",
      estado: "Pagado",
      anulado: false,
    };

    apiMock.get.mockImplementation((url) => {
      if (url === "/reportes/general") return Promise.resolve({ data: reporteGeneral });
      if (url === "/reportes/ingresos-rango") return Promise.resolve({ data: [combinado] });
      throw new Error(`GET inesperado sin mock: ${url}`);
    });

    render(<ReportesAdmin />);
    await screen.findByText(formatoMoneda(200000));
    fireEvent.click(screen.getByRole("button", { name: /Ingresos hoy/ }));
    await screen.findByText("Carlos Ruiz");

    const selectMedio = screen.getByTitle("Filtrar por medio de pago");
    fireEvent.change(selectMedio, { target: { value: "tarjeta" } });

    // El pago sigue visible porque "tarjeta" forma parte de la combinación,
    // y como el backend no envía monto por método, cae al monto total (riesgo
    // caracterizado en utils/reportesFinancieros/mediosPago.test.js).
    expect(screen.getByText("Carlos Ruiz")).toBeInTheDocument();
    const encabezado = screen.getByText("Detalle de ingresos").closest("div").parentElement;
    expect(within(encabezado).getByText(formatoMoneda(80000))).toBeInTheDocument();

    fireEvent.change(selectMedio, { target: { value: "subsidio" } });
    expect(screen.queryByText("Carlos Ruiz")).not.toBeInTheDocument();
    expect(screen.getByText("No hay ingresos para el medio de pago seleccionado.")).toBeInTheDocument();
  });

  it("valida el rango de fechas antes de consultar y no repite la consulta previa", async () => {
    mockRespuestaGeneral();

    render(<ReportesAdmin />);
    await screen.findByText(formatoMoneda(200000));
    const llamadasIniciales = apiMock.get.mock.calls.length;

    const [inicioInput, finInput] = screen.getAllByDisplayValue(hoyISO());
    fireEvent.change(inicioInput, { target: { value: "2026-08-20" } });
    fireEvent.change(finInput, { target: { value: "2026-08-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Ingresos" }));

    expect(window.alert).toHaveBeenCalledWith("La fecha de inicio no puede ser mayor a la fecha de fin");
    expect(apiMock.get.mock.calls.length).toBe(llamadasIniciales);
  });

  it("carga el detalle de un mes usando el rango de inicio y fin de ese mes", async () => {
    apiMock.get.mockImplementation((url) => {
      if (url === "/reportes/general") return Promise.resolve({ data: reporteGeneral });
      if (url === "/reportes/ingresos-mes/2026-07") return Promise.resolve({ data: ingresosDetalle });
      if (url === "/reportes/egresos-rango") return Promise.resolve({ data: egresosDetalle });
      throw new Error(`GET inesperado sin mock: ${url}`);
    });

    render(<ReportesAdmin />);
    await screen.findByText(formatoMoneda(200000));

    fireEvent.click(screen.getByText(formatoMoneda(4000000))); // botón de ingreso del mes
    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledWith("/reportes/ingresos-mes/2026-07");

    fireEvent.click(screen.getByText(formatoMoneda(900000))); // botón de egreso del mes
    await screen.findByText("Papelería");
    expect(apiMock.get).toHaveBeenCalledWith("/reportes/egresos-rango", {
      params: { inicio: "2026-07-01", fin: finDeMesISO("2026-07") },
    });
  });

  it("recarga el reporte general cuando la pestaña vuelve a estar visible", async () => {
    mockRespuestaGeneral();

    render(<ReportesAdmin />);
    await screen.findByText(formatoMoneda(200000));
    const llamadasIniciales = apiMock.get.mock.calls.length;

    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => {
      expect(apiMock.get.mock.calls.length).toBe(llamadasIniciales + 1);
    });
    expect(apiMock.get).toHaveBeenLastCalledWith("/reportes/general");
  });
});
