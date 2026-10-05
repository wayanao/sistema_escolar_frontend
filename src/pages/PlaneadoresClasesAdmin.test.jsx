import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Caracterización de la bandeja de planes del admin (año lectivo, paso 4.6):
// fija las peticiones y las acciones de hoy, antes de conectarla al año.
const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({ default: apiMock }));

import PlaneadoresClasesAdmin from "./PlaneadoresClasesAdmin";

const PLAN = {
  id: 91,
  fecha: "2026-07-29",
  periodo: 3,
  tema: "Fracciones equivalentes",
  materia: "MATEMÁTICAS",
  curso: "TERCERO A",
  profesor: "ANA RUIZ",
  estado_revision: "pendiente",
  version_revision: 4,
  total_observaciones: 0,
  unidad: "Números racionales",
  proposito: "Compara fracciones",
  estandar: "Pensamiento numérico",
  dba: "Representa fracciones",
  clase: "Exploración de saberes previos",
  competencias: "Resolver ejercicios en equipo",
  actividad_casa: "Completar la guía",
  imagen1: null,
  imagen2: null,
};

// "Todas" las fechas, para que la consulta no dependa del día en que corre.
const BANDEJA = "/admin/planeadores-clases?vista=todas&estado=pendiente";

function renderizar(ruta = BANDEJA) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/admin/planeadores-clases" element={<PlaneadoresClasesAdmin />} />
        <Route path="/admin/planeadores-clases/:planId" element={<PlaneadoresClasesAdmin />} />
      </Routes>
    </MemoryRouter>,
  );
}

const consultasDeLaBandeja = () =>
  apiMock.get.mock.calls.filter(([url]) => url === "/admin/plan-de-clases");

beforeEach(() => {
  Object.values(apiMock).forEach((mock) => mock.mockReset());
  window.scrollTo = vi.fn();
  apiMock.get.mockImplementation((url, opciones) => {
    if (url === "/profesores") {
      return Promise.resolve({ data: [{ id: 7, nombre: "Ana", apellido: "Ruiz" }] });
    }
    if (url === "/admin/plan-de-clases") {
      const { limit, estado_revision: estado } = opciones.params;
      return Promise.resolve({
        data: limit === 1
          ? { items: [], total: estado === "pendiente" ? 1 : 0 }
          : { items: [PLAN], total: 1 },
      });
    }
    if (url === "/admin/plan-de-clases/91") return Promise.resolve({ data: PLAN });
    if (url === "/plan-de-clases/91/observaciones") return Promise.resolve({ data: [] });
    return Promise.reject(new Error(`GET inesperado: ${url}`));
  });
  apiMock.patch.mockResolvedValue({ data: {} });
});

describe("PlaneadoresClasesAdmin", () => {
  it("carga profesores, la bandeja y sus dos contadores con las peticiones de siempre", async () => {
    renderizar();

    expect((await screen.findAllByText("Fracciones equivalentes")).length).toBeGreaterThan(0);
    expect(apiMock.get).toHaveBeenCalledWith("/profesores");
    const conSenal = (params) => ["/admin/plan-de-clases", { params, signal: expect.any(AbortSignal) }];
    await waitFor(() => expect(consultasDeLaBandeja()).toHaveLength(3));
    expect(consultasDeLaBandeja()).toEqual(expect.arrayContaining([
      conSenal({ limit: 12, offset: 0, estado_revision: "pendiente" }),
      conSenal({ limit: 1, offset: 0, estado_revision: "pendiente" }),
      conSenal({ limit: 1, offset: 0, estado_revision: "visto" }),
    ]));

    // Hoy la revisión masiva está a la vista.
    expect(screen.getByRole("button", { name: "Marcar como vistos" })).toBeDisabled();
    expect(
      screen.getAllByRole("checkbox", { name: /Seleccionar el plan del/ }).length,
    ).toBeGreaterThan(0);
  });

  it("marcar como visto manda la revisión del plan elegido y vuelve a pedir la bandeja", async () => {
    renderizar();
    await screen.findAllByText("Fracciones equivalentes");
    await waitFor(() => expect(consultasDeLaBandeja()).toHaveLength(3));

    fireEvent.click(screen.getAllByRole("checkbox", { name: /Seleccionar el plan del/ })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Marcar 1 como visto" }));

    await waitFor(() => expect(apiMock.patch).toHaveBeenCalledWith(
      "/admin/plan-de-clases/91/revision",
      { estado: "visto", version: 4 },
    ));
    await waitFor(() => expect(consultasDeLaBandeja()).toHaveLength(6));
  });

  it("el detalle pide el plan y sus comentarios, y deja aprobar", async () => {
    renderizar("/admin/planeadores-clases/91?vista=todas&estado=pendiente");

    expect(await screen.findByText("Revisión y comentario al profesor")).toBeInTheDocument();
    expect(apiMock.get.mock.calls).toEqual([
      ["/admin/plan-de-clases/91"],
      ["/plan-de-clases/91/observaciones"],
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Aprobar planeación" }));

    await waitFor(() => expect(apiMock.patch).toHaveBeenCalledWith(
      "/admin/plan-de-clases/91/revision",
      { estado: "revisado", version: 4, comentario: null },
    ));
  });
});
