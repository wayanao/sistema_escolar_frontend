import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "../utils/api";
import Swal from "sweetalert2";

vi.mock("../utils/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

import IngresoBoletinProfesor from "./IngresoBoletinProfesor";

// La primera carga de la página espera dos consultas simuladas y monta la
// vista previa y el membrete; con el equipo cargado (check:deploy) puede pasar
// del segundo que espera `findBy` por defecto.
const PRIMERA_CARGA = { timeout: 4000 };

const notasDe = (primeraObservacion, segundaObservacion) => [
  {
    tipo_nota: "logro_expresion_oral",
    tipo_evaluacion: "numerica",
    valor: 4,
    observacion_guardada: primeraObservacion,
  },
  {
    tipo_nota: "logro_lectura",
    tipo_evaluacion: "numerica",
    valor: 3,
    observacion_guardada: segundaObservacion,
  },
  {
    tipo_nota: "mas_alto",
    tipo_evaluacion: "numerica",
    valor: 5,
    observacion_guardada: "Dato técnico",
  },
];

describe("IngresoBoletinProfesor", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("profesor", JSON.stringify({ id: 7 }));
    localStorage.setItem("asignacionId", "55");
    localStorage.setItem("periodo_profesor_7", "1");

    api.get.mockImplementation((url) => {
      if (url === "/mis-clases/7") {
        return Promise.resolve({
          data: [
            { id: 55, curso: "Quinto", materia: "Lengua Castellana" },
          ],
        });
      }

      if (url === "/boletines/referencia/55/1") {
        return Promise.resolve({
          data: [
            {
              estudiante_id: 101,
              nombre: "Ana",
              notas: notasDe("Logro común", ""),
            },
            {
              estudiante_id: 102,
              nombre: "Bruno",
              notas: notasDe("", "Caso individual"),
            },
          ],
        });
      }

      return Promise.reject(new Error(`GET inesperado: ${url}`));
    });
    api.post.mockResolvedValue({ data: {} });
    Swal.fire.mockImplementation((opciones) => {
      if (opciones?.title === "Copiar a todos y guardar") {
        return Promise.resolve({ isConfirmed: true });
      }
      return Promise.resolve({});
    });
  });

  it("oculta campos técnicos y Copiar a todos y guardar llena vacíos, conserva lo individual y guarda", async () => {
    const user = userEvent.setup();
    render(<IngresoBoletinProfesor />);

    expect(await screen.findByRole("heading", { name: "Ana" }, PRIMERA_CARGA)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bruno" })).toBeInTheDocument();
    expect(screen.queryByText("Mas Alto")).not.toBeInTheDocument();

    const etiquetaHumana = screen.getAllByText("Logro Expresion Oral")[0];
    expect(etiquetaHumana).toHaveAttribute("translate", "no");

    let observaciones = screen.getAllByRole("textbox");
    expect(observaciones).toHaveLength(4);
    expect(observaciones[2]).toHaveValue("");
    expect(observaciones[3]).toHaveValue("Caso individual");

    expect(screen.getByText("Plantilla del grupo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copiar a todos y guardar" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
    observaciones = screen.getAllByRole("textbox");
    expect(observaciones[2]).toHaveValue("Logro común");
    expect(observaciones[3]).toHaveValue("Caso individual");
    expect(screen.queryByRole("button", { name: /Guardar todo/ })).not.toBeInTheDocument();
    expect(api.post).toHaveBeenNthCalledWith(1, "/boletines/guardar", {
      estudiante_id: 101,
      asignacion_id: 55,
      periodo: 1,
      definitiva: 3.5,
      detalles: [
        {
          nota: 4,
          observacion: "Logro común",
          tipo_evaluacion: "numerica",
          valoracion: null,
        },
        {
          nota: 3,
          observacion: "",
          tipo_evaluacion: "numerica",
          valoracion: null,
        },
      ],
    });
    expect(api.post).toHaveBeenNthCalledWith(2, "/boletines/guardar", {
      estudiante_id: 102,
      asignacion_id: 55,
      periodo: 1,
      definitiva: 3.5,
      detalles: [
        {
          nota: 4,
          observacion: "Logro común",
          tipo_evaluacion: "numerica",
          valoracion: null,
        },
        {
          nota: 3,
          observacion: "Caso individual",
          tipo_evaluacion: "numerica",
          valoracion: null,
        },
      ],
    });
  });

  it("permite salir y volver a una clase con más notas sin dejar la pantalla en blanco", async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url === "/mis-clases/7") {
        return Promise.resolve({
          data: [
            { id: 55, curso: "Primero A", materia: "Matemáticas" },
            { id: 56, curso: "Primero A", materia: "Ciencias" },
          ],
        });
      }
      if (url === "/boletines/referencia/55/1") {
        return Promise.resolve({
          data: [
            {
              estudiante_id: 101,
              nombre: "Ana",
              notas: notasDe("Suma correctamente", "Resta correctamente"),
            },
          ],
        });
      }
      if (url === "/boletines/referencia/56/1") {
        return Promise.resolve({
          data: [
            {
              estudiante_id: 101,
              nombre: "Ana",
              notas: [
                {
                  tipo_nota: "entorno_natural",
                  tipo_evaluacion: "numerica",
                  valor: 4,
                  observacion_guardada: "Reconoce su entorno",
                },
              ],
            },
          ],
        });
      }
      return Promise.reject(new Error(`GET inesperado: ${url}`));
    });

    render(<IngresoBoletinProfesor />);

    expect(await screen.findByRole("heading", { name: "Ana" }, PRIMERA_CARGA)).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(2);

    const selectorClase = screen.getAllByRole("combobox")[0];
    await user.selectOptions(selectorClase, "56");
    await waitFor(() => {
      expect(screen.getAllByRole("textbox")).toHaveLength(1);
      expect(screen.getByDisplayValue("Reconoce su entorno")).toBeInTheDocument();
    });

    await user.selectOptions(selectorClase, "55");
    await waitFor(() => {
      expect(screen.getAllByRole("textbox")).toHaveLength(2);
      expect(screen.getByDisplayValue("Suma correctamente")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Resta correctamente")).toBeInTheDocument();
    });
  });

  it("Ver cómo queda muestra la materia con lo escrito sin guardar y pasa al siguiente", async () => {
    const user = userEvent.setup();
    const getOriginal = api.get.getMockImplementation();
    api.get.mockImplementation((url) => {
      if (url === "/branding") {
        return Promise.resolve({ data: { nombre_institucion: "Colegio Prueba" } });
      }
      if (url === "/plantillas/activa/boletin") {
        return Promise.resolve({ data: { config_json: {} } });
      }
      return getOriginal(url);
    });
    localStorage.setItem("profesor", JSON.stringify({ id: 7, nombre: "Lina Torres" }));

    render(<IngresoBoletinProfesor />);
    expect(await screen.findByRole("heading", { name: "Ana" }, PRIMERA_CARGA)).toBeInTheDocument();

    const [primerLogroDeAna] = screen.getAllByRole("textbox");
    await user.clear(primerLogroDeAna);
    await user.type(primerLogroDeAna, "Expresa sus ideas con claridad");

    const [verAna] = screen.getAllByRole("button", { name: "Ver cómo queda" });
    await user.click(verAna);

    const ventana = await screen.findByRole("dialog", { name: "Vista previa del boletín de Ana" });
    expect(await within(ventana).findByText("Colegio Prueba")).toBeInTheDocument();
    expect(within(ventana).getByText("Lengua Castellana")).toBeInTheDocument();
    expect(within(ventana).getByText(/Docente: Lina Torres/)).toBeInTheDocument();
    expect(within(ventana).getByText("Expresa sus ideas con claridad")).toBeInTheDocument();
    expect(within(ventana).getByText("Cambios sin guardar")).toBeInTheDocument();
    expect(within(ventana).queryByRole("button", { name: "Imprimir" })).not.toBeInTheDocument();
    // Ver la vista previa no guarda nada.
    expect(api.post).not.toHaveBeenCalled();

    await user.click(within(ventana).getByRole("button", { name: "Siguiente →" }));
    const ventanaBruno = screen.getByRole("dialog", {
      name: "Vista previa del boletín de Bruno",
    });
    expect(within(ventanaBruno).getByText("Caso individual")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("la vista previa trae sus otras materias del mismo curso y no las de otro curso", async () => {
    const user = userEvent.setup();
    const getOriginal = api.get.getMockImplementation();
    api.get.mockImplementation((url) => {
      if (url === "/mis-clases/7") {
        return Promise.resolve({
          data: [
            { id: 55, curso: "Quinto", curso_id: 5, materia: "Lengua Castellana" },
            { id: 56, curso: "Quinto", curso_id: 5, materia: "Ciencias Naturales" },
            { id: 90, curso: "Sexto", curso_id: 6, materia: "Ciencias Naturales" },
          ],
        });
      }
      if (url === "/boletines/referencia/56/1") {
        return Promise.resolve({
          data: [
            {
              estudiante_id: 101,
              nombre: "Ana",
              notas: [
                { tipo_nota: "experimento", tipo_evaluacion: "numerica", valor: 4.2, observacion_guardada: "Formula hipótesis sencillas" },
              ],
            },
          ],
        });
      }
      if (url === "/branding") return Promise.resolve({ data: { nombre_institucion: "Colegio Prueba" } });
      if (url === "/plantillas/activa/boletin") return Promise.resolve({ data: { config_json: {} } });
      return getOriginal(url);
    });

    render(<IngresoBoletinProfesor />);
    expect(await screen.findByRole("heading", { name: "Ana" }, PRIMERA_CARGA)).toBeInTheDocument();
    const [verAna] = screen.getAllByRole("button", { name: "Ver cómo queda" });
    await user.click(verAna);

    const ventana = await screen.findByRole("dialog", { name: "Vista previa del boletín de Ana" });
    expect(await within(ventana).findByText("Formula hipótesis sencillas")).toBeInTheDocument();
    expect(within(ventana).getByText("Vista previa · tus materias de este curso")).toBeInTheDocument();
    expect(
      within(ventana).getAllByRole("heading", { level: 3 }).map((titulo) => titulo.textContent),
    ).toEqual(["Lengua Castellana", "Ciencias Naturales"]);

    const pedidas = api.get.mock.calls.map(([url]) => url);
    expect(pedidas).toContain("/boletines/referencia/56/1");
    expect(pedidas.some((url) => url.startsWith("/boletines/referencia/90/"))).toBe(false);
    expect(api.post).not.toHaveBeenCalled();
  });

  describe("que no se pierda ni se cruce lo escrito", () => {
    it("si falla la carga al cambiar de periodo, no deja los textos del periodo anterior para guardarlos en el nuevo", async () => {
      const user = userEvent.setup();
      vi.spyOn(console, "error").mockImplementation(() => {});
      const getOriginal = api.get.getMockImplementation();
      let periodoDosFalla = true;
      api.get.mockImplementation((url) => {
        if (url === "/boletines/referencia/55/2") {
          return periodoDosFalla
            ? Promise.reject(new Error("sin red"))
            : Promise.resolve({
                data: [{ estudiante_id: 101, nombre: "Ana", notas: notasDe("Logro del periodo 2", "") }],
              });
        }
        return getOriginal(url);
      });

      render(<IngresoBoletinProfesor />);
      expect(await screen.findByRole("heading", { name: "Ana" }, PRIMERA_CARGA)).toBeInTheDocument();

      const selectorPeriodo = screen.getAllByRole("combobox")[1];
      await user.selectOptions(selectorPeriodo, "2");

      expect(
        await screen.findByText(/No se pudieron cargar los estudiantes de esta clase/),
      ).toBeInTheDocument();
      // Las tarjetas del periodo 1 ya no están: no hay nada que guardar en el 2.
      expect(screen.queryByRole("heading", { name: "Ana" })).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue("Logro común")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Copiar a todos y guardar" })).not.toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();

      periodoDosFalla = false;
      await user.click(screen.getByRole("button", { name: "Reintentar" }));
      expect(await screen.findByDisplayValue("Logro del periodo 2")).toBeInTheDocument();
      expect(screen.queryByText(/No se pudieron cargar los estudiantes/)).not.toBeInTheDocument();
    });

    it("si sale de la pantalla sin guardar y vuelve, encuentra lo que escribió", async () => {
      const user = userEvent.setup();
      const primera = render(<IngresoBoletinProfesor />);
      expect(await screen.findByRole("heading", { name: "Ana" }, PRIMERA_CARGA)).toBeInTheDocument();
      const [primerLogro] = screen.getAllByRole("textbox");
      await user.clear(primerLogro);
      await user.type(primerLogro, "Texto sin guardar");

      // Se va a otra parte del perfil (la pantalla se cierra) y vuelve.
      primera.unmount();
      render(<IngresoBoletinProfesor />);

      expect(await screen.findByDisplayValue("Texto sin guardar")).toBeInTheDocument();
      expect(screen.getByText("Recuperamos lo que no habías guardado")).toBeInTheDocument();
      expect(screen.getAllByText("Cambios sin guardar").length).toBeGreaterThan(0);
      expect(api.post).not.toHaveBeenCalled();
    });

    it("cambia de periodo sin preguntar y, al volver, lo escrito sigue ahí", async () => {
      const user = userEvent.setup();
      const getOriginal = api.get.getMockImplementation();
      api.get.mockImplementation((url) =>
        url === "/boletines/referencia/55/2"
          ? Promise.resolve({ data: [{ estudiante_id: 101, nombre: "Ana", notas: notasDe("Del periodo 2", "") }] })
          : getOriginal(url),
      );

      render(<IngresoBoletinProfesor />);
      expect(await screen.findByRole("heading", { name: "Ana" }, PRIMERA_CARGA)).toBeInTheDocument();
      const [primerLogro] = screen.getAllByRole("textbox");
      await user.clear(primerLogro);
      await user.type(primerLogro, "Texto del periodo 1");

      const selectorPeriodo = screen.getAllByRole("combobox")[1];
      await user.selectOptions(selectorPeriodo, "2");
      expect(await screen.findByDisplayValue("Del periodo 2")).toBeInTheDocument();
      expect(Swal.fire).not.toHaveBeenCalledWith(
        expect.objectContaining({ title: "Tienes cambios sin guardar" }),
      );
      // Lo del periodo 1 no se mezcla con el 2.
      expect(screen.queryByDisplayValue("Texto del periodo 1")).not.toBeInTheDocument();

      await user.selectOptions(selectorPeriodo, "1");
      expect(await screen.findByDisplayValue("Texto del periodo 1")).toBeInTheDocument();
      expect(screen.getByText("Recuperamos lo que no habías guardado")).toBeInTheDocument();
    });

    it("si el navegador no deja guardar borradores, pregunta antes; Quedarme conserva lo escrito", async () => {
      const user = userEvent.setup();
      const original = Storage.prototype.setItem;
      const espia = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (clave, valor) {
        if (String(clave).includes("borrador")) throw new Error("QuotaExceededError");
        return original.call(this, clave, valor);
      });
      const getOriginal = api.get.getMockImplementation();
      api.get.mockImplementation((url) =>
        url === "/boletines/referencia/55/2"
          ? Promise.resolve({ data: [{ estudiante_id: 101, nombre: "Ana", notas: notasDe("Del periodo 2", "") }] })
          : getOriginal(url),
      );
      let respuestaAlCambiar = { isConfirmed: false };
      Swal.fire.mockImplementation((opciones) =>
        Promise.resolve(opciones?.title === "Tienes cambios sin guardar" ? respuestaAlCambiar : {}),
      );

      try {
        render(<IngresoBoletinProfesor />);
        expect(await screen.findByRole("heading", { name: "Ana" }, PRIMERA_CARGA)).toBeInTheDocument();
        const [primerLogro] = screen.getAllByRole("textbox");
        await user.clear(primerLogro);
        await user.type(primerLogro, "Texto sin guardar");

        const selectorPeriodo = screen.getAllByRole("combobox")[1];
        await user.selectOptions(selectorPeriodo, "2");

        await waitFor(() =>
          expect(Swal.fire).toHaveBeenCalledWith(
            expect.objectContaining({
              title: "Tienes cambios sin guardar",
              text: "Un estudiante tiene cambios sin guardar. Si cambias de clase o de periodo, se pierden.",
            }),
          ),
        );
        expect(selectorPeriodo).toHaveValue("1");
        expect(screen.getByDisplayValue("Texto sin guardar")).toBeInTheDocument();

        respuestaAlCambiar = { isConfirmed: true };
        await user.selectOptions(selectorPeriodo, "2");
        expect(await screen.findByDisplayValue("Del periodo 2")).toBeInTheDocument();
        expect(selectorPeriodo).toHaveValue("2");
      } finally {
        espia.mockRestore();
      }
    });
  });

  describe("Mi curso del director de grupo", () => {
    it("el director abre Mi curso y ve el ranking de su curso en el periodo de la pantalla", async () => {
      const user = userEvent.setup();
      const getOriginal = api.get.getMockImplementation();
      api.get.mockImplementation((url) => {
        if (url === "/director-grupo/cursos") {
          return Promise.resolve({ data: [{ id: 5, nombre: "QUINTO A" }] });
        }
        if (url === "/director-grupo/cursos/5/1") {
          return Promise.resolve({
            data: {
              curso: { id: 5, nombre: "QUINTO A" },
              periodo: 1,
              total_rankeados: 1,
              materias: [{ asignacion_id: 55, materia: "LENGUA CASTELLANA", profesor: "Lina Torres", tipo_evaluacion: "numerica", guardados: 1, total: 1 }],
              estudiantes: [{ estudiante_id: 101, nombre: "Ana", apellido: "Pérez", puesto: 1, promedio: 4.2, notas: { 55: { definitiva: 4.2, guardada: true } }, inasistencias: { periodo: 2, anio: 4 } }],
            },
          });
        }
        return getOriginal(url);
      });

      render(<IngresoBoletinProfesor />);
      await user.click(await screen.findByRole("tab", { name: "Mi curso (director de grupo)" }, PRIMERA_CARGA));

      expect(await screen.findByRole("heading", { name: "QUINTO A · Periodo 1" })).toBeInTheDocument();
      expect(screen.getByRole("rowheader", { name: "Pérez Ana" })).toBeInTheDocument();
      expect(screen.getByText(/Todas las materias están guardadas/)).toBeInTheDocument();
      expect(api.get).toHaveBeenCalledWith("/director-grupo/cursos/5/1", expect.anything());

      await user.click(screen.getByRole("tab", { name: "Mis materias" }));
      expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    });

    it("quien no dirige ningún curso no ve la pestaña", async () => {
      const getOriginal = api.get.getMockImplementation();
      api.get.mockImplementation((url) =>
        url === "/director-grupo/cursos" ? Promise.resolve({ data: [] }) : getOriginal(url),
      );

      render(<IngresoBoletinProfesor />);
      expect(await screen.findByRole("heading", { name: "Ana" }, PRIMERA_CARGA)).toBeInTheDocument();
      await waitFor(() => expect(api.get).toHaveBeenCalledWith("/director-grupo/cursos", expect.anything()));
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });
  });
});
