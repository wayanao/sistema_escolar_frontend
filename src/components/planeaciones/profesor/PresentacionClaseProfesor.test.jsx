import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useImagenProtegidaMock } = vi.hoisted(() => ({
  useImagenProtegidaMock: vi.fn(),
}));

vi.mock("../../../hooks/planeaciones/useImagenProtegida", () => ({
  useImagenProtegida: useImagenProtegidaMock,
}));

import PresentacionClaseProfesor from "./PresentacionClaseProfesor";

const formularioCompleto = {
  tema: "Fracciones equivalentes",
  unidad: "Números racionales",
  proposito: "Resolver situaciones cotidianas",
  estandar: "Pensamiento numérico",
  clase: "Exploración de saberes previos",
  competencias: "Trabajo colaborativo",
  dba: "Compara fracciones",
  actividad_casa: "Resolver los ejercicios propuestos",
};

function crearPropiedades(overrides = {}) {
  return {
    asignacion: {
      materia: "Matemáticas",
      curso: "5A",
      jornada: "Mañana",
    },
    periodo: "2",
    fecha: "2026-07-29",
    form: formularioCompleto,
    imagenesSeleccionadas: { imagen1: null, imagen2: null },
    imagenesGuardadas: { imagen1: null, imagen2: null },
    hayCambios: true,
    onCerrar: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  useImagenProtegidaMock.mockReset();
  useImagenProtegidaMock.mockImplementation((path) => ({
    url: path ? "https://auligo.test/evidencia-guardada.webp" : "",
    cargando: false,
    error: "",
  }));
  window.open = vi.fn();
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
  document.documentElement.style.overscrollBehavior = "";
});

describe("PresentacionClaseProfesor", () => {
  it("presenta el contexto y todas las secciones con contenido", () => {
    render(<PresentacionClaseProfesor {...crearPropiedades()} />);

    expect(
      screen.getByRole("dialog", { name: "Presentación de clase" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Fracciones equivalentes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Matemáticas")).toBeInTheDocument();
    expect(screen.getByText("Cambios sin guardar")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Contexto pedagógico" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Logro" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Actividad inicial" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Actividad en clase" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Desarrollo cognitivo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Actividad en casa" }),
    ).toBeInTheDocument();
  });

  it("cierra desde el botón y Escape, y restaura el scroll al desmontarse", async () => {
    const user = userEvent.setup();
    const props = crearPropiedades();
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "scroll";
    document.documentElement.style.overscrollBehavior = "contain";

    const { unmount } = render(<PresentacionClaseProfesor {...props} />);

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overscrollBehavior).toBe("none");

    await user.click(screen.getByRole("button", { name: "Volver a editar" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(props.onCerrar).toHaveBeenCalledTimes(2);

    unmount();

    expect(document.body.style.overflow).toBe("auto");
    expect(document.documentElement.style.overflow).toBe("scroll");
    expect(document.documentElement.style.overscrollBehavior).toBe("contain");
  });

  it("muestra el estado vacío y los valores de contexto alternativos", () => {
    render(
      <PresentacionClaseProfesor
        {...crearPropiedades({
          asignacion: {
            materia: "Ciencias",
            curso: "6B",
            jornada: "",
          },
          periodo: "",
          fecha: "",
          form: Object.fromEntries(
            Object.keys(formularioCompleto).map((campo) => [campo, " "]),
          ),
          hayCambios: false,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Clase sin tema registrado" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "La guía todavía no tiene contenido",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Sin definir")).toHaveLength(2);
    expect(screen.getByText("Sin fecha")).toBeInTheDocument();
    expect(screen.queryByText("Cambios sin guardar")).not.toBeInTheDocument();
  });

  it("abre una evidencia seleccionada sin solicitar una imagen guardada", async () => {
    const user = userEvent.setup();
    const imagenLocal = {
      url: "blob:https://auligo.test/evidencia-local",
      nombre: "actividad.png",
    };

    render(
      <PresentacionClaseProfesor
        {...crearPropiedades({
          imagenesSeleccionadas: { imagen1: imagenLocal, imagen2: null },
        })}
      />,
    );

    expect(
      screen.getByAltText("Evidencia de desarrollo cognitivo"),
    ).toHaveAttribute("src", imagenLocal.url);
    expect(screen.getByText("actividad.png")).toBeInTheDocument();
    expect(useImagenProtegidaMock).toHaveBeenCalledWith("");

    await user.click(
      screen.getByRole("button", { name: "Ver imagen completa" }),
    );

    expect(window.open).toHaveBeenCalledWith(
      imagenLocal.url,
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("resuelve la URL protegida de una evidencia guardada", () => {
    render(
      <PresentacionClaseProfesor
        {...crearPropiedades({
          imagenesGuardadas: {
            imagen1: null,
            imagen2: "planeaciones/actividad-casa.webp",
          },
        })}
      />,
    );

    expect(useImagenProtegidaMock).toHaveBeenCalledWith(
      "planeaciones/actividad-casa.webp",
    );
    expect(screen.getByAltText("Evidencia de actividad en casa")).toHaveAttribute(
      "src",
      "https://auligo.test/evidencia-guardada.webp",
    );
  });
  it("reproduce el video escrito en el plan sin cerrar la presentación", async () => {
    const user = userEvent.setup();
    const propiedades = crearPropiedades({
      form: {
        ...formularioCompleto,
        dba: "Ver el video https://youtu.be/dQw4w9WgXcQ antes del taller",
      },
    });
    render(<PresentacionClaseProfesor {...propiedades} />);

    await user.click(screen.getByRole("button", { name: /Reproducir video/ }));
    expect(screen.getByTitle("Video de la planeación")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1",
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByTitle("Video de la planeación")).not.toBeInTheDocument();
    expect(propiedades.onCerrar).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(propiedades.onCerrar).toHaveBeenCalledTimes(1);
  });
  it("abre el PDF adjunto sobre la clase, sin cerrar la presentación", async () => {
    const user = userEvent.setup();
    const propiedades = crearPropiedades({
      imagenesGuardadas: {
        imagen1: "uploads/tenant_demo/plan_de_clases/taller.pdf",
        imagen2: null,
      },
    });
    render(<PresentacionClaseProfesor {...propiedades} />);

    expect(
      screen.queryByTitle("Evidencia de desarrollo cognitivo"),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "Abrir documento: Evidencia de desarrollo cognitivo",
      }),
    );

    expect(
      screen.getByTitle("Evidencia de desarrollo cognitivo"),
    ).toHaveAttribute("src", "https://auligo.test/evidencia-guardada.webp");
    expect(window.open).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByTitle("Evidencia de desarrollo cognitivo"),
    ).not.toBeInTheDocument();
    expect(propiedades.onCerrar).not.toHaveBeenCalled();
  });

  it("sigue abriendo las imágenes en otra pestaña", async () => {
    const user = userEvent.setup();
    render(
      <PresentacionClaseProfesor
        {...crearPropiedades({
          imagenesGuardadas: {
            imagen1: "uploads/tenant_demo/plan_de_clases/foto.webp",
            imagen2: null,
          },
        })}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Ver imagen completa: Evidencia de desarrollo cognitivo",
      }),
    );

    expect(window.open).toHaveBeenCalledWith(
      "https://auligo.test/evidencia-guardada.webp",
      "_blank",
      "noopener,noreferrer",
    );
  });
});
