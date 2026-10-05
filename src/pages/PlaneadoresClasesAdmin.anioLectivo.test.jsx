import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// La bandeja de planes mirando un año que no es el activo (paso 4.6 del año
// lectivo). Con el año activo, `PlaneadoresClasesAdmin.test.jsx` sigue igual:
// fuera del proveedor, `useAnioLectivo` devuelve el año activo.
const mocks = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  anioLectivo: null,
}));

vi.mock("../utils/api", () => ({ default: mocks.apiMock }));
vi.mock("../hooks/anioLectivo/useAnioLectivo", () => ({
  default: () => mocks.anioLectivo,
}));

import PlaneadoresClasesAdmin from "./PlaneadoresClasesAdmin";

const { apiMock } = mocks;
const EN_PREPARACION = {
  parametros: { anio_lectivo_id: 2 },
  permisos: { esAnioActivo: false, puedeEditar: true },
};
const CERRADO = {
  parametros: { anio_lectivo_id: 3 },
  permisos: { esAnioActivo: false, puedeEditar: false },
};

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
      return Promise.resolve({
        data: opciones.params.limit === 1
          ? { items: [], total: 1 }
          : { items: [PLAN], total: 1 },
      });
    }
    if (url === "/admin/plan-de-clases/91") return Promise.resolve({ data: PLAN });
    if (url === "/plan-de-clases/91/observaciones") return Promise.resolve({ data: [] });
    return Promise.reject(new Error(`GET inesperado: ${url}`));
  });
});

describe("Bandeja de planes mirando otro año", () => {
  it("en un año cerrado pide la bandeja y sus contadores de ese año, sin marcar como vistos", async () => {
    mocks.anioLectivo = CERRADO;

    renderizar();

    expect((await screen.findAllByText("Fracciones equivalentes")).length).toBeGreaterThan(0);
    await waitFor(() => expect(consultasDeLaBandeja()).toHaveLength(3));
    for (const [, opciones] of consultasDeLaBandeja()) {
      expect(opciones.params.anio_lectivo_id).toBe(3);
      expect(opciones.signal).toEqual(expect.any(AbortSignal));
    }
    // Los profesores no son de un año.
    expect(apiMock.get).toHaveBeenCalledWith("/profesores");
    // Marcar como visto es guardar una revisión: en un año cerrado no se ofrece.
    expect(screen.queryByRole("checkbox", { name: /Seleccionar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Marcar .*como vistos?/ })).not.toBeInTheDocument();
  });

  it("en un año cerrado el detalle de un plan es solo consulta", async () => {
    mocks.anioLectivo = CERRADO;

    renderizar("/admin/planeadores-clases/91?vista=todas&estado=pendiente");

    expect(await screen.findByRole("button", { name: /Volver a la bandeja/ })).toBeInTheDocument();
    // El detalle parte del id del plan: no lleva año.
    expect(apiMock.get.mock.calls).toEqual([
      ["/admin/plan-de-clases/91"],
      ["/plan-de-clases/91/observaciones"],
    ]);
    expect(screen.queryByText("Revisión y comentario al profesor")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Aprobar/ })).not.toBeInTheDocument();
  });

  it("en preparación la bandeja es la de ese año y se puede marcar como visto", async () => {
    mocks.anioLectivo = EN_PREPARACION;

    renderizar();

    await screen.findAllByText("Fracciones equivalentes");
    await waitFor(() => expect(consultasDeLaBandeja()).toHaveLength(3));
    for (const [, opciones] of consultasDeLaBandeja()) {
      expect(opciones.params.anio_lectivo_id).toBe(2);
    }
    expect(screen.getByRole("button", { name: "Marcar como vistos" })).toBeInTheDocument();
  });
});
