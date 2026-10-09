import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  anioLectivo: null,
  copiarConfiguracionAnio: vi.fn(),
  listarCandidatosMatricula: vi.fn(),
  listarCursos: vi.fn(),
  crearAnioLectivo: vi.fn(),
  guardarDecisionSalida: vi.fn(),
  obtenerResumenAnio: vi.fn(),
  promoverEstudiantes: vi.fn(),
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
  guardarDecisionSalida: mocks.guardarDecisionSalida,
  listarCandidatosMatricula: mocks.listarCandidatosMatricula,
  obtenerResumenAnio: mocks.obtenerResumenAnio,
  promoverEstudiantes: mocks.promoverEstudiantes,
}));
vi.mock("../services/cursosApi", () => ({
  listarCursos: mocks.listarCursos,
}));

import AniosLectivosAdmin from "./AniosLectivosAdmin";

const ACTIVO = { id: 2, anio: 2026, estado: "activo" };
const PREPARACION = { id: 3, anio: 2027, estado: "preparacion" };
const CURSOS_2026 = [{ id: 10, nombre: "PRIMERO A", jornada: "Mañana" }];
const CURSOS_2027 = [{ id: 20, nombre: "SEGUNDO A", jornada: "Mañana" }];
const CANDIDATOS = {
  candidatos: [
    {
      id: 1,
      nombre: "Ana",
      apellido: "Rojas",
      documento_identidad: "1001",
      estado: "activo",
      matriculado_en_destino: false,
      curso_destino_id: null,
    },
    {
      id: 2,
      nombre: "Luis",
      apellido: "Pardo",
      documento_identidad: "1002",
      estado: "retirado",
      matriculado_en_destino: false,
      curso_destino_id: null,
    },
    {
      id: 3,
      nombre: "Sara",
      apellido: "Díaz",
      documento_identidad: "1003",
      estado: "activo",
      matriculado_en_destino: true,
      curso_destino_id: 20,
    },
  ],
};
const RESUMEN = {
  anio_lectivo: PREPARACION,
  resumen: {
    cursos: 12,
    conceptos_pago: 2,
    estudiantes_matriculados: 3,
    valores_especiales: 1,
    pagos_registrados: 1,
    total_pagado: 250000,
  },
};

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
  mocks.listarCursos.mockImplementation((_estado, opciones = {}) =>
    Promise.resolve(opciones.parametrosAnio ? CURSOS_2027 : CURSOS_2026),
  );
  mocks.listarCandidatosMatricula.mockResolvedValue(CANDIDATOS);
  mocks.obtenerResumenAnio.mockResolvedValue(RESUMEN);
  mocks.promoverEstudiantes.mockResolvedValue({
    cantidad_matriculados: 1,
    matriculados: [1],
    curso_destino_id: 20,
    valores_especiales_copiados: [
      {
        id: 70,
        estudiante_id: 1,
        tipo_pago_nombre: "MENSUALIDAD",
        valor: 180000,
        motivo: "Beca parcial",
        estado: "revisar",
      },
    ],
  });
});

