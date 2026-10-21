import { describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import { avisarYEsperarCierre, TEXTO_CON_SALTOS } from "./ventanasAviso";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("ventanasAviso", () => {
    it("abre la ventana respetando los saltos de línea del texto", () => {
        avisarYEsperarCierre({ icon: "success", title: "Listo", text: "Uno\nDos" });

        expect(Swal.fire).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "success",
                title: "Listo",
                text: "Uno\nDos",
                customClass: TEXTO_CON_SALTOS,
            })
        );
        expect(TEXTO_CON_SALTOS).toEqual({ htmlContainer: "whitespace-pre-line" });
    });

    it("cumple la promesa solo cuando la ventana terminó de cerrarse", async () => {
        let cerrada = false;
        const promesa = avisarYEsperarCierre({ title: "Listo" }).then(() => {
            cerrada = true;
        });

        await Promise.resolve();
        expect(cerrada).toBe(false);

        Swal.fire.mock.calls.at(-1)[0].didClose();
        await promesa;

        expect(cerrada).toBe(true);
    });
});
