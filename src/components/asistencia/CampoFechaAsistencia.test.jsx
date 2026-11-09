import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CampoFechaAsistencia from "./CampoFechaAsistencia";

const HOY = "2026-11-09";

describe("CampoFechaAsistencia", () => {
    it("con la fecha de hoy lo dice y no ofrece volver", () => {
        render(<CampoFechaAsistencia value={HOY} hoy={HOY} onChange={vi.fn()} />);

        expect(screen.getByLabelText("Fecha")).toHaveValue(HOY);
        expect(screen.getByLabelText("Fecha")).toHaveAttribute("max", HOY);
        expect(screen.getByText("Es la fecha de hoy.")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Volver a hoy" })).not.toBeInTheDocument();
    });

    it("con otra fecha avisa que no es hoy y deja volver a hoy", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<CampoFechaAsistencia value="2026-11-03" hoy={HOY} onChange={onChange} />);

        expect(screen.getByText("No es hoy.")).toBeInTheDocument();
        expect(screen.getByText(/martes, 3 de noviembre|martes 3 de noviembre/)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Volver a hoy" }));
        expect(onChange).toHaveBeenCalledWith(HOY);
    });

    it("solo avisa fechas completas y no futuras; al salir vuelve a la vigente", () => {
        const onChange = vi.fn();
        render(<CampoFechaAsistencia value={HOY} hoy={HOY} onChange={onChange} />);
        const campo = screen.getByLabelText("Fecha");

        fireEvent.change(campo, { target: { value: "0202-11-05" } });
        fireEvent.change(campo, { target: { value: "2026-12-01" } });
        expect(onChange).not.toHaveBeenCalled();

        fireEvent.blur(campo);
        expect(campo).toHaveValue(HOY);

        fireEvent.change(campo, { target: { value: "2026-11-05" } });
        expect(onChange).toHaveBeenCalledWith("2026-11-05");
    });
});
