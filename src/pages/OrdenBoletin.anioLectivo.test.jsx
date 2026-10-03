import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// El orden del boletín mirando un año que no es el activo (paso 4.2 del año
// lectivo). Con el año activo, `OrdenBoletin.test.jsx` sigue igual.
const mocks = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    put: vi.fn(),
  },
  anioLectivo: null,
}));

vi.mock("../utils/api", () => ({
  default: mocks.apiMock,
}));
vi.mock("../hooks/anioLectivo/useAnioLectivo", () => ({
  default: () => mocks.anioLectivo,
}));

import OrdenBoletin from "./OrdenBoletin";

const MATERIAS = [
  {
    curso_id: 50,
    materia_id: 10,
    materia_nombre: "Biología",
    profesor_nombre: "Carlos",
    horarios: 3,
    orden_boletin: 1,
  },
];

describe("OrdenBoletin mirando otro año", () => {
  beforeEach(() => {
    mocks.apiMock.get.mockReset();
    mocks.apiMock.put.mockReset();
    mocks.apiMock.get.mockImplementation((url) => {
      if (url === "/cursos") {
        return Promise.resolve({ data: [{ id: 50, nombre: "Primero A", jornada: "Mañana" }] });
      }
      if (url === "/cursos/50/orden-boletin") {
        return Promise.resolve({ data: { items: MATERIAS } });
      }
      return Promise.reject(new Error(`GET inesperado: ${url}`));
    });
  });

  it("en preparación pide los cursos de ese año y deja ordenar y guardar", async () => {
    mocks.anioLectivo = {
      parametros: { anio_lectivo_id: 2 },
      permisos: { esAnioActivo: false, puedeEditar: true },
    };

    render(<OrdenBoletin />);

    expect(await screen.findByText("Biología")).toBeInTheDocument();
    expect(mocks.apiMock.get).toHaveBeenCalledWith("/cursos", {
      params: { anio_lectivo_id: 2 },
      signal: expect.any(AbortSignal),
    });
    // El orden de un curso parte de su id: no lleva año.
    expect(mocks.apiMock.get).toHaveBeenCalledWith("/cursos/50/orden-boletin", {
      signal: expect.any(AbortSignal),
    });
    expect(screen.getByRole("button", { name: "Guardar orden" })).toBeInTheDocument();
  });

  it("en un año cerrado muestra el orden sin poder cambiarlo", async () => {
    mocks.anioLectivo = {
      parametros: { anio_lectivo_id: 3 },
      permisos: { esAnioActivo: false, puedeEditar: false },
    };

    render(<OrdenBoletin />);

    expect(await screen.findByText("Biología")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar orden" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "A-Z" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Subir Biología" })).not.toBeInTheDocument();
  });
});
