import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Listas de seguimiento mirando un año que no es el activo (paso 4.6 del año
// lectivo). Con el año activo, `ListasSeguimientoAdmin.test.jsx` sigue igual:
// fuera del proveedor, `useAnioLectivo` devuelve el año activo.
const mocks = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  swalFireMock: vi.fn(),
  anioLectivo: null,
}));

vi.mock("../utils/api", () => ({ default: mocks.apiMock }));
vi.mock("sweetalert2", () => ({ default: { fire: mocks.swalFireMock } }));
vi.mock("../hooks/anioLectivo/useAnioLectivo", () => ({
  default: () => mocks.anioLectivo,
}));

import ListasSeguimientoAdmin from "./ListasSeguimientoAdmin";

const { apiMock, swalFireMock } = mocks;
const EN_PREPARACION = {
  parametros: { anio_lectivo_id: 2 },
  permisos: { esAnioActivo: false, puedeEditar: true },
};
const CERRADO = {
  parametros: { anio_lectivo_id: 3 },
  permisos: { esAnioActivo: false, puedeEditar: false },
};

const CURSOS_DEL_ANIO = [{ id: 50, nombre: "PRIMERO A" }];
const LISTA = {
  curso_id: 50,
  columnas: [{ id: 5, nombre: "Asistió a la cumbre" }],
  estudiantes: [{ estudiante_id: 101, nombre: "Juan", apellido: "Pérez", marcas: {} }],
};

async function elegirCurso(user) {
  await screen.findByRole("option", { name: "PRIMERO A" });
  await user.selectOptions(screen.getByLabelText("Curso"), "50");
  await screen.findByRole("columnheader", { name: "Asistió a la cumbre" });
}

beforeEach(() => {
  Object.values(apiMock).forEach((mock) => mock.mockReset());
  swalFireMock.mockReset();
  apiMock.get.mockImplementation((url) => {
    if (url === "/cursos") return Promise.resolve({ data: CURSOS_DEL_ANIO });
    if (url === "/listas-seguimiento/50") return Promise.resolve({ data: LISTA });
    return Promise.reject(new Error(`GET inesperado: ${url}`));
  });
  apiMock.post.mockResolvedValue({ data: { creadas: 1, omitidas: 0, total: 1 } });
  swalFireMock.mockResolvedValue({ isConfirmed: true });
});

describe("Listas de seguimiento mirando otro año", () => {
  it("en preparación pide los cursos de ese año y crea la columna en todos los cursos de ese año", async () => {
    mocks.anioLectivo = EN_PREPARACION;
    const user = userEvent.setup();

    render(<ListasSeguimientoAdmin />);
    await elegirCurso(user);

    expect(apiMock.get).toHaveBeenCalledWith("/cursos", {
      params: { anio_lectivo_id: 2 },
      signal: expect.any(AbortSignal),
    });
    // La lista de un curso parte de su id: no lleva año.
    expect(apiMock.get).toHaveBeenCalledWith("/listas-seguimiento/50", {
      signal: expect.any(AbortSignal),
    });

    await user.click(screen.getByRole("checkbox", { name: /todos los cursos/i }));
    await user.type(screen.getByLabelText("Nueva columna"), "Pagó la excursión");
    await user.click(screen.getByRole("button", { name: "Agregar en todos los cursos" }));

    // Sin el año, la columna iría a los cursos del año activo.
    await waitFor(() => expect(apiMock.post).toHaveBeenCalledWith(
      "/listas-seguimiento/columnas-en-todos-los-cursos",
      { nombre: "Pagó la excursión" },
      { params: { anio_lectivo_id: 2 } },
    ));
  });

  it("en un año cerrado se consulta la lista sin poder cambiarla", async () => {
    mocks.anioLectivo = CERRADO;
    const user = userEvent.setup();

    render(<ListasSeguimientoAdmin />);
    await elegirCurso(user);

    expect(apiMock.get).toHaveBeenCalledWith("/cursos", {
      params: { anio_lectivo_id: 3 },
      signal: expect.any(AbortSignal),
    });
    expect(screen.getAllByRole("checkbox", { name: "Asistió a la cumbre: Pérez Juan" })[0])
      .toBeDisabled();
    expect(screen.queryByLabelText("Nueva columna")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).not.toBeInTheDocument();
    expect(apiMock.post).not.toHaveBeenCalled();
  });
});
