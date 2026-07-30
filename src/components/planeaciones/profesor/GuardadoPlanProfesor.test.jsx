import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GuardadoPlanProfesor from "./GuardadoPlanProfesor";

function crearPropiedades(overrides = {}) {
  return {
    guardando: false,
    cargando: false,
    buttonText: "Guardar y enviar",
    mensaje: "",
    onGuardar: vi.fn(),
    ...overrides,
  };
}

describe("GuardadoPlanProfesor", () => {
  it("ejecuta la acción con el texto correspondiente al estado", async () => {
    const user = userEvent.setup();
    const props = crearPropiedades({
      buttonText: "Guardar cambios",
      mensaje: "Tus cambios siguen visibles.",
    });
    render(<GuardadoPlanProfesor {...props} />);

    await user.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );

    expect(props.onGuardar).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Tus cambios siguen visibles.",
    );
  });

  it("muestra el progreso y bloquea acciones durante el guardado", () => {
    render(
      <GuardadoPlanProfesor
        {...crearPropiedades({
          guardando: true,
          buttonText: "Guardar cambios",
        })}
      />,
    );

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardando..." })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("bloquea temporalmente el botón mientras se carga el plan", () => {
    render(
      <GuardadoPlanProfesor
        {...crearPropiedades({
          cargando: true,
        })}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Guardar y enviar" }),
    ).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
