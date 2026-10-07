import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  anioLectivo: null,
  copiarConfiguracionAnio: vi.fn(),
  crearAnioLectivo: vi.fn(),
  recargarAnios: vi.fn(),
  seleccionarAnio: vi.fn(),
}));

vi.mock("../hooks/anioLectivo/useAnioLectivo", () => ({
  default: () => ({
    ...mocks.anioLectivo,
    recargarAnios: mocks.recargarAnios,
    seleccionarAnio: mocks.seleccionarAnio,
  }),
}));
vi.mock("../services/aniosLectivosApi", () => ({
  copiarConfiguracionAnio: mocks.copiarConfiguracionAnio,
  crearAnioLectivo: mocks.crearAnioLectivo,
}));

import AniosLectivosAdmin from "./AniosLectivosAdmin";

const ACTIVO = { id: 2, anio: 2026, estado: "activo" };
const PREPARACION = { id: 3, anio: 2027, estado: "preparacion" };

function renderPagina() {
  return render(
    <MemoryRouter>
      <AniosLectivosAdmin />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.anioLectivo = { anios: [ACTIVO], anioActivo: ACTIVO };
  mocks.crearAnioLectivo.mockResolvedValue(PREPARACION);
  mocks.copiarConfiguracionAnio.mockResolvedValue({
    copiados: {
      cursos: 12,
      conceptos_pago: 2,
      precios_curso: 24,
      asignaciones: 40,
      directores_grupo: 12,
    },
  });
});

describe("preparación del año lectivo", () => {
  it("crea exactamente el siguiente año y recarga el proveedor dejándolo elegido", async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(screen.getByRole("button", { name: "Crear 2027" }));

    expect(mocks.crearAnioLectivo).toHaveBeenCalledTimes(1);
    expect(mocks.recargarAnios).toHaveBeenCalledWith({ seleccionarId: 3 });
    expect(await screen.findByText("El año 2027 quedó en preparación.")).toBeInTheDocument();
  });

  it("copia cursos y conceptos con las tres opciones explícitas", async () => {
    mocks.anioLectivo = {
      anios: [PREPARACION, ACTIVO],
      anioActivo: ACTIVO,
    };
    const user = userEvent.setup();
    renderPagina();

    expect(screen.getByText(/Los conceptos de pago se copian siempre\./)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Copiar carga académica" })).not.toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "Copiar precios por curso" }));
    await user.click(screen.getByRole("checkbox", { name: "Copiar directores de grupo" }));
    await user.click(
      screen.getByRole("button", { name: "Copiar configuración de 2026" }),
    );

    expect(mocks.copiarConfiguracionAnio).toHaveBeenCalledWith(3, {
      copiar_precios: true,
      copiar_carga_academica: false,
      copiar_directores: true,
    });
    expect(await screen.findByText("12 cursos")).toBeInTheDocument();
    expect(screen.getByText("2 conceptos de pago")).toBeInTheDocument();
    await waitFor(() => expect(mocks.recargarAnios).not.toHaveBeenCalled());

    await user.click(screen.getByRole("link", { name: "Administrar cursos" }));
    expect(mocks.seleccionarAnio).toHaveBeenCalledWith(3);
  });

  it("muestra el detalle del backend sin inventar otra regla", async () => {
    mocks.crearAnioLectivo.mockRejectedValue({
      response: { data: { detail: "Ya existe un año en preparación." } },
    });
    const user = userEvent.setup();
    renderPagina();

    await user.click(screen.getByRole("button", { name: "Crear 2027" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ya existe un año en preparación.",
    );
  });
});
