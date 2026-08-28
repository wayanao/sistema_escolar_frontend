import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, swalFireMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  swalFireMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: swalFireMock,
  },
}));

import Planilla from "./Planilla";

const PROFESOR_ID = 12;
const ASIGNACION_ID = 88;
const PERIODO = 3;
const ANA_ID = 501;
const LUIS_ID = 502;
const CLASE = { id: ASIGNACION_ID, materia: "Ciencias Naturales", curso: "4B" };
const PLANILLA_URL = `/planilla-excel/${ASIGNACION_ID}/${PERIODO}`;

const ESTUDIANTES_INICIALES = [
  {
    estudiante_id: ANA_ID,
    nombre: "Ana",
    apellido: "Ruiz",
    notas: { quiz: 4, "trabajo grupal": 3, mas_alto: 4.5 },
  },
  {
    estudiante_id: LUIS_ID,
    nombre: "Luis",
    apellido: "Pérez",
    notas: { quiz: 2 },
  },
];

let columnasServidor;

function prepararApi() {
  apiMock.get.mockImplementation((url) => {
    if (url === `/mis-clases/${PROFESOR_ID}`) {
      return Promise.resolve({ data: [CLASE] });
    }
    if (url === PLANILLA_URL) {
      return Promise.resolve({
        data: {
          columnas: [...columnasServidor],
          data: ESTUDIANTES_INICIALES.map((est) => ({ ...est, notas: { ...est.notas } })),
        },
      });
    }
    return Promise.reject(new Error(`GET no simulado: ${url}`));
  });

  apiMock.post.mockImplementation((url, body) => {
    if (url === "/planilla/nota") {
      if (!columnasServidor.includes(body.descripcion)) {
        columnasServidor = [...columnasServidor, body.descripcion];
      }
      return Promise.resolve({ data: {} });
    }
    return Promise.reject(new Error(`POST no simulado: ${url}`));
  });

  apiMock.delete.mockImplementation((url) => {
    if (url.startsWith("/planilla/tipo")) {
      const descripcion = new URLSearchParams(url.split("?")[1]).get("descripcion");
      columnasServidor = columnasServidor.filter((col) => col !== descripcion);
      return Promise.resolve({ data: {} });
    }
    return Promise.reject(new Error(`DELETE no simulado: ${url}`));
  });
}

function obtenerFilaEstudiante(tabla, nombreCompleto) {
  const fila = within(tabla)
    .getAllByRole("row")
    .find((row) => within(row).queryByText(nombreCompleto));
  if (!fila) throw new Error(`No se encontró la fila de "${nombreCompleto}"`);
  return fila;
}

function contarLlamadasPlanilla() {
  return apiMock.get.mock.calls.filter(([url]) => url === PLANILLA_URL).length;
}

async function abrirPlanilla() {
  render(<Planilla />);
  await screen.findByText(CLASE.materia);
  await within(screen.getByRole("table")).findByText("Ruiz Ana");
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("profesor", JSON.stringify({ id: PROFESOR_ID, nombre: "Docente" }));
  localStorage.setItem("asignacionId", String(ASIGNACION_ID));
  localStorage.setItem(`periodo_profesor_${PROFESOR_ID}`, String(PERIODO));
  localStorage.setItem("fechaAsistencia", "2026-08-01");

  columnasServidor = ["quiz", "trabajo grupal", "mas_alto"];

  apiMock.get.mockReset();
  apiMock.post.mockReset();
  apiMock.delete.mockReset();
  swalFireMock.mockReset();
  swalFireMock.mockResolvedValue({ isConfirmed: true });
  window.alert = vi.fn();

  prepararApi();
});