describe("preparación del año lectivo", () => {
  it("usa todo el ancho disponible y mantiene acciones adaptables en móvil", () => {
    mocks.anioLectivo = {
      anios: [PREPARACION, ACTIVO],
      anioActivo: ACTIVO,
    };

    const { container } = renderPagina();
    const pagina = container.firstElementChild;

    expect(pagina).toHaveClass("w-full");
    expect(pagina).not.toHaveClass("max-w-5xl");
    expect(
      screen.getByRole("button", { name: "Copiar configuración de 2026" }),
    ).toHaveClass("w-full", "sm:w-auto");
    expect(screen.getByRole("link", { name: "Administrar cursos" })).toHaveClass(
      "w-full",
      "sm:w-auto",
    );
  });

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
    expect(await screen.findAllByText("12 cursos")).toHaveLength(2);
    expect(screen.getAllByText("2 conceptos de pago")).toHaveLength(2);
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

  it("promueve solo los marcados y muestra los valores especiales para revisar", async () => {
    mocks.anioLectivo = {
      anios: [PREPARACION, ACTIVO],
      anioActivo: ACTIVO,
    };
    const user = userEvent.setup();
    renderPagina();

    expect(await screen.findByText("3 estudiantes matriculados")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /activar/i })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Curso de origen (2026)"), "10");
    expect(mocks.listarCandidatosMatricula).toHaveBeenCalledWith(3, 10, {
      signal: expect.any(AbortSignal),
    });

    const ana = await screen.findByRole("checkbox", { name: /Ana Rojas/ });
    const luis = screen.getByRole("checkbox", { name: /Luis Pardo/ });
    const sara = screen.getByRole("checkbox", { name: /Sara Díaz/ });
    expect(ana).toBeChecked();
    expect(luis).toBeChecked();
    expect(sara).toBeDisabled();

    await user.click(luis);
    await user.selectOptions(screen.getByLabelText("Curso destino (2027)"), "20");
    await user.click(screen.getByRole("button", { name: "Matricular 1 estudiante" }));

    expect(mocks.promoverEstudiantes).toHaveBeenCalledWith(3, {
      curso_origen_id: 10,
      curso_destino_id: 20,
      estudiante_ids: [1],
    });
    expect(await screen.findByText("1 estudiante matriculado correctamente.")).toBeInTheDocument();
    expect(screen.getByText("Revisar")).toBeInTheDocument();
    expect(screen.getByText(/MENSUALIDAD/)).toBeInTheDocument();
    expect(screen.getByText("Beca parcial")).toBeInTheDocument();
    await waitFor(() => expect(mocks.obtenerResumenAnio).toHaveBeenCalledTimes(2));
  });

  it("marca y quita la salida de quien no pasa, desde la promoción (paso 6.6)", async () => {
    mocks.anioLectivo = {
      anios: [PREPARACION, ACTIVO],
      anioActivo: ACTIVO,
    };
    mocks.listarCandidatosMatricula.mockResolvedValue({
      candidatos: [
        { ...CANDIDATOS.candidatos[0], estado_salida: null },
        { ...CANDIDATOS.candidatos[1], estado_salida: "retirado" },
        { ...CANDIDATOS.candidatos[2], estado_salida: null },
      ],
    });
    mocks.guardarDecisionSalida.mockResolvedValue({ cantidad: 1 });
    const user = userEvent.setup();
    renderPagina();

    await screen.findByRole("option", { name: /PRIMERO A/ });
    await user.selectOptions(screen.getByLabelText("Curso de origen (2026)"), "10");

    const ana = await screen.findByRole("checkbox", { name: /Ana Rojas/ });
    const luis = screen.getByRole("checkbox", { name: /Luis Pardo/ });
    expect(ana).toBeChecked();
    expect(luis).toBeDisabled();
    expect(luis).not.toBeChecked();
    expect(screen.getByText("No sigue en 2027 · Retirado")).toBeInTheDocument();
    // Ya matriculada en 2027: no se puede marcar.
    expect(
      screen.queryByRole("button", { name: "Marcar a Sara Díaz como retirado" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Marcar a Ana Rojas como egresado" }),
    );

    expect(mocks.guardarDecisionSalida).toHaveBeenCalledWith(3, {
      estudiante_ids: [1],
      estado_salida: "egresado",
    });
    expect(await screen.findByText("No sigue en 2027 · Egresado")).toBeInTheDocument();
    expect(ana).toBeDisabled();
    expect(ana).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Matricular 0 estudiantes" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Quitar la marca de Luis Pardo" }));

    expect(mocks.guardarDecisionSalida).toHaveBeenLastCalledWith(3, {
      estudiante_ids: [2],
      estado_salida: null,
    });
    await waitFor(() => expect(luis).toBeEnabled());
    expect(luis).not.toBeChecked();
    expect(screen.queryByText("No sigue en 2027 · Retirado")).not.toBeInTheDocument();
  });

  it("muestra el rechazo del backend al marcar, sin cambiar la tarjeta", async () => {
    mocks.anioLectivo = {
      anios: [PREPARACION, ACTIVO],
      anioActivo: ACTIVO,
    };
    mocks.guardarDecisionSalida.mockRejectedValue({
      response: { data: { detail: "Solo se puede matricular en un año en preparación." } },
    });
    const user = userEvent.setup();
    renderPagina();

    await screen.findByRole("option", { name: /PRIMERO A/ });
    await user.selectOptions(screen.getByLabelText("Curso de origen (2026)"), "10");
    await user.click(
      await screen.findByRole("button", { name: "Marcar a Ana Rojas como retirado" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Solo se puede matricular en un año en preparación.",
    );
    expect(screen.getByRole("checkbox", { name: /Ana Rojas/ })).toBeChecked();
  });
});
