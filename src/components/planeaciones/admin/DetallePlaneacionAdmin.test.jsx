import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useImagenProtegidaMock } = vi.hoisted(() => ({
  useImagenProtegidaMock: vi.fn(),
}));

vi.mock("../../../hooks/planeaciones/useImagenProtegida", () => ({
  useImagenProtegida: useImagenProtegidaMock,
}));

import DetallePlaneacionAdmin from "./DetallePlaneacionAdmin";

const planBase = {
  id: 91,
  tema: "Fracciones equivalentes",
  materia: "MATEMÁTICAS",
  curso: "TERCERO A",
  profesor: "ANA RUIZ",
  periodo: 3,
  fecha: "2026-07-29",
  estado_revision: "pendiente",
  version_revision: 3,
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

function crearProps(overrides = {}) {
  return {
    plan: planBase,
    observaciones: [],
    observacion: "",
    cargando: false,
    accionRevision: "",
    mensaje: null,
    eliminandoImagen: "",
    onVolver: vi.fn(),
    onCambiarObservacion: vi.fn(),
    onAprobar: vi.fn(),
    onSolicitarAjuste: vi.fn(),
    onEliminarImagen: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useImagenProtegidaMock.mockImplementation((path) => ({
    url: path ? "blob:https://auligo.test/evidencia" : "",
    cargando: false,
    error: "",
  }));
  window.open = vi.fn();
});

describe("DetallePlaneacionAdmin", () => {
  it("presenta un estado de carga accesible", () => {
    render(
      <DetallePlaneacionAdmin
        {...crearProps({ plan: null, cargando: true })}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cargando planeación...",
    );
    expect(
      screen.queryByRole("button", { name: "Volver a planeaciones" }),
    ).not.toBeInTheDocument();
  });

  it("muestra el error de apertura y permite regresar", async () => {
    const user = userEvent.setup();
    const onVolver = vi.fn();

    render(
      <DetallePlaneacionAdmin
        {...crearProps({
          plan: null,
          mensaje: { tono: "error", texto: "Planeación no encontrada." },
          onVolver,
        })}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Planeación no encontrada.",
    );

    await user.click(
      screen.getByRole("button", { name: "Volver a planeaciones" }),
    );

    expect(onVolver).toHaveBeenCalledTimes(1);
  });

  it("presenta el plan completo y los estados vacíos del detalle", () => {
    render(<DetallePlaneacionAdmin {...crearProps()} />);

    expect(
      screen.getByRole("heading", { name: "Fracciones equivalentes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Matemáticas")).toBeInTheDocument();
    expect(screen.getByText("Tercero A")).toBeInTheDocument();
    expect(screen.getByText("Ana Ruiz")).toBeInTheDocument();
    expect(screen.getByText("AR")).toBeInTheDocument();
    expect(screen.getByText("Revisión 3")).toBeInTheDocument();
    expect(screen.getByText("Exploración de saberes previos")).toBeInTheDocument();
    expect(
      screen.getByText("El profesor no adjuntó imágenes en esta planeación."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Esta planeación todavía no tiene comentarios de revisión.",
      ),
    ).toBeInTheDocument();
  });

  it("delega la edición, la solicitud de ajuste y la aprobación", async () => {
    const user = userEvent.setup();
    const props = crearProps({
      observacion: "Amplía la secuencia",
      onCambiarObservacion: vi.fn(),
      onSolicitarAjuste: vi.fn(),
      onAprobar: vi.fn(),
    });

    render(<DetallePlaneacionAdmin {...props} />);

    expect(screen.getByText("19/3000")).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Comentario para el profesor" }),
      { target: { value: "Nuevo comentario" } },
    );

    await user.click(
      screen.getByRole("button", { name: "Solicitar ajuste" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Aprobar planeación" }),
    );

    expect(props.onCambiarObservacion).toHaveBeenCalledWith(
      "Nuevo comentario",
    );
    expect(props.onSolicitarAjuste).toHaveBeenCalledTimes(1);
    expect(props.onAprobar).toHaveBeenCalledTimes(1);
  });

  it("protege una revisión cerrada y presenta su historial", () => {
    const observaciones = [
      {
        id: 5,
        admin: "Coordinación",
        plan_version: 3,
        creada_at: "2026-07-29T15:00:00Z",
        observacion: "Muy buena secuencia.",
        vista_por_profesor_at: "2026-07-29T16:00:00Z",
      },
      {
        id: 4,
        admin: "",
        plan_version: 2,
        creada_at: "2026-07-28T15:00:00Z",
        observacion: "Amplía la actividad.",
        vista_por_profesor_at: null,
      },
    ];

    const { rerender } = render(
      <DetallePlaneacionAdmin
        {...crearProps({
          plan: { ...planBase, estado_revision: "revisado" },
          observaciones,
        })}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Ya está revisada" }),
    ).toBeDisabled();
    expect(screen.getByText("Coordinación")).toBeInTheDocument();
    expect(screen.getByText("Administración")).toBeInTheDocument();
    expect(screen.getByText("Vista por el profesor")).toBeInTheDocument();
    expect(screen.getByText("Pendiente de lectura")).toBeInTheDocument();
    expect(screen.getByText("Versión 3")).toHaveClass("text-violet-800");
    expect(screen.getByText("Versión 2")).toHaveClass("text-slate-600");

    rerender(
      <DetallePlaneacionAdmin
        {...crearProps({
          plan: { ...planBase, estado_revision: "revisado" },
          observaciones,
          observacion: "Felicitaciones",
        })}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Enviar reconocimiento" }),
    ).toBeEnabled();
  });

  it("abre y elimina una evidencia mediante las acciones recibidas", async () => {
    const user = userEvent.setup();
    const onEliminarImagen = vi.fn();

    render(
      <DetallePlaneacionAdmin
        {...crearProps({
          plan: { ...planBase, imagen1: "/evidencias/91.webp" },
          onEliminarImagen,
        })}
      />,
    );

    expect(useImagenProtegidaMock).toHaveBeenCalledWith(
      "/evidencias/91.webp",
    );
    expect(
      screen.getByRole("img", {
        name: "Evidencia de desarrollo cognitivo",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver completa" }));
    await user.click(screen.getByRole("button", { name: "Borrar" }));

    expect(window.open).toHaveBeenCalledWith(
      "blob:https://auligo.test/evidencia",
      "_blank",
      "noopener,noreferrer",
    );
    expect(onEliminarImagen).toHaveBeenCalledWith(91, "imagen1");
  });
});
