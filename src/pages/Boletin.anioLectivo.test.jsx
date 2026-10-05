import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Gestión de boletines mirando un año que no es el activo (paso 4.5 del año
// lectivo). Con el año activo, `Boletin.test.jsx` sigue igual: fuera del
// proveedor, `useAnioLectivo` devuelve el año activo.
const mocks = vi.hoisted(() => ({
  apiMock: { get: vi.fn() },
  anioLectivo: null,
}));

vi.mock("../utils/api", () => ({ default: mocks.apiMock }));
vi.mock("../hooks/anioLectivo/useAnioLectivo", () => ({
  default: () => mocks.anioLectivo,
}));
vi.mock("../components/impresion/DocumentoImprimible", () => ({
  default: ({ children }) => <div data-testid="documento-imprimible">{children}</div>,
}));

import Boletin from "./Boletin";

const { apiMock } = mocks;
const CERRADO = {
  parametros: { anio_lectivo_id: 3 },
  permisos: { esAnioActivo: false, puedeEditar: false },
};
const CON_ANIO = { params: { anio_lectivo_id: 3 }, signal: expect.any(AbortSignal) };

const BOLETIN_DE_ESE_ANIO = {
  estudiante_nombre: "Sara",
  estudiante_apellido: "López",
  curso: "PRIMERO A",
  periodo: 1,
  puesto: 1,
  total_estudiantes: 20,
  materias: [
    {
      materia_id: 12,
      boletin_id: 90,
      materia: "Matemáticas",
      profesor_nombre: "Lina",
      profesor_apellido: "Pérez",
      definitiva: 4.5,
      detalles: [{ observacion: "Resuelve problemas con orden", notas_por_periodo: { 1: 4.5 } }],
    },
  ],
};

beforeEach(() => {
  apiMock.get.mockReset();
  apiMock.get.mockImplementation((url) => {
    if (url === "/cursos") {
      return Promise.resolve({ data: [{ id: 50, nombre: "PRIMERO A", jornada: "Mañana" }] });
    }
    if (url === "/estudiantes") {
      return Promise.resolve({
        data: [
          { id: 8, nombre: "Sara", apellido: "López", identificacion: "TI-123", curso_id: 50 },
        ],
      });
    }
    if (url === "/boletines/admin/generar/8/1") {
      return Promise.resolve({ data: BOLETIN_DE_ESE_ANIO });
    }
    return Promise.reject(new Error(`GET inesperado: ${url}`));
  });
});

describe("Boletines mirando otro año", () => {
  it("pide los cursos, los estudiantes y el boletín de ese año", async () => {
    mocks.anioLectivo = CERRADO;
    const user = userEvent.setup();

    render(<Boletin />);

    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    expect(apiMock.get.mock.calls).toEqual([
      ["/cursos", CON_ANIO],
      ["/estudiantes", CON_ANIO],
    ]);

    await user.click(screen.getByRole("button", { name: "📄 Generar Boletín" }));

    expect(await screen.findByText("Resuelve problemas con orden")).toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledWith("/boletines/admin/generar/8/1", CON_ANIO);
    expect(
      apiMock.get.mock.calls.filter(([url]) => url.startsWith("/boletines/")),
    ).toHaveLength(1);
  });
});