describe("flujo de planilla del profesor", () => {
  it("carga clases y planilla, oculta la columna interna y calcula promedios", async () => {
    await abrirPlanilla();

    expect(apiMock.get).toHaveBeenCalledWith(
      `/mis-clases/${PROFESOR_ID}`,
      { signal: expect.any(AbortSignal) },
    );
    expect(apiMock.get).toHaveBeenCalledWith(
      PLANILLA_URL,
      { signal: expect.any(AbortSignal) },
    );

    expect(screen.getByText(CLASE.materia)).toBeInTheDocument();
    expect(screen.getByText(CLASE.curso)).toBeInTheDocument();

    const tabla = screen.getByRole("table");
    expect(within(tabla).getByText("Quiz")).toBeInTheDocument();
    expect(within(tabla).getByText("Trabajo Grupal")).toBeInTheDocument();
    expect(within(tabla).queryByText(/m[aá]s alto/i)).not.toBeInTheDocument();

    const filaAna = obtenerFilaEstudiante(tabla, "Ruiz Ana");
    expect(within(filaAna).getByText("3.50")).toBeInTheDocument();
    const filaLuis = obtenerFilaEstudiante(tabla, "Pérez Luis");
    expect(within(filaLuis).getByText("2.00")).toBeInTheDocument();

    // Invariante responsive: la tarjeta móvil y la fila de escritorio conviven en el DOM.
    expect(screen.getAllByText("Ruiz Ana")).toHaveLength(2);
  });

  it("guarda una nota numérica válida y recarga la planilla", async () => {
    await abrirPlanilla();

    const tabla = screen.getByRole("table");
    const filaLuis = obtenerFilaEstudiante(tabla, "Pérez Luis");
    const [inputQuizLuis] = within(filaLuis).getAllByRole("spinbutton");
    expect(inputQuizLuis).toHaveValue(2);

    fireEvent.change(inputQuizLuis, { target: { value: "5" } });
    fireEvent.blur(inputQuizLuis);

    await waitFor(() =>
      expect(apiMock.post).toHaveBeenCalledWith("/planilla/nota", {
        estudiante_id: LUIS_ID,
        asignacion_id: ASIGNACION_ID,
        nota: 5,
        descripcion: "quiz",
        periodo: PERIODO,
        tipo_evaluacion: "numerica",
        valoracion: null,
      }),
    );
    await waitFor(() => expect(contarLlamadasPlanilla()).toBe(2));
    expect(swalFireMock).not.toHaveBeenCalled();
  });

  it("permite limpiar una nota numérica existente", async () => {
    await abrirPlanilla();

    const tabla = screen.getByRole("table");
    const filaAna = obtenerFilaEstudiante(tabla, "Ruiz Ana");
    const [inputQuizAna] = within(filaAna).getAllByRole("spinbutton");

    fireEvent.change(inputQuizAna, { target: { value: "" } });
    fireEvent.blur(inputQuizAna);

    await waitFor(() =>
      expect(apiMock.post).toHaveBeenCalledWith("/planilla/nota", {
        estudiante_id: ANA_ID,
        asignacion_id: ASIGNACION_ID,
        nota: null,
        descripcion: "quiz",
        periodo: PERIODO,
        tipo_evaluacion: "numerica",
        valoracion: null,
      }),
    );
    await waitFor(() => expect(contarLlamadasPlanilla()).toBe(2));
    expect(swalFireMock).not.toHaveBeenCalled();
  });

  it("rechaza una nota fuera de rango, avisa y restaura el valor anterior sin llamar al backend", async () => {
    await abrirPlanilla();

    const tabla = screen.getByRole("table");
    const filaAna = obtenerFilaEstudiante(tabla, "Ruiz Ana");
    const [inputQuizAna] = within(filaAna).getAllByRole("spinbutton");
    expect(inputQuizAna).toHaveValue(4);

    fireEvent.change(inputQuizAna, { target: { value: "9" } });
    fireEvent.blur(inputQuizAna);

    await waitFor(() =>
      expect(swalFireMock).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "warning",
          title: "Nota inválida",
          text: "La nota debe estar entre 1 y 5",
        }),
      ),
    );
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(contarLlamadasPlanilla()).toBe(1);
    await waitFor(() => expect(inputQuizAna).toHaveValue(4));
  });

  it("agrega un tipo de evaluación nuevo y bloquea nombres reservados o duplicados", async () => {
    const user = userEvent.setup();
    await abrirPlanilla();

    const nuevoTipoInput = screen.getByPlaceholderText("Ej: Quiz, Taller...");
    const botonAgregar = screen.getByRole("button", { name: "Agregar Tipo" });

    await user.type(nuevoTipoInput, "Mas_Alto");
    await user.click(botonAgregar);
    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Atención",
        text: "Ese nombre está reservado por el sistema.",
      }),
    );
    expect(apiMock.post).not.toHaveBeenCalled();

    await user.clear(nuevoTipoInput);
    await user.type(nuevoTipoInput, "QUIZ");
    await user.click(botonAgregar);
    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Atención",
        text: "El tipo de evaluación ya existe",
      }),
    );
    expect(apiMock.post).not.toHaveBeenCalled();

    await user.clear(nuevoTipoInput);
    await user.type(nuevoTipoInput, "Cuaderno");
    await user.click(botonAgregar);

    await waitFor(() =>
      expect(apiMock.post).toHaveBeenCalledWith("/planilla/nota", {
        estudiante_id: ANA_ID,
        asignacion_id: ASIGNACION_ID,
        nota: null,
        descripcion: "Cuaderno",
        periodo: PERIODO,
        tipo_evaluacion: "numerica",
        valoracion: null,
      }),
    );
    await waitFor(() =>
      expect(swalFireMock).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "success",
          title: "Guardado",
          text: 'El tipo de evaluación "Cuaderno" fue agregado correctamente.',
        }),
      ),
    );
    expect(nuevoTipoInput).toHaveValue("");
  });

  it("elimina un tipo de evaluación tras confirmar y codifica espacios en la URL", async () => {
    const user = userEvent.setup();
    await abrirPlanilla();

    const selects = screen.getAllByRole("combobox");
    const selectEliminar = selects.find((select) => within(select).queryByText("Seleccionar tipo"));
    await user.selectOptions(selectEliminar, "trabajo grupal");

    await user.click(screen.getByRole("button", { name: "Eliminar Tipo" }));

    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "¿Estás seguro?",
        text: "Esta acción eliminará el tipo de evaluación para todos los estudiantes",
        confirmButtonText: "Sí, eliminar",
      }),
    );

    await waitFor(() =>
      expect(apiMock.delete).toHaveBeenCalledWith(
        `/planilla/tipo?asignacion_id=${ASIGNACION_ID}&descripcion=trabajo%20grupal&periodo=${PERIODO}`,
      ),
    );
    await waitFor(() =>
      expect(swalFireMock).toHaveBeenCalledWith(
        expect.objectContaining({ icon: "success", title: "Eliminado" }),
      ),
    );

    const tabla = screen.getByRole("table");
    expect(within(tabla).queryByText("Trabajo Grupal")).not.toBeInTheDocument();
    expect(within(tabla).getByText("Quiz")).toBeInTheDocument();
  });

  it("cambia a valoraciones de desarrollo, persiste la selección y guarda mediante botones", async () => {
    const user = userEvent.setup();
    await abrirPlanilla();

    const selects = screen.getAllByRole("combobox");
    const selectTipoEvaluacion = selects.find((select) => within(select).queryByText("Numérica (1 a 5)"));
    await user.selectOptions(selectTipoEvaluacion, "desarrollo");

    expect(localStorage.getItem("planillaTipoEvaluacion")).toBe("desarrollo");

    const tabla = screen.getByRole("table");
    const filaAna = obtenerFilaEstudiante(tabla, "Ruiz Ana");
    const botonLogrado = within(filaAna).getByRole("button", { name: "Logrado en Quiz" });

    await user.click(botonLogrado);

    await waitFor(() =>
      expect(apiMock.post).toHaveBeenCalledWith("/planilla/nota", {
        estudiante_id: ANA_ID,
        asignacion_id: ASIGNACION_ID,
        nota: null,
        descripcion: "quiz",
        periodo: PERIODO,
        tipo_evaluacion: "desarrollo",
        valoracion: "logrado",
      }),
    );
    // Antes la columna de promedio quedaba en "—" porque el calculo solo leia
    // notas numericas. Ahora promedia las caritas y muestra la equivalente.
    // Se acota a la ultima celda porque el emoji tambien esta en los botones.
    const celdaPromedio = within(filaAna).getAllByRole("cell").at(-1);
    expect(within(celdaPromedio).getByText("😀")).toBeInTheDocument();
  });

  it("recuerda en localStorage el tipo de evaluación seleccionado previamente", async () => {
    localStorage.setItem("planillaTipoEvaluacion", "desarrollo");
    await abrirPlanilla();

    const tabla = screen.getByRole("table");
    const filaAna = obtenerFilaEstudiante(tabla, "Ruiz Ana");
    expect(within(filaAna).queryAllByRole("spinbutton")).toHaveLength(0);
    expect(within(filaAna).getAllByRole("button", { name: "Logrado en Quiz" })).toHaveLength(1);
  });
});
