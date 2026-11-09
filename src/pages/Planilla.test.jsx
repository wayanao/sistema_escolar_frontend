import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, swalFireMock, swalUpdateMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  swalFireMock: vi.fn(),
  swalUpdateMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

// Agregar y eliminar tipos usan la espera que pasa a éxito en la misma
// ventana (ventanaExito.js).
vi.mock("sweetalert2", () => ({
  default: {
    fire: swalFireMock,
    update: swalUpdateMock,
    getFooter: vi.fn(),
    getPopup: vi.fn(),
    isVisible: vi.fn(),
    close: vi.fn(),
  },
}));

import Planilla from "./Planilla";
import { opcionesExitoTrasEspera } from "../hooks/ventanaExito";

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
// Porcentajes por tipo de nota (parte B, paso B4b), como los guarda el servidor.
let porcentajesServidor;

function prepararApi({ clase = CLASE, estudiantes = ESTUDIANTES_INICIALES } = {}) {
  apiMock.get.mockImplementation((url) => {
    if (url === `/mis-clases/${PROFESOR_ID}`) {
      return Promise.resolve({ data: [clase] });
    }
    if (url === PLANILLA_URL) {
      return Promise.resolve({
        data: {
          columnas: [...columnasServidor],
          porcentajes: { ...porcentajesServidor },
          data: estudiantes.map((est) => ({ ...est, notas: { ...est.notas } })),
        },
      });
    }
    return Promise.reject(new Error(`GET no simulado: ${url}`));
  });

  apiMock.put.mockImplementation((url, body) => {
    if (url === "/planilla/tipos/porcentaje") {
      if (body.porcentaje === null) delete porcentajesServidor[body.tipo_nota];
      else porcentajesServidor[body.tipo_nota] = body.porcentaje;
      return Promise.resolve({ data: { tipo_nota: body.tipo_nota, porcentaje: body.porcentaje } });
    }
    return Promise.reject(new Error(`PUT no simulado: ${url}`));
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
  // La clase ya no se muestra como texto: es la elegida en el selector.
  await screen.findByDisplayValue(`${clase.materia} - ${clase.curso}`);
  await within(screen.getByRole("table")).findByText("Ruiz Ana");
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("profesor", JSON.stringify({ id: PROFESOR_ID, nombre: "Docente" }));
  localStorage.setItem("asignacionId", String(ASIGNACION_ID));
  localStorage.setItem(`periodo_profesor_${PROFESOR_ID}`, String(PERIODO));
  localStorage.setItem("fechaAsistencia", "2026-08-01");

  columnasServidor = ["quiz", "trabajo grupal", "mas_alto"];
  porcentajesServidor = {};

  apiMock.get.mockReset();
  apiMock.post.mockReset();
  apiMock.put.mockReset();
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
    // Subnotas, paso A3: la planilla se pide con sus subnotas, en la misma ruta.
    // Porcentajes, paso B4a: y con sus porcentajes por tipo de nota.
    expect(apiMock.get).toHaveBeenCalledWith(
      PLANILLA_URL,
      {
        signal: expect.any(AbortSignal),
        params: { con_subnotas: true, con_porcentajes: true },
      },
    );

    expect(screen.getByLabelText("Clase / grupo")).toHaveDisplayValue(
      `${CLASE.materia} - ${CLASE.curso}`,
    );
    expect(screen.getByLabelText("Período")).toHaveValue(String(PERIODO));

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
      expect(swalUpdateMock).toHaveBeenCalledWith(
        opcionesExitoTrasEspera({
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
      expect(swalUpdateMock).toHaveBeenCalledWith(
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
    await screen.findByDisplayValue(`${CLASE.materia} - ${CLASE.curso}`);
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

describe("subnotas en la planilla (paso A4)", () => {
  const SUBNOTAS_QUIZ = [
    { id: 7, nombre: "Taller 1" },
    { id: 8, nombre: "Parcial" },
  ];

  function prepararConSubnotas() {
    columnasServidor = ["quiz", "trabajo grupal"];
    const estudiantes = [
      {
        estudiante_id: ANA_ID, nombre: "Ana", apellido: "Ruiz",
        notas: { quiz: 4, "trabajo grupal": 3 },
        subnotas: { 7: 4, 8: 4 },
      },
      {
        estudiante_id: LUIS_ID, nombre: "Luis", apellido: "Pérez",
        notas: { quiz: 2 },
        subnotas: {},
      },
    ];
    apiMock.get.mockImplementation((url) => {
      if (url === `/mis-clases/${PROFESOR_ID}`) return Promise.resolve({ data: [CLASE] });
      if (url === PLANILLA_URL) {
        return Promise.resolve({
          data: {
            columnas: [...columnasServidor],
            subnotas: { quiz: SUBNOTAS_QUIZ },
            data: estudiantes.map((est) => ({ ...est, notas: { ...est.notas } })),
          },
        });
      }
      return Promise.reject(new Error(`GET no simulado: ${url}`));
    });
    apiMock.post.mockImplementation((url, body) => {
      if (url === "/planilla/subnotas/valores") {
        // El servidor responde lo que quedó guardado: aquí, el promedio simple.
        const notas = Object.values(body.valores).filter((valor) => valor !== null);
        const nota = notas.reduce((suma, valor) => suma + valor, 0) / notas.length;
        return Promise.resolve({
          data: {
            estudiante_id: body.estudiante_id,
            tipo_nota: body.tipo_nota,
            tipo_evaluacion: "numerica",
            nota,
            valoracion: null,
            subnotas: body.valores,
          },
        });
      }
      return Promise.reject(new Error(`POST no simulado: ${url}`));
    });
  }

  it("califica las subnotas desde la celda: la celda pasa a calculada sin recargar la planilla", async () => {
    prepararConSubnotas();
    const usuario = userEvent.setup();
    await abrirPlanilla();
    const tabla = screen.getByRole("table");

    // Ana ya tiene subnotas: su celda es calculada y no tiene campo.
    const filaAna = obtenerFilaEstudiante(tabla, "Ruiz Ana");
    expect(within(filaAna).getByRole("button", {
      name: "Quiz de Ruiz Ana: 4.00. Calculada con 2 subnotas. Abrir subnotas",
    })).toBeInTheDocument();
    expect(within(filaAna).getAllByRole("spinbutton")).toHaveLength(1); // solo "trabajo grupal"

    // Luis escribe a mano: abre sus subnotas desde el botón de la celda.
    const filaLuis = obtenerFilaEstudiante(tabla, "Pérez Luis");
    await usuario.click(within(filaLuis).getByRole("button", { name: "Subnotas de Quiz de Pérez Luis" }));

    const modal = await screen.findByRole("dialog", { name: "Pérez Luis · Quiz" });
    expect(within(modal).getByRole("note")).toHaveTextContent("Nota escrita a mano: 2.00.");
    await usuario.type(within(modal).getByLabelText("Taller 1"), "5");
    await usuario.type(within(modal).getByLabelText("Parcial"), "3");
    expect(within(modal).getByText("4.00")).toBeInTheDocument();

    await usuario.click(within(modal).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledWith(
      "/planilla/subnotas/valores",
      {
        asignacion_id: ASIGNACION_ID,
        periodo: PERIODO,
        tipo_nota: "quiz",
        estudiante_id: LUIS_ID,
        tipo_evaluacion: "numerica",
        valores: { 7: 5, 8: 3 },
      },
      undefined,
    ));
    const celdaLuis = await within(filaLuis).findByRole("button", {
      name: "Quiz de Pérez Luis: 4.00. Calculada con 2 subnotas. Abrir subnotas",
    });
    expect(celdaLuis).toBeInTheDocument();
    // Solo queda el campo de "trabajo grupal": el de quiz ya es calculado.
    expect(within(filaLuis).getAllByRole("spinbutton")).toHaveLength(1);
    expect(within(filaLuis).getByText("4.00", { selector: "td:last-child span" })).toBeInTheDocument();
    expect(contarLlamadasPlanilla()).toBe(1);

    // Anterior, sin cambios, pasa a Ana sin escribir nada.
    await usuario.click(within(modal).getByRole("button", { name: "← Anterior" }));
    expect(await screen.findByRole("dialog", { name: "Ruiz Ana · Quiz" })).toBeInTheDocument();
    expect(screen.getByLabelText("Taller 1")).toHaveValue("4");
    expect(apiMock.post).toHaveBeenCalledTimes(1);

    await usuario.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Siguiente guarda lo escrito y pasa al estudiante de abajo", async () => {
    prepararConSubnotas();
    const usuario = userEvent.setup();
    await abrirPlanilla();
    const filaAna = obtenerFilaEstudiante(screen.getByRole("table"), "Ruiz Ana");

    await usuario.click(within(filaAna).getByRole("button", { name: /^Quiz de Ruiz Ana: 4.00/ }));
    const modal = await screen.findByRole("dialog", { name: "Ruiz Ana · Quiz" });
    const parcial = within(modal).getByLabelText("Parcial");
    await usuario.clear(parcial);
    await usuario.type(parcial, "5{Enter}");

    expect(await screen.findByRole("dialog", { name: "Pérez Luis · Quiz" })).toBeInTheDocument();
    expect(apiMock.post).toHaveBeenCalledTimes(1);
    expect(apiMock.post.mock.calls[0][1]).toMatchObject({ estudiante_id: ANA_ID, valores: { 8: 5 } });
    expect(within(filaAna).getByRole("button", { name: /^Quiz de Ruiz Ana: 5.00/ })).toBeInTheDocument();
  });
});

// Porcentajes por tipo de nota, paso B4b (parte B de
// docs/funcionalidades/SUBNOTAS_PLANILLA.md, PB9): la franja de porcentajes,
// el porcentaje en cada encabezado y el promedio ponderado.
describe("porcentajes por tipo de nota en la planilla", () => {
  const promedioDe = (fila) => within(fila).getAllByRole("cell").at(-1);

  it("sin ningún porcentaje solo ofrece ponerlos: sin suma, sin aviso y el promedio de siempre", async () => {
    await abrirPlanilla();

    expect(screen.getByRole("button", { name: "Poner porcentaje a Quiz" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    const filaAna = obtenerFilaEstudiante(screen.getByRole("table"), "Ruiz Ana");
    expect(promedioDe(filaAna)).toHaveTextContent("3.50");
  });

  it("con porcentajes completos el promedio es el ponderado y cada encabezado muestra el suyo", async () => {
    porcentajesServidor = { quiz: 60, "trabajo grupal": 40 };
    await abrirPlanilla();

    const tabla = screen.getByRole("table");
    // Ana: 4 x 60 % + 3 x 40 % = 3.60 (el simple era 3.50).
    expect(promedioDe(obtenerFilaEstudiante(tabla, "Ruiz Ana"))).toHaveTextContent("3.60");
    expect(within(tabla).getByText("60 %")).toBeInTheDocument();
    expect(within(tabla).getByText("40 %")).toBeInTheDocument();
    expect(screen.getByText("Porcentajes: 100 % de 100 %")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Porcentajes completos: el promedio es ponderado.");
  });

  it("cambiar un porcentaje lo guarda y, si ya no suman 100, vuelve el promedio simple con el aviso, sin recargar", async () => {
    const usuario = userEvent.setup();
    porcentajesServidor = { quiz: 60, "trabajo grupal": 40 };
    await abrirPlanilla();
    const cargasAntes = contarLlamadasPlanilla();

    await usuario.click(screen.getByRole("button", { name: "Cambiar el porcentaje de Quiz: 60 %" }));
    const campo = screen.getByRole("textbox", { name: "Porcentaje de Quiz" });
    await usuario.clear(campo);
    await usuario.type(campo, "50{Enter}");

    expect(apiMock.put).toHaveBeenCalledWith(
      "/planilla/tipos/porcentaje",
      { asignacion_id: ASIGNACION_ID, periodo: PERIODO, tipo_nota: "quiz", porcentaje: 50 },
      undefined,
    );
    await screen.findByText("Porcentajes: 90 % de 100 %");
    expect(screen.getByRole("status")).toHaveTextContent("Faltan porcentajes: se usa el promedio simple.");
    const filaAna = obtenerFilaEstudiante(screen.getByRole("table"), "Ruiz Ana");
    expect(promedioDe(filaAna)).toHaveTextContent("3.50");
    expect(contarLlamadasPlanilla()).toBe(cargasAntes);
  });

  it("crear un tipo con su porcentaje lo guarda después de crear el tipo", async () => {
    const usuario = userEvent.setup();
    await abrirPlanilla();

    fireEvent.change(screen.getByPlaceholderText("Ej: Quiz, Taller..."), { target: { value: "Cuaderno" } });
    fireEvent.change(screen.getByLabelText("Porcentaje (%)"), { target: { value: "40" } });
    await usuario.click(screen.getByRole("button", { name: "Agregar Tipo" }));

    await screen.findByRole("button", { name: "Cambiar el porcentaje de Cuaderno: 40 %" });
    expect(apiMock.post).toHaveBeenCalledWith("/planilla/nota", expect.objectContaining({ descripcion: "Cuaderno" }));
    expect(apiMock.put).toHaveBeenCalledWith(
      "/planilla/tipos/porcentaje",
      { asignacion_id: ASIGNACION_ID, periodo: PERIODO, tipo_nota: "Cuaderno", porcentaje: 40 },
      undefined,
    );
    expect(screen.getByText("Porcentajes: 40 % de 100 %")).toBeInTheDocument();
    expect(screen.getByLabelText("Porcentaje (%)")).toHaveValue("");
  });
});

// La clase y el período se eligen dentro de la planilla (antes solo en el
// panel, y sin clase elegida una alerta devolvía al profesor al inicio).
describe("clase y período elegidos en la planilla", () => {
  const OTRA_CLASE = { id: 77, materia: "Matemáticas", curso: "4B", nivel: "primaria" };
  const JORNADA_PREESCOLAR = {
    id: 66,
    materia: "ASISTENCIA DIARIA",
    curso: "Transición A",
    curso_id: 5,
    nivel: "preescolar",
  };

  function prepararVariasClases(clases, { planillas = {}, rechazos = {} } = {}) {
    apiMock.get.mockImplementation((url) => {
      if (url === `/mis-clases/${PROFESOR_ID}`) return Promise.resolve({ data: clases });
      if (rechazos[url]) return Promise.reject(rechazos[url]);
      if (planillas[url]) return Promise.resolve({ data: planillas[url] });
      return Promise.reject(new Error(`GET no simulado: ${url}`));
    });
  }

  const planillaDe = (nombre) => ({
    columnas: ["quiz"],
    data: [{ estudiante_id: 900, nombre, apellido: "Prueba", notas: { quiz: 4 } }],
  });

  it("sin clase guardada pide elegirla en la misma pantalla, sin alerta, y al elegirla carga y la recuerda", async () => {
    localStorage.removeItem("asignacionId");
    prepararVariasClases([CLASE, OTRA_CLASE], {
      planillas: { [`/planilla-excel/77/${PERIODO}`]: planillaDe("Sara") },
    });
    const user = userEvent.setup();

    render(<Planilla />);

    expect(await screen.findByText("Elige arriba la clase que vas a calificar")).toBeInTheDocument();
    expect(window.alert).not.toHaveBeenCalled();
    expect(contarLlamadasPlanilla()).toBe(0);

    await user.selectOptions(screen.getByLabelText("Clase / grupo"), "77");

    expect(await within(screen.getByRole("table")).findByText("Prueba Sara")).toBeInTheDocument();
    expect(localStorage.getItem("asignacionId")).toBe("77");
  });

  it("no ofrece «Asistencia diaria» en la planilla y, si era la guardada, pide elegir otra", async () => {
    localStorage.setItem("asignacionId", "66");
    prepararVariasClases([CLASE, JORNADA_PREESCOLAR], {
      planillas: { [`/planilla-excel/66/${PERIODO}`]: planillaDe("Nadie") },
    });

    render(<Planilla />);

    expect(await screen.findByText("Elige arriba la clase que vas a calificar")).toBeInTheDocument();
    const opciones = within(screen.getByLabelText("Clase / grupo"))
      .getAllByRole("option")
      .map((opcion) => opcion.textContent);
    expect(opciones).toEqual(["Elige una clase", "Ciencias Naturales - 4B"]);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    // La elección no se borra: en Asistencia sigue sirviendo.
    expect(localStorage.getItem("asignacionId")).toBe("66");
  });

  it("al cambiar el período carga ese período y lo recuerda", async () => {
    prepararVariasClases([CLASE], {
      planillas: {
        [PLANILLA_URL]: { columnas: ["quiz"], data: ESTUDIANTES_INICIALES },
        [`/planilla-excel/${ASIGNACION_ID}/4`]: planillaDe("Periodo4"),
      },
    });
    const user = userEvent.setup();

    await abrirPlanilla();
    await user.selectOptions(screen.getByLabelText("Período"), "4");

    expect(await within(screen.getByRole("table")).findByText("Prueba Periodo4")).toBeInTheDocument();
    expect(localStorage.getItem(`periodo_profesor_${PROFESOR_ID}`)).toBe("4");
    expect(within(screen.getByRole("table")).queryByText("Ruiz Ana")).not.toBeInTheDocument();
  });

  it("si la clase guardada ya no es del profesor (403), la olvida y lo explica sin alerta", async () => {
    // La clase sigue en la lista (la lista pudo estar desactualizada): lo
    // que la descarta es la respuesta del servidor.
    prepararVariasClases([CLASE, OTRA_CLASE], {
      rechazos: { [PLANILLA_URL]: { response: { status: 403 } } },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<Planilla />);

    expect(
      await screen.findByText("La clase que tenías elegida ya no está asignada a ti. Elige otra arriba."),
    ).toBeInTheDocument();
    expect(localStorage.getItem("asignacionId")).toBeNull();
    expect(window.alert).not.toHaveBeenCalled();
  });
});
