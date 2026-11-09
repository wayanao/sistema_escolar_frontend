import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import {
  consultarPlaneadorAnioAnterior,
  guardarPlaneadoresAnuales,
  obtenerAsignacionesProfesor,
  obtenerPlaneadoresAnuales,
  traerPlaneadorAnioAnterior,
} from "../services/mallaCurricularApi";
import PlaneadorAnual from "./PlaneadorAnual";

// Año lectivo, fase 7, paso 7.3: "Traer el planeador del año pasado" en la
// página completa. El botón aparece solo si el backend dice `puede_traer`; al
// usarlo se recarga el periodo, con las fechas vacías.

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

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

const BOTON = { name: "Traer el planeador del año pasado" };
const MENSAJE_TRAIDO =
  "Se trajo el planeador del año pasado. Las fechas quedaron vacías: pon las de este año al guardar cada periodo.";
const traido = {
  slot: 1,
  unidad_tematica: "Restas",
  estandar_competencia: "Resta",
  contenido: "Restas simples",
  actividades_recursos: "Guía",
  fecha: null,
};

const configurar = ({ planeadores = [], puedeTraer = true } = {}) => {
  obtenerAsignacionesProfesor.mockResolvedValue([
    { id: 42, curso: "PRIMERO A", materia: "MATEMÁTICAS" },
  ]);
  obtenerPlaneadoresAnuales.mockResolvedValue({ planeadores });
  consultarPlaneadorAnioAnterior.mockResolvedValue({
    hay_origen: true,
    planeador_vacio: planeadores.length === 0,
    puede_traer: puedeTraer,
  });
};

const abrir = async () => {
  const pantalla = render(<PlaneadorAnual />);
  await screen.findByRole("heading", { name: "Planeador Anual de Clases" });
  return pantalla;
};

describe("PlaneadorAnual: traer el planeador del año pasado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("profesor", JSON.stringify({ id: 8 }));
    localStorage.setItem("asignacionId", "42");
    localStorage.setItem("periodo_profesor_8", "2");
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    traerPlaneadorAnioAnterior.mockResolvedValue({ message: MENSAJE_TRAIDO, filas_copiadas: 5 });
  });

  it("con el planeador vacío y el visto bueno del backend, ofrece el botón", async () => {
    configurar();
    await abrir();

    expect(await screen.findByRole("button", BOTON)).toBeEnabled();
    expect(consultarPlaneadorAnioAnterior).toHaveBeenCalledWith("42");
    expect(consultarPlaneadorAnioAnterior).toHaveBeenCalledTimes(1);
  });

  it("al traerlo, recarga el periodo con las filas traídas y las fechas vacías", async () => {
    configurar();
    const { container } = await abrir();
    fireEvent.click(await screen.findByRole("button", BOTON));

    // Lo que devuelve el periodo después de traer.
    obtenerPlaneadoresAnuales.mockResolvedValue({ planeadores: [traido] });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: "success",
        title: "Planeador traído",
        text: MENSAJE_TRAIDO,
      }));
    });
    expect(traerPlaneadorAnioAnterior).toHaveBeenCalledWith("42");
    expect(obtenerPlaneadoresAnuales).toHaveBeenLastCalledWith("42", "2");
    expect(container.querySelector('[name="unidad_tematica-0"]')).toHaveValue("Restas");
    expect(container.querySelector('[name="fecha-0"]')).toHaveValue("");
    expect(screen.queryByRole("button", BOTON)).not.toBeInTheDocument();
    expect(guardarPlaneadoresAnuales).not.toHaveBeenCalled();
  });

  it("lo traído no se guarda sin fechas: el guardado normal las pide", async () => {
    configurar();
    await abrir();
    obtenerPlaneadoresAnuales.mockResolvedValue({ planeadores: [traido] });
    fireEvent.click(await screen.findByRole("button", BOTON));
    await waitFor(() => {
      expect(screen.queryByRole("button", BOTON)).not.toBeInTheDocument();
    });
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: "warning",
        title: "Falta la fecha en la fila 1",
      }));
    });
    expect(guardarPlaneadoresAnuales).not.toHaveBeenCalled();
  });

  it("con filas en el periodo no pregunta ni ofrece nada", async () => {
    configurar({
      planeadores: [{ ...traido, fecha: "2027-03-01" }],
    });
    await abrir();

    await waitFor(() => expect(obtenerPlaneadoresAnuales).toHaveBeenCalled());
    expect(consultarPlaneadorAnioAnterior).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", BOTON)).not.toBeInTheDocument();
  });

  it("si el backend dice que no, no hay botón", async () => {
    configurar({ puedeTraer: false });
    await abrir();

    await waitFor(() => expect(consultarPlaneadorAnioAnterior).toHaveBeenCalled());
    expect(screen.queryByRole("button", BOTON)).not.toBeInTheDocument();
  });

  it("si el backend rechaza al traer, muestra su mensaje y no toca el planeador", async () => {
    configurar();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    traerPlaneadorAnioAnterior.mockRejectedValue({
      response: {
        status: 409,
        data: {
          detail: "Este planeador ya tiene contenido. No se trajo nada, para no reemplazar lo que ya está escrito.",
        },
      },
    });
    await abrir();

    fireEvent.click(await screen.findByRole("button", BOTON));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: "error",
        text: "Este planeador ya tiene contenido. No se trajo nada, para no reemplazar lo que ya está escrito.",
      }));
    });
    expect(obtenerPlaneadoresAnuales).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", BOTON)).not.toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("con algo escrito sin guardar, esconde el botón para no borrarlo al traer", async () => {
    configurar();
    const { container } = await abrir();
    await screen.findByRole("button", BOTON);

    fireEvent.change(container.querySelector('[name="contenido-0"]'), {
      target: { value: "Lo que estoy escribiendo" },
    });

    expect(screen.queryByRole("button", BOTON)).not.toBeInTheDocument();
    expect(traerPlaneadorAnioAnterior).not.toHaveBeenCalled();
  });

  it("al cambiar a otro periodo vacío no vuelve a preguntar", async () => {
    configurar();
    await abrir();
    await screen.findByRole("button", BOTON);

    fireEvent.change(screen.getByLabelText("Período"), { target: { value: "3" } });

    await waitFor(() => {
      expect(obtenerPlaneadoresAnuales).toHaveBeenLastCalledWith("42", "3");
    });
    expect(await screen.findByRole("button", BOTON)).toBeInTheDocument();
    expect(consultarPlaneadorAnioAnterior).toHaveBeenCalledTimes(1);
  });
});
