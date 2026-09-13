import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import TextoConEnlaces from "./TextoConEnlaces";

describe("TextoConEnlaces", () => {
  it("reproduce el video de YouTube sobre la clase, sin salir a otra pestaña", async () => {
    const user = userEvent.setup();
    render(
      <p>
        <TextoConEnlaces texto="Ver https://youtu.be/dQw4w9WgXcQ?t=30 antes del taller" />
      </p>,
    );

    expect(screen.queryByTitle("Video de la planeación")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Reproducir video/ }));

    expect(screen.getByTitle("Video de la planeación")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&start=30",
    );
    expect(
      screen.getByRole("link", { name: "Abrir en YouTube" }),
    ).toHaveAttribute("href", "https://youtu.be/dQw4w9WgXcQ?t=30");
  });

  it("cierra el reproductor con Escape sin cerrar la pantalla que lo contiene", async () => {
    const user = userEvent.setup();
    render(<TextoConEnlaces texto="https://youtu.be/dQw4w9WgXcQ" />);

    await user.click(screen.getByRole("button", { name: /Reproducir video/ }));
    expect(screen.getByTitle("Video de la planeación")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByTitle("Video de la planeación")).not.toBeInTheDocument();
  });

  it("abre en otra pestaña los enlaces que no son de YouTube, mostrando la URL", () => {
    render(<TextoConEnlaces texto="Guía en https://drive.test/guia.pdf para imprimir" />);

    const enlace = screen.getByRole("link", { name: "https://drive.test/guia.pdf" });
    expect(enlace).toHaveAttribute("href", "https://drive.test/guia.pdf");
    expect(enlace).toHaveAttribute("target", "_blank");
    expect(enlace).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("conserva el texto que rodea al enlace", () => {
    const { container } = render(
      <TextoConEnlaces texto="Guía: https://drive.test/guia.pdf para imprimir" />,
    );

    expect(container).toHaveTextContent(
      "Guía: https://drive.test/guia.pdf para imprimir",
    );
  });

  it("no crea enlaces cuando el texto no tiene ninguno", () => {
    render(<TextoConEnlaces texto="Resolver la guía del cuaderno" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Resolver la guía del cuaderno")).toBeInTheDocument();
  });

  it("no crea enlaces con esquemas peligrosos", () => {
    render(<TextoConEnlaces texto="javascript:alert(1)" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
