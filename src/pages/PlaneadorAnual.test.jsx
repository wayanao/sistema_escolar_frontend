import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import {
  guardarPlaneadoresAnuales,
  obtenerAsignacionesProfesor,
  obtenerPlaneadoresAnuales,
} from "../services/mallaCurricularApi";
import PlaneadorAnual from "./PlaneadorAnual";

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

vi.mock("../services/mallaCurricularApi", () => ({
  guardarPlaneadoresAnuales: vi.fn(),
  obtenerAsignacionesProfesor: vi.fn(),
  obtenerPlaneadoresAnuales: vi.fn(),
}));

vi.mock("../components/impresion/DocumentoImprimible", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

const planeadorGuardado = (overrides = {}) => ({
  slot: 1,
  unidad_tematica: "Ecosistemas",
  estandar_competencia: "Explica relaciones",
  contenido: "Cadenas tróficas",
  actividades_recursos: "Mapa conceptual",
  fecha: "2026-08-20T00:00:00.000Z",
  ...overrides,
});

const configurarServicio = (planeadores = []) => {
  obtenerAsignacionesProfesor.mockResolvedValue([
    { id: 42, curso: "6A", materia: "Ciencias" },
  ]);
  obtenerPlaneadoresAnuales.mockResolvedValue({ planeadores });
};

describe("comportamiento de PlaneadorAnual", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("profesor", JSON.stringify({ id: 7 }));
    localStorage.setItem("asignacionId", "42");
    localStorage.setItem("periodo_profesor_7", "2");
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    guardarPlaneadoresAnuales.mockResolvedValue({ status: 200 });
  });

  it("carga la asignación, el periodo persistido y las filas respetando slot", async () => {
    configurarServicio([
      planeadorGuardado({ slot: 3, unidad_tematica: "Tercera" }),
      planeadorGuardado({ slot: 1, unidad_tematica: "Primera" }),
    ]);

    const { container } = render(<PlaneadorAnual />);

    await screen.findByRole("heading", { name: "Planeador Anual de Clases" });

    expect(obtenerAsignacionesProfesor).toHaveBeenCalledWith(7);
    expect(obtenerPlaneadoresAnuales).toHaveBeenCalledWith("42", "2");
    expect(screen.getByRole("combobox")).toHaveValue("2");
    expect(container.querySelector('[name="unidad_tematica-0"]')).toHaveValue("Primera");
    expect(container.querySelector('[name="unidad_tematica-1"]')).toHaveValue("");
    expect(container.querySelector('[name="unidad_tematica-2"]')).toHaveValue("Tercera");
    expect(screen.getByText("Guardado")).toBeInTheDocument();
  });

  it("impide guardar una fila con contenido y sin fecha", async () => {
    configurarServicio();
    const { container } = render(<PlaneadorAnual />);

    await screen.findByRole("heading", { name: "Planeador Anual de Clases" });
    fireEvent.change(container.querySelector('[name="contenido-0"]'), {
      target: { value: "Cadenas tróficas" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: "warning",
        title: "Falta la fecha en la fila 1",
      }));
    });
    expect(guardarPlaneadoresAnuales).not.toHaveBeenCalled();
  });

  it("envía ocho filas por posición y conserva vacíos para la eliminación implícita", async () => {
    configurarServicio();
    const { container } = render(<PlaneadorAnual />);

    await screen.findByRole("heading", { name: "Planeador Anual de Clases" });
    fireEvent.change(container.querySelector('[name="unidad_tematica-0"]'), {
      target: { value: "  Ecosistemas  " },
    });
    fireEvent.change(container.querySelector('[name="fecha-0"]'), {
      target: { value: "2026-08-20" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    await waitFor(() => {
      expect(guardarPlaneadoresAnuales).toHaveBeenCalledTimes(1);
    });

    const [asignacionId, periodo, payload] = guardarPlaneadoresAnuales.mock.calls[0];
    expect(asignacionId).toBe("42");
    expect(periodo).toBe("2");
    expect(payload).toHaveLength(8);
    expect(payload[0]).toEqual({
      unidad_tematica: "Ecosistemas",
      estandar_competencia: "",
      contenido: "",
      actividades_recursos: "",
      fecha: "2026-08-20",
    });
    expect(payload[1]).toEqual({
      unidad_tematica: "",
      estandar_competencia: "",
      contenido: "",
      actividades_recursos: "",
      fecha: null,
    });
  });

  it("entra a la vista imprimible y permite regresar al editor", async () => {
    configurarServicio([planeadorGuardado()]);
    render(<PlaneadorAnual />);

    await screen.findByRole("heading", { name: "Planeador Anual de Clases" });
    fireEvent.click(screen.getByRole("button", { name: /Imprimir Período/ }));

    const regresar = screen.getByRole("button", { name: /Atrás/ });
    expect(regresar).toBeInTheDocument();
    fireEvent.click(regresar);

    expect(screen.getByRole("heading", { name: "Planeador Anual de Clases" })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("2");
  });
});
