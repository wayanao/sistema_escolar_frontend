import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import {
  consultarPlaneadorAnioAnterior,
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

// Año lectivo, paso 7.3: la página también pregunta si se puede traer el
// planeador del año pasado. Aquí el backend dice que no, como en un curso sin
// origen; el botón lo prueba PlaneadorAnual.anioLectivo.test.jsx.
vi.mock("../services/mallaCurricularApi", () => ({
  consultarPlaneadorAnioAnterior: vi.fn(),
  guardarPlaneadoresAnuales: vi.fn(),
  obtenerAsignacionesProfesor: vi.fn(),
  obtenerPlaneadoresAnuales: vi.fn(),
  traerPlaneadorAnioAnterior: vi.fn(),
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
  consultarPlaneadorAnioAnterior.mockResolvedValue({
    hay_origen: false,
    planeador_vacio: planeadores.length === 0,
    puede_traer: false,
  });
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

    expect(obtenerAsignacionesProfesor).toHaveBeenCalledWith(7, { signal: expect.any(AbortSignal) });
    expect(obtenerPlaneadoresAnuales).toHaveBeenCalledWith("42", "2");
    expect(screen.getByLabelText("Clase / grupo")).toHaveDisplayValue("Ciencias - 6A");
    expect(screen.getByLabelText("Período")).toHaveValue("2");
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
    expect(screen.getByLabelText("Período")).toHaveValue("2");
  });
});

// La clase y el período se eligen en el propio planeador (antes se leían del
// panel; sin clase, la página se quedaba en "Cargando..." para siempre).
describe("PlaneadorAnual: clase y período en la misma pantalla", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("profesor", JSON.stringify({ id: 7 }));
    localStorage.setItem("periodo_profesor_7", "2");
    guardarPlaneadoresAnuales.mockResolvedValue({ status: 200 });
  });

  it("sin clase guardada pide elegirla y no ofrece «Asistencia diaria»", async () => {
    configurarServicio();
    obtenerAsignacionesProfesor.mockResolvedValue([
      { id: 42, curso: "6A", materia: "Ciencias" },
      { id: 43, curso: "TRANSICIÓN A", materia: "ASISTENCIA DIARIA", nivel: "preescolar" },
    ]);

    render(<PlaneadorAnual />);

    expect(await screen.findByText("Elige arriba la clase que vas a planear")).toBeInTheDocument();
    expect(obtenerPlaneadoresAnuales).not.toHaveBeenCalled();
    const opciones = Array.from(screen.getByLabelText("Clase / grupo").options).map((o) => o.textContent);
    expect(opciones).toEqual(["Elige una clase", "Ciencias - 6A"]);

    fireEvent.change(screen.getByLabelText("Clase / grupo"), { target: { value: "42" } });

    await waitFor(() => expect(obtenerPlaneadoresAnuales).toHaveBeenCalledWith("42", "2"));
    expect(localStorage.getItem("asignacionId")).toBe("42");
  });

  it("con cambios sin guardar pregunta antes de cambiar de período y respeta «Seguir aquí»", async () => {
    localStorage.setItem("asignacionId", "42");
    configurarServicio();
    const { container } = render(<PlaneadorAnual />);
    await screen.findByRole("heading", { name: "Planeador Anual de Clases" });
    await screen.findByLabelText("Período");

    fireEvent.change(container.querySelector('[name="contenido-0"]'), {
      target: { value: "Lo que estoy escribiendo" },
    });
    Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
    fireEvent.change(screen.getByLabelText("Período"), { target: { value: "3" } });

    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: "Tienes cambios sin guardar",
      confirmButtonText: "Cambiar sin guardar",
      cancelButtonText: "Seguir aquí",
    })));
    expect(screen.getByLabelText("Período")).toHaveValue("2");
    expect(obtenerPlaneadoresAnuales).not.toHaveBeenCalledWith("42", "3");
    expect(container.querySelector('[name="contenido-0"]')).toHaveValue("Lo que estoy escribiendo");
  });
});
