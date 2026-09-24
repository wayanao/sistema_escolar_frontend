import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
const CLASE_PREESCOLAR = {
  id: ASIGNACION_ID,
  materia: "Desarrollo Cognitivo",
  curso: "Transición A",
  nivel: "preescolar",
};
const CLASE_PRIMARIA = {
  id: ASIGNACION_ID,
  materia: "Ciencias Naturales",
  curso: "4B",
  nivel: "primaria",
};
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

function prepararApi({ clase = CLASE, estudiantes = ESTUDIANTES_INICIALES } = {}) {
  apiMock.get.mockImplementation((url) => {
    if (url === `/mis-clases/${PROFESOR_ID}`) {
      return Promise.resolve({ data: [clase] });
    }
    if (url === PLANILLA_URL) {
      return Promise.resolve({
        data: {
          columnas: [...columnasServidor],
          data: estudiantes.map((est) => ({ ...est, notas: { ...est.notas } })),
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

async function abrirPlanilla({ clase = CLASE } = {}) {
  render(<Planilla />);
  await screen.findByText(clase.materia);
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

  it("guarda una nota numérica válida con una sola escritura y sin recargar la planilla", async () => {
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
    expect(apiMock.post).toHaveBeenCalledTimes(1);
    // La planilla solo se pidió al abrir: guardar ya no la descarga entera.
    expect(contarLlamadasPlanilla()).toBe(1);
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
    expect(contarLlamadasPlanilla()).toBe(1);
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

  it("en un curso de preescolar no muestra el selector de tipo de evaluación", async () => {
    prepararApi({ clase: CLASE_PREESCOLAR });
    await abrirPlanilla({ clase: CLASE_PREESCOLAR });

    expect(screen.queryByText("Tipo de calificación")).not.toBeInTheDocument();
  });

  it("en un curso de preescolar evalúa con desarrollo aunque localStorage diga numérica", async () => {
    localStorage.setItem("planillaTipoEvaluacion", "numerica");
    prepararApi({ clase: CLASE_PREESCOLAR });
    await abrirPlanilla({ clase: CLASE_PREESCOLAR });

    const tabla = screen.getByRole("table");
    const filaAna = obtenerFilaEstudiante(tabla, "Ruiz Ana");
    // El modo de captura es de caritas (botones), no de número: el nivel del
    // curso manda sobre la preferencia guardada.
    expect(within(filaAna).queryAllByRole("spinbutton")).toHaveLength(0);
    expect(within(filaAna).getAllByRole("button", { name: "Logrado en Quiz" })).toHaveLength(1);

    const botonLogrado = within(filaAna).getByRole("button", { name: "Logrado en Quiz" });
    await fireEvent.click(botonLogrado);

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
  });

  it("en un curso de primaria no muestra el selector de tipo de evaluación", async () => {
    prepararApi({ clase: CLASE_PRIMARIA });
    await abrirPlanilla({ clase: CLASE_PRIMARIA });

    expect(screen.queryByText("Tipo de calificación")).not.toBeInTheDocument();
  });

  it("en un curso de primaria evalúa con numérica aunque localStorage diga desarrollo", async () => {
    localStorage.setItem("planillaTipoEvaluacion", "desarrollo");
    prepararApi({ clase: CLASE_PRIMARIA });
    await abrirPlanilla({ clase: CLASE_PRIMARIA });

    const tabla = screen.getByRole("table");
    const filaLuis = obtenerFilaEstudiante(tabla, "Pérez Luis");
    // El modo de captura es numérico (spinbutton), no de caritas: el nivel
    // del curso manda sobre la preferencia guardada.
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
  });

  it("medición de peticiones: salir sin cambiar no gasta red y cada nota cuesta una sola escritura", async () => {
    // Escenario de medicion del rendimiento de la planilla, con los numeros
    // que justificaron el cambio. Antes: 20 POST y 21 GET. Ahora: 10 POST y el
    // GET inicial. Si alguien reintroduce la recarga completa o el guardado
    // incondicional al salir de la celda, esta prueba lo caza.
    const ESTUDIANTES_MEDICION = Array.from({ length: 10 }, (_, indice) => ({
      estudiante_id: 600 + indice,
      nombre: `Nombre${indice}`,
      apellido: `Apellido${indice}`,
      notas: { quiz: 3 },
    }));

    columnasServidor = ["quiz"];
    prepararApi({ estudiantes: ESTUDIANTES_MEDICION });

    render(<Planilla />);
    await screen.findByText(CLASE.materia);
    const tabla = screen.getByRole("table");
    await within(tabla).findByText("Apellido0 Nombre0");

    const celdas = within(tabla).getAllByRole("spinbutton");
    expect(celdas).toHaveLength(10);

    const medicion = {};
    const getInicial = contarLlamadasPlanilla();

    // Fase 1: el profesor recorre las diez celdas y sale de todas sin tocarlas.
    await act(async () => {
      celdas.forEach((celda) => fireEvent.blur(celda));
    });

    medicion.postAlSalirSinCambiar = apiMock.post.mock.calls.length;
    medicion.getAlSalirSinCambiar = contarLlamadasPlanilla() - getInicial;

    // Fase 2: ahora sí califica las diez.
    await act(async () => {
      celdas.forEach((celda, indice) => {
        // Nunca 3, que es la nota que ya tenían: eso sería "sin cambio".
        fireEvent.change(celda, { target: { value: String(4 + (indice % 2)) } });
        fireEvent.blur(celda);
      });
    });

    medicion.postAlCalificarDiez =
      apiMock.post.mock.calls.length - medicion.postAlSalirSinCambiar;
    medicion.getAlCalificarDiez =
      contarLlamadasPlanilla() - getInicial - medicion.getAlSalirSinCambiar;

    expect(medicion).toEqual({
      postAlSalirSinCambiar: 0,
      getAlSalirSinCambiar: 0,
      postAlCalificarDiez: 10,
      getAlCalificarDiez: 0,
    });
    expect(getInicial).toBe(1);
  });

  it("en un curso sin nivel definido sigue dejando elegir el tipo de evaluación", async () => {
    // CLASE no trae `nivel`: es el comportamiento anterior a esta
    // funcionalidad, preservado para los cursos que todavía no se han
    // clasificado como preescolar o primaria.
    prepararApi({ clase: CLASE });
    await abrirPlanilla({ clase: CLASE });

    expect(screen.getByText("Tipo de calificación")).toBeInTheDocument();
  });
});
